// Cloudflare Workers 兼容的 Pawdia AI 后端服务器
// 基于原 Express.js 服务器适配

import { createRequestHandler } from '@cloudflare/workers-express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { Resend } from 'resend';
import fetch from 'node-fetch';

// Cloudflare Workers 兼容性导入
export default {
  async fetch(request, env, ctx) {
    try {
      // CORS 预检请求处理
      if (request.method === 'OPTIONS') {
        return handleOptions(request);
      }

      // 创建 Express 应用实例
      const app = express();
      
      // 安全中间件
      app.use(helmet({
        contentSecurityPolicy: false, // Workers 环境下禁用
      }));
      
      app.use(cors({
        origin: env.CORS_ORIGIN || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      }));
      
      // 速率限制
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100, // 限制每个IP 15分钟内最多100个请求
        message: {
          error: 'Too many requests from this IP, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      });
      app.use('/api/', limiter);
      
      // 请求解析中间件
      app.use(express.json({ limit: '10mb' }));
      app.use(express.urlencoded({ extended: true, limit: '10mb' }));
      
      // 日志中间件
      app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${request.headers.get('cf-connecting-ip')}`);
        next();
      });
      
      // 认证中间件
      const authenticateToken = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
          return res.status(401).json({ 
            error: 'Access token required',
            code: 'TOKEN_REQUIRED'
          });
        }
        
        jwt.verify(token, env.JWT_SECRET, (err, user) => {
          if (err) {
            return res.status(403).json({ 
              error: 'Invalid or expired token',
              code: 'TOKEN_INVALID'
            });
          }
          req.user = user;
          next();
        });
      };
      
      // 健康检查端点
      app.get('/api/health', (req, res) => {
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: 'cloudflare-workers',
          version: '1.0.0'
        });
      });
      
      // 用户认证相关路由
      app.post('/api/auth/register', async (req, res) => {
        try {
          const { email, password, name } = req.body;
          
          // 验证输入
          if (!email || !password || !name) {
            return res.status(400).json({
              error: 'Email, password, and name are required',
              code: 'MISSING_FIELDS'
            });
          }
          
          // 检查用户是否已存在（这里可以集成到 D1 数据库）
          // 示例逻辑
          const hashedPassword = await bcrypt.hash(password, 10);
          
          res.json({
            success: true,
            message: 'User registered successfully',
            user: {
              id: Date.now().toString(),
              email,
              name,
              createdAt: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error('Registration error:', error);
          res.status(500).json({
            error: 'Registration failed',
            code: 'REGISTRATION_ERROR'
          });
        }
      });
      
      app.post('/api/auth/login', async (req, res) => {
        try {
          const { email, password } = req.body;
          
          // 验证输入
          if (!email || !password) {
            return res.status(400).json({
              error: 'Email and password are required',
              code: 'MISSING_FIELDS'
            });
          }
          
          // 生成 JWT token
          const token = jwt.sign(
            { email, id: Date.now().toString() },
            env.JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          res.json({
            success: true,
            token,
            user: {
              email,
              name: 'User'
            }
          });
        } catch (error) {
          console.error('Login error:', error);
          res.status(500).json({
            error: 'Login failed',
            code: 'LOGIN_ERROR'
          });
        }
      });
      
      // Stripe 支付处理
      app.post('/api/payments/create-payment-intent', authenticateToken, async (req, res) => {
        try {
          const stripe = new Stripe(env.STRIPE_SECRET_KEY);
          const { amount, currency = 'usd', description } = req.body;
          
          if (!amount || amount < 50) {
            return res.status(400).json({
              error: 'Amount must be at least $0.50',
              code: 'INVALID_AMOUNT'
            });
          }
          
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // 转换为分
            currency,
            description,
            metadata: {
              userId: req.user.id
            }
          });
          
          res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
          });
        } catch (error) {
          console.error('Payment error:', error);
          res.status(500).json({
            error: 'Payment processing failed',
            code: 'PAYMENT_ERROR'
          });
        }
      });
      
      // 邮件发送
      app.post('/api/email/send', authenticateToken, async (req, res) => {
        try {
          const resend = new Resend(env.RESEND_API_KEY);
          const { to, subject, html } = req.body;
          
          const result = await resend.emails.send({
            from: 'noreply@pawdia-ai.com',
            to,
            subject,
            html
          });
          
          res.json({
            success: true,
            messageId: result.id
          });
        } catch (error) {
          console.error('Email error:', error);
          res.status(500).json({
            error: 'Email sending failed',
            code: 'EMAIL_ERROR'
          });
        }
      });
      
      // 文件上传到 Cloudinary
      app.post('/api/upload', authenticateToken, async (req, res) => {
        try {
          // 这里需要实现文件上传逻辑
          // 可以使用 Cloudinary 的直接上传 API
          
          res.json({
            success: true,
            url: 'https://example.com/uploaded-file.jpg',
            publicId: 'sample_public_id'
          });
        } catch (error) {
          console.error('Upload error:', error);
          res.status(500).json({
            error: 'File upload failed',
            code: 'UPLOAD_ERROR'
          });
        }
      });
      
      // 错误处理中间件
      app.use((error, req, res, next) => {
        console.error('Unhandled error:', error);
        res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      });
      
      // 404 处理
      app.use('*', (req, res) => {
        res.status(404).json({
          error: 'Endpoint not found',
          code: 'NOT_FOUND',
          path: req.originalUrl
        });
      });
      
      // 创建请求处理器
      const handler = createRequestHandler(app);
      return handler(request, env, ctx);
      
    } catch (error) {
      console.error('Workers fetch error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

// 处理 CORS 预检请求
function handleOptions(request) {
  const headers = {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };
  
  return new Response(null, {
    status: 204,
    headers
  });
}