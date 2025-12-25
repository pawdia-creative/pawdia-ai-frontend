import { Resend } from 'resend';
import d1Database from '../config/d1-database.js';
import crypto from 'crypto';

// 延迟初始化Resend客户端，确保环境变量已加载
let resend;

const getResendClient = () => {
  if (!resend) {
    // 在 Workers 环境中，使用 globalThis.env 或传入的 env
    const apiKey = globalThis.env?.RESEND_API_KEY || process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY environment variable is not set, email service will be disabled');
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
};

/**
 * 发送邮箱验证邮件
 * @param {string} to - 收件人邮箱
 * @param {string} name - 收件人姓名
 * @param {string} verificationToken - 验证令牌
 * @returns {Promise<boolean>} - 发送是否成功
 */
export const sendVerificationEmail = async (to, name, verificationToken) => {
  try {
    // 在 Workers 环境中，使用 globalThis.env
    // Prefer explicit APP_URL, but fall back to CLIENT_URL (wrangler vars) for compatibility.
    const appUrl = globalThis.env?.APP_URL || globalThis.env?.CLIENT_URL || process.env.APP_URL || process.env.CLIENT_URL;
    const fromEmail = globalThis.env?.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
    const apiKey = globalThis.env?.RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    // 详细的配置检查
    if (!apiKey) {
      console.error('[EMAIL ERROR] RESEND_API_KEY is not set');
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    
    if (!appUrl) {
      console.error('[EMAIL ERROR] APP_URL/CLIENT_URL is not set');
      throw new Error('APP_URL or CLIENT_URL environment variable is not set');
    }
    
    if (!fromEmail) {
      console.error('[EMAIL ERROR] RESEND_FROM_EMAIL is not set');
      throw new Error('RESEND_FROM_EMAIL environment variable is not set');
    }
    
    console.log('[EMAIL DEBUG] Configuration:', {
      appUrl,
      fromEmail,
      to,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0
    });
    
    const client = getResendClient();
    if (!client) {
      console.error('[EMAIL ERROR] Failed to initialize Resend client');
      throw new Error('Failed to initialize Resend client');
    }
    
    const encodedToken = encodeURIComponent(verificationToken);
    const verificationUrlQuery = `${appUrl}/verify-email?token=${encodedToken}`;
    const verificationUrlPath = `${appUrl}/verify-email/${encodedToken}`;

    // Prefer an explicit API worker base for short links so email clients (QQ) open a server-rendered page.
    const apiBase = globalThis.env?.API_WORKER_URL || globalThis.env?.API_URL || process.env.API_WORKER_URL || process.env.API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev';

    // Create a short id and store mapping in D1 to support clients that strip query strings
    let shortId = null;
    try {
      // Generate an 8-character base36 short id
      shortId = Math.random().toString(36).substring(2, 10);
      const db = await d1Database.connect(globalThis.env);
      if (db) {
        // Ensure table exists
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS short_links (
            id TEXT PRIMARY KEY,
            token TEXT,
            created_at INTEGER,
            expires_at INTEGER
          )
        `).run();

        const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        await db.prepare(`
          INSERT OR REPLACE INTO short_links (id, token, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)
        `).bind(shortId, verificationToken, Date.now(), expiresAt).run();
      } else {
        shortId = null;
      }
    } catch (err) {
      console.error('[EMAIL] Short link creation failed:', err);
      shortId = null;
    }

    // Short link should point to API worker verify route to render a friendly HTML success page.
    const verificationShort = shortId ? `${apiBase}/api/auth/v/${shortId}` : null;
    
    console.log('[EMAIL DEBUG] Sending email to:', to, 'from:', fromEmail);
    console.log('[EMAIL DEBUG] Verification URLs:', { verificationUrlQuery, verificationUrlPath, verificationShort });
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Verify your Pawdia AI email address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Pawdia AI</h1>
              <p>Please verify your email address to complete your registration</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for signing up for Pawdia AI! Please click the button below to verify your email address:</p>
              
              <!-- Primary verification button points to the API short link (server-rendered) to work in restrictive mail clients -->
              <a href="${verificationShort || verificationUrlQuery}" class="button">Verify Email</a>
              
              <p><strong>Note:</strong> If you're using QQ Mail and the button doesn't work, long-press the button to copy the link and paste it into your system browser (Chrome or Safari).</p>
              <p>If the button does not work, please copy and paste one of the links below into your browser (use system browser if QQ client blocks links):</p>
              ${verificationShort ? `<p><strong>Short link (recommended):</strong><br/><a href="${verificationShort}">${verificationShort}</a></p>` : `<p><a href="${verificationUrlQuery}">${verificationUrlQuery}</a></p>`}
              <p>Alternate path-based link (some email clients strip query parameters):</p>
              <p><a href="${verificationUrlPath}">${verificationUrlPath}</a></p>
              
              <p>This verification link will expire in 24 hours.</p>
              
              <p>If you did not sign up for Pawdia AI, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Pawdia AI. All rights reserved.</p>
              <p>If you have any questions, contact: support@pawdia-ai.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[EMAIL ERROR] Resend API error:', JSON.stringify(error, null, 2));
      console.error('[EMAIL ERROR] Error type:', typeof error);
      console.error('[EMAIL ERROR] Error keys:', Object.keys(error || {}));
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    console.log('[EMAIL SUCCESS] Email sent successfully');
    console.log('[EMAIL SUCCESS] Response data:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Exception caught:', error.message);
    console.error('[EMAIL ERROR] Error stack:', error.stack);
    console.error('[EMAIL ERROR] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw error; // 抛出错误而不是返回 false
  }
};

/**
 * 发送密码重置邮件
 * @param {string} to - 收件人邮箱
 * @param {string} name - 收件人姓名
 * @param {string} resetToken - 重置令牌
 * @returns {Promise<boolean>} - 发送是否成功
 */
export const sendPasswordResetEmail = async (to, name, resetToken) => {
  try {
    // 在 Workers 环境中，使用 globalThis.env
    const appUrl = globalThis.env?.APP_URL || process.env.APP_URL;
    const fromEmail = globalThis.env?.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
    
    if (!appUrl || !fromEmail) {
      console.error('Missing required environment variables: APP_URL or RESEND_FROM_EMAIL');
      return false;
    }
    
    const client = getResendClient();
    if (!client) {
      console.warn('Resend client not available, skipping email send');
      return false;
    }
    
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Reset your Pawdia AI password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password reset request</h1>
              <p>Please click the link below to reset your password</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>We received a request to reset your Pawdia AI account password. Please click the button below to reset your password:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <p>If the button does not work, please copy and paste the link below into your browser:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              
              <p>This reset link will expire in 1 hour.</p>
              
              <p>If you did not request a password reset, please ignore this email — your account is secure.</p>
            </div>
            <div class="footer">
              <p>© 2025 Pawdia AI. All rights reserved.</p>
              <p>If you have any questions, contact: support@pawdia-ai.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('发送密码重置邮件失败:', error);
      return false;
    }

    console.log('密码重置邮件发送成功:', data);
    return true;
  } catch (error) {
    console.error('发送密码重置邮件时出错:', error);
    return false;
  }
};

/**
 * Send contact form email to support address.
 * @param {{name:string,email:string,phone?:string,message:string}} contact
 * @returns {Promise<boolean>}
 */
export const sendContactEmail = async (contact) => {
  try {
    const client = getResendClient();
    if (!client) {
      console.error('[EMAIL CONTACT] Resend client not available');
      return false;
    }

    const fromEmail = globalThis.env?.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (!fromEmail) {
      console.error('[EMAIL CONTACT] RESEND_FROM_EMAIL not set');
      return false;
    }

    const supportEmail = globalThis.env?.SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || 'pawdia.creative@gmail.com';
    const subject = `Contact form: ${contact.name} <${contact.email}>`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#111">
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${contact.name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>
        <h3>Message</h3>
        <div style="white-space:pre-wrap; border:1px solid #eee; padding:12px; border-radius:6px; background:#fafafa;">
          ${contact.message || ''}
        </div>
      </div>
    `;

    const text = `New contact form submission\n\nName: ${contact.name}\nEmail: ${contact.email}\nPhone: ${contact.phone || 'N/A'}\n\nMessage:\n${contact.message || ''}\n`;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: supportEmail,
      subject,
      html,
      text
    });

    if (error) {
      console.error('[EMAIL CONTACT] Resend API error:', JSON.stringify(error, null, 2));
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    console.log('[EMAIL CONTACT] Sent contact email', JSON.stringify(data || {}, null, 2));
    return true;
  } catch (error) {
    console.error('[EMAIL CONTACT] Exception:', error);
    return false;
  }
};

/**
 * 发送支付收据邮件
 * @param {string} to - 收件人邮箱
 * @param {string} name - 收件人姓名
 * @param {object} order - 订单信息
 * @returns {Promise<boolean>} - 发送是否成功
 */
export const sendReceiptEmail = async (to, name, order) => {
  try {
    const appUrl = globalThis.env?.APP_URL || process.env.APP_URL;
    const fromEmail = globalThis.env?.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
    const apiKey = globalThis.env?.RESEND_API_KEY || process.env.RESEND_API_KEY;
    
    if (!apiKey || !appUrl || !fromEmail) {
      console.error('[EMAIL ERROR] Missing required environment variables');
      return false;
    }
    
    const client = getResendClient();
    if (!client) {
      console.warn('[EMAIL] Resend client not available');
      return false;
    }

    // Parse order items
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const orderType = order.order_type || 'product';
    const orderDate = order.completed_at 
      ? new Date(order.completed_at * 1000).toLocaleDateString('zh-CN')
      : new Date().toLocaleDateString('zh-CN');

    // Build items HTML
    let itemsHtml = '';
    if (items && Array.isArray(items)) {
      itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name || 'Product'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price || 0).toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
        </tr>
      `).join('');
    }

    // Determine order description
    let orderDescription = 'Product Purchase';
    if (orderType === 'subscription') {
      orderDescription = `${order.plan_id ? order.plan_id.charAt(0).toUpperCase() + order.plan_id.slice(1) : 'Subscription'} Subscription`;
    } else if (orderType === 'credits') {
      orderDescription = `${order.credits || 0} Credits Purchase`;
    }

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: `Pawdia AI - Payment Receipt #${order.paypal_order_id?.substring(0, 8) || 'N/A'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .receipt-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f5f5f5; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .total { font-size: 18px; font-weight: bold; color: #667eea; margin-top: 20px; text-align: right; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Receipt</h1>
              <p>Thank you for your purchase!</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for your purchase at Pawdia AI. Your payment has been processed successfully.</p>
              
              <div class="receipt-box">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${order.paypal_order_id || 'N/A'}</p>
                <p><strong>Order Type:</strong> ${orderDescription}</p>
                <p><strong>Date:</strong> ${orderDate}</p>
                <p><strong>Status:</strong> <span style="color: green;">${order.status || 'COMPLETED'}</span></p>
                
                ${items && items.length > 0 ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: right;">Price</th>
                        <th style="text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                  <div class="total">
                    Total: ${order.currency || 'USD'} $${(order.total_amount || 0).toFixed(2)}
                  </div>
                ` : `
                  <p><strong>Amount:</strong> ${order.currency || 'USD'} $${(order.total_amount || 0).toFixed(2)}</p>
                  ${order.credits ? `<p><strong>Credits Added:</strong> ${order.credits}</p>` : ''}
                `}
              </div>
              
              <p>If you have any questions about this order, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2025 Pawdia AI. All rights reserved.</p>
              <p>For support, contact: support@pawdia-ai.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[EMAIL ERROR] Failed to send receipt email:', error);
      return false;
    }

    console.log('[EMAIL SUCCESS] Receipt email sent successfully');
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Exception sending receipt email:', error);
    return false;
  }
};