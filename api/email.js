// Email utilities for Pawdia AI API

// Send email via Resend (primary service)
export async function sendViaResend(env, toEmail, toName, subject, html) {
  try {
    const resendKey = env.RESEND_API_KEY;
    if (!resendKey || resendKey.trim() === '') {
      return { sent: false, error: 'Resend API key not configured' };
    }

    // sanitize RESEND_FROM and optionally enforce expected verified domain
    let fromAddress = (env.RESEND_FROM || 'no-reply@pawdia-ai.com').trim();
    const expectedDomain = (env.RESEND_DOMAIN || '').trim().toLowerCase();
    try {
      const fromDomain = (fromAddress.split('@')[1] || '').toLowerCase();
      if (expectedDomain && fromDomain !== expectedDomain) {
        console.warn('RESEND_FROM domain mismatch, falling back to expected domain', { fromAddress, fromDomain, expectedDomain });
        fromAddress = `no-reply@${expectedDomain}`;
      }
    } catch (e) {
      console.warn('Failed to parse RESEND_FROM, using default', e);
      fromAddress = 'no-reply@pawdia-ai.com';
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toEmail,
        subject,
        html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend send error:', response.status, errorText);
      return { sent: false, error: `Resend API error: ${response.status} - ${errorText}` };
    }

    return { sent: true };
  } catch (e) {
    console.error('Resend send exception:', e);
    return { sent: false, error: `Resend exception: ${String(e)}` };
  }
}

// Send email via SendGrid (backup service)
export async function sendViaSendGrid(env, toEmail, toName, subject, html) {
  try {
    const sendGridKey = env.SENDGRID_API_KEY;
    if (!sendGridKey || sendGridKey.trim() === '') {
      return { sent: false, error: 'SendGrid API key not configured' };
    }

    let fromAddress = (env.SENDGRID_FROM || 'no-reply@pawdia-ai.com').trim();

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: toEmail, name: toName }]
        }],
        from: { email: fromAddress },
        subject,
        content: [{ type: 'text/html', value: html }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid send error:', response.status, errorText);
      return { sent: false, error: `SendGrid API error: ${response.status} - ${errorText}` };
    }

    return { sent: true };
  } catch (e) {
    console.error('SendGrid send exception:', e);
    return { sent: false, error: `SendGrid exception: ${String(e)}` };
  }
}

// Send verification email
export async function sendVerificationEmail(env, toEmail, toName, verificationToken) {
  const subject = 'Verify your Pawdia AI account';
  const verificationUrl = `${env.FRONTEND_URL || 'https://pawdia-ai-frontend.pages.dev'}/verify?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to Pawdia AI!</h2>
      <p>Hi ${toName || 'there'},</p>
      <p>Thank you for signing up for Pawdia AI. To complete your registration, please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email Address</a>
      </div>
      <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p>This verification link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">This email was sent by Pawdia AI. If you have any questions, please contact our support team.</p>
    </div>
  `;

  // Try Resend first, fallback to SendGrid
  const resendResult = await sendViaResend(env, toEmail, toName, subject, html);
  if (resendResult.sent) {
    return resendResult;
  }

  console.warn('Resend failed, trying SendGrid:', resendResult.error);
  return await sendViaSendGrid(env, toEmail, toName, subject, html);
}

// Send reset password email
export async function sendResetPasswordEmail(env, toEmail, toName, tempPassword) {
  try {
    const subject = 'Your Pawdia AI temporary password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset</h2>
        <p>Hi ${toName || ''},</p>
        <p>Your password has been reset by an administrator. Use the temporary password below to log in, then change it immediately in your profile.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <strong style="font-size: 18px; color: #1f2937;">${tempPassword}</strong>
        </div>
        <p style="color: #dc2626;">⚠️ Please change this temporary password immediately after logging in.</p>
        <p>If you did not request this password reset, please contact support immediately.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This email was sent by Pawdia AI. If you have any questions, please contact our support team.</p>
      </div>
    `;

    // Try Resend first, fallback to SendGrid
    const resendResult = await sendViaResend(env, toEmail, toName, subject, html);
    if (resendResult.sent) {
      return resendResult;
    }

    console.warn('Resend failed for reset email, trying SendGrid:', resendResult.error);
    return await sendViaSendGrid(env, toEmail, toName, subject, html);
  } catch (err) {
    console.error('sendResetPasswordEmail error:', err);
    return { sent: false, error: String(err) };
  }
}
