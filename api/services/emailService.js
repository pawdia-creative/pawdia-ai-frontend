import { Resend } from 'resend';

// 延迟初始化Resend客户端，确保环境变量已加载
let resend;

const getResendClient = () => {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
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
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
    
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: '验证您的 Pawdia AI 邮箱',
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
              <h1>欢迎来到 Pawdia AI</h1>
              <p>请验证您的邮箱地址以完成注册</p>
            </div>
            <div class="content">
              <h2>您好 ${name}，</h2>
              <p>感谢您注册 Pawdia AI 服务！请点击下面的按钮验证您的邮箱地址：</p>
              
              <a href="${verificationUrl}" class="button">验证邮箱</a>
              
              <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
              
              <p>此验证链接将在 24 小时后过期。</p>
              
              <p>如果您没有注册 Pawdia AI，请忽略此邮件。</p>
            </div>
            <div class="footer">
              <p>© 2025 Pawdia AI. 保留所有权利。</p>
              <p>如果您有任何问题，请联系：support@pawdia-ai.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('发送验证邮件失败:', error);
      return false;
    }

    console.log('验证邮件发送成功:', data);
    return true;
  } catch (error) {
    console.error('发送验证邮件时出错:', error);
    return false;
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
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: '重置您的 Pawdia AI 密码',
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
              <h1>密码重置请求</h1>
              <p>请点击下面的链接重置您的密码</p>
            </div>
            <div class="content">
              <h2>您好 ${name}，</h2>
              <p>我们收到了您重置 Pawdia AI 账户密码的请求。请点击下面的按钮重置您的密码：</p>
              
              <a href="${resetUrl}" class="button">重置密码</a>
              
              <p>如果按钮无法点击，请复制以下链接到浏览器中打开：</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              
              <p>此重置链接将在 1 小时后过期。</p>
              
              <p>如果您没有请求重置密码，请忽略此邮件，您的账户仍然是安全的。</p>
            </div>
            <div class="footer">
              <p>© 2025 Pawdia AI. 保留所有权利。</p>
              <p>如果您有任何问题，请联系：support@pawdia-ai.com</p>
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