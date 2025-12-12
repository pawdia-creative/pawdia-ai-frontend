import Database from 'better-sqlite3';

// Cloudflare D1 Database Configuration
class D1Database {
  constructor() {
    this.db = null;
    this.isConnected = false;
  }

  // Connect to D1 database
  async connect() {
    try {
      // For Cloudflare D1, we need to use the D1 API
      // In development, we'll use a local SQLite database
      // In production, this will connect to Cloudflare D1
      
      if (process.env.NODE_ENV === 'production') {
        // Cloudflare D1 connection (requires Cloudflare Workers environment)
        // This would typically be handled through Cloudflare's D1 binding
        console.log('🔗 Connecting to Cloudflare D1 database...');
        
        // In production, we would use the D1 binding
        // For now, we'll use a local SQLite database as fallback
        this.db = new Database(':memory:');
        console.log('⚠️  D1 binding not available, using in-memory SQLite for development');
      } else {
        // Development: Use local SQLite database
        console.log('🔗 Connecting to local SQLite database for development...');
        this.db = new Database('./pawdia-ai-db.sqlite');
      }

      // Initialize database schema
      await this.initializeSchema();
      
      this.isConnected = true;
      console.log('✅ Database connected successfully');
      
      return this.db;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      
      // Fallback to in-memory database
      console.log('🔄 Falling back to in-memory database...');
      this.db = new Database(':memory:');
      await this.initializeSchema();
      this.isConnected = true;
      
      return this.db;
    }
  }

  // Initialize database schema
  async initializeSchema() {
    try {
      // Create users table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar TEXT,
          credits INTEGER DEFAULT 3,
          subscription_plan TEXT CHECK(subscription_plan IN ('free', 'basic', 'premium')),
          subscription_expires_at DATETIME,
          subscription_status TEXT CHECK(subscription_status IN ('active', 'expired', 'cancelled')),
          is_verified BOOLEAN DEFAULT 0,
          verification_token TEXT,
          reset_password_token TEXT,
          reset_password_expires DATETIME,
          is_admin BOOLEAN DEFAULT 0,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create orders table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          stripe_payment_intent_id TEXT,
          amount INTEGER NOT NULL,
          currency TEXT DEFAULT 'USD',
          status TEXT CHECK(status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create subscription_plans table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price_monthly INTEGER NOT NULL,
          price_yearly INTEGER,
          credits_per_month INTEGER NOT NULL,
          features TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ Database schema initialized');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error.message);
      throw error;
    }
  }

  // Get database instance
  getDB() {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.isConnected = false;
      console.log('🔌 Database connection closed');
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.db) {
        return { status: 'disconnected', message: 'Database not connected' };
      }
      
      // Simple query to test connection
      const result = this.db.prepare('SELECT 1 as test').get();
      return { 
        status: 'connected', 
        message: 'Database is healthy',
        testResult: result 
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: 'Database health check failed',
        error: error.message 
      };
    }
  }
}

// Create singleton instance
export default new D1Database();