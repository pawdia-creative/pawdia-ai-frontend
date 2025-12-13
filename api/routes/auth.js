import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body } from 'express-validator';
import User from '../models/D1User.js';
import auth from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { sendVerificationEmail } from '../services/emailService.js';

const router = express.Router();

// Get JWT_SECRET from environment variables
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

// Generate JWT token
const generateToken = (user) => {
  const JWT_SECRET = getJWTSecret();
  return jwt.sign({ 
    userId: user.id,
    isAdmin: user.isAdmin || false,
    email: user.email
  }, JWT_SECRET, { expiresIn: '7d' });
};

// Register user
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], handleValidationErrors, async (req, res) => {
  try {

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user with verification token
    const user = await User.create({ 
      email, 
      password, 
      name,
      verificationToken,
      isVerified: false
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, verificationToken);
    
    if (!emailSent) {
      console.warn('验证邮件发送失败，但用户已创建');
    }

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified
      },
      message: emailSent ? '注册成功！请检查您的邮箱以完成验证。' : '注册成功！但验证邮件发送失败，请联系客服。'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], handleValidationErrors, async (req, res) => {
  try {

    const { email, password } = req.body;

    // Find user using D1 database
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    // Find user using D1 database
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        credits: user.credits,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: '验证令牌是必需的' });
    }

    // Find user by verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: '无效的验证令牌或用户不存在' });
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - user.updatedAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (tokenAge > maxAge) {
      return res.status(400).json({ message: '验证链接已过期，请重新请求验证邮件' });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ 
      message: '邮箱验证成功！您现在可以正常使用 Pawdia AI 服务。',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: '邮箱验证过程中发生错误' });
  }
});

// Resend verification email
router.post('/resend-verification', auth, async (req, res) => {
  try {
    // Find user using D1 database
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: '邮箱已经验证过了' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken);

    if (!emailSent) {
      return res.status(500).json({ message: '验证邮件发送失败，请稍后重试' });
    }

    res.json({ message: '验证邮件已重新发送，请检查您的邮箱' });

  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({ message: '重新发送验证邮件时发生错误' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logout successful' });
});

export default router;