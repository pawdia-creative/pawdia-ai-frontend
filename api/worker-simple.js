import { Router } from 'itty-router';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import d1Database from './config/d1-database.js';

// Create router
const router = Router();

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Handle CORS preflight
router.options('*', () => {
  return new Response(null, { headers: corsHeaders, status: 204 });
});

// Health check endpoint
router.get('/api/health', (request, env) => {
  return new Response(JSON.stringify({
    status: 'OK',
    message: 'Pawdia AI API is running on Cloudflare Workers',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'production'
  }), {
    headers: corsHeaders
  });
});

// Initialize database schema
const initializeDatabase = async (env) => {
  try {
    // Ensure database is connected
    if (!d1Database.isConnected) {
      await d1Database.connect(env);
    }
    
    // Create users table using individual statements
    try {
      await d1Database.getDB().exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, credits INTEGER DEFAULT 3, is_verified INTEGER DEFAULT 0, is_admin INTEGER DEFAULT 0, last_login INTEGER, created_at INTEGER DEFAULT (unixepoch()));');
      console.log('✅ Database schema initialized');
    } catch (execError) {
      console.log('Trying alternative syntax...');
      // Try alternative syntax without unixepoch
      await d1Database.getDB().exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, credits INTEGER DEFAULT 3, is_verified INTEGER DEFAULT 0, is_admin INTEGER DEFAULT 0, last_login INTEGER, created_at INTEGER DEFAULT 0);');
      console.log('✅ Database schema initialized (alternative)');
    }
    
    // Add last_login column if it doesn't exist
    try {
      await d1Database.getDB().exec('ALTER TABLE users ADD COLUMN last_login INTEGER;');
      console.log('✅ Added last_login column');
    } catch (alterError) {
      // Column might already exist, ignore error
      console.log('⏭️ last_login column already exists or error:', alterError.message);
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};
const generateToken = (user, env) => {
  return jwt.sign({ 
    userId: user.id,
    isAdmin: user.isAdmin || false,
    email: user.email
  }, env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
};

// Validation helper
const validateRegistration = (body) => {
  const { name, email, password } = body;
  
  if (!name || name.trim().length < 2 || name.trim().length > 50) {
    throw new Error('Name must be between 2 and 50 characters');
  }
  
  if (!email || !email.includes('@')) {
    throw new Error('Please provide a valid email');
  }
  
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  return { name: name.trim(), email: email.toLowerCase().trim(), password };
};

const validateLogin = (body) => {
  const { email, password } = body;
  
  if (!email || !email.includes('@')) {
    throw new Error('Please provide a valid email');
  }
  
  if (!password) {
    throw new Error('Password is required');
  }
  
  return { email: email.toLowerCase().trim(), password };
};

// Register user
router.post('/api/auth/register', async (request, env) => {
  try {
    // Initialize database if needed
    await initializeDatabase(env);
    
    const body = await request.json();
    const { name, email, password } = validateRegistration(body);

    // Check if user already exists
    const stmt = await d1Database.getDB().prepare('SELECT id FROM users WHERE email = ?1');
    const existingUser = await stmt.bind(email.toLowerCase().trim()).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ message: 'User already exists' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Hash password
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const insertStmt = await d1Database.getDB().prepare(`
      INSERT INTO users (name, email, password, credits, is_verified, is_admin)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `);
    
    const result = await insertStmt.bind(
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      3, // free credits
      0, // not verified
      0  // not admin
    ).run();

    const token = generateToken({ id: result.meta.last_row_id, email, name }, env);
    
    return new Response(JSON.stringify({
      token,
      user: {
        id: result.meta.last_row_id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        isAdmin: false,
        isVerified: false
      },
      message: 'Registration successful! Please check your email to complete verification.'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ message: error.message || 'Server error' }), {
      status: 400,
      headers: corsHeaders
    });
  }
});

// Login user
router.post('/api/auth/login', async (request, env) => {
  try {
    // Initialize database if needed
    await initializeDatabase(env);
    
    const body = await request.json();
    const { email, password } = validateLogin(body);

    // Find user by email
    const stmt = await d1Database.getDB().prepare('SELECT * FROM users WHERE email = ?1');
    const user = await stmt.bind(email.toLowerCase().trim()).first();

    if (!user) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Update last login
    await d1Database.getDB().prepare('UPDATE users SET last_login = unixepoch() WHERE id = ?1').bind(user.id).run();

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, name: user.name }, env);
    
    return new Response(JSON.stringify({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: Boolean(user.is_admin),
        isVerified: Boolean(user.is_verified),
        credits: user.credits,
        avatar: user.avatar
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ message: error.message || 'Server error' }), {
      status: 400,
      headers: corsHeaders
    });
  }
});

// 404 handler
router.all('*', (request) => {
  return new Response(JSON.stringify({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: request.url.pathname
  }), {
    status: 404,
    headers: corsHeaders
  });
});

// Error handling
const errorHandler = (error) => {
  console.error('Worker Error:', error);
  return new Response(JSON.stringify({
    error: 'Internal Server Error',
    message: error.message || 'Something went wrong'
  }), {
    status: 500,
    headers: corsHeaders
  });
};

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Make environment available globally
      globalThis.env = env;
      
      // Handle the request
      return await router.handle(request, env, ctx);
    } catch (error) {
      return errorHandler(error);
    }
  }
};