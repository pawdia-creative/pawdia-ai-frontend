// 完整调试重发验证邮件流程
const API_BASE_URL = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

async function debugResendFull() {
  console.log('🔍 完整调试重发验证邮件流程...');

  try {
    // 步骤1: 登录获取token
    console.log('📋 步骤1: 用户登录...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'tms1997tmq@gmail.com',
        password: 'testpassword123'
      }),
    });

    const loginResult = await loginResponse.json();
    const token = loginResult.token;
    console.log('✅ 登录成功，获取token');

    // 步骤2: 验证token (模拟前端的token验证)
    console.log('📋 步骤2: 验证token (/auth/me)...');
    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    const meResult = await meResponse.json();
    console.log('✅ Token验证成功，用户:', meResult.user.email);

    // 步骤3: 模拟前端的重发验证邮件逻辑
    console.log('📋 步骤3: 模拟前端重发验证邮件...');

    // 3a: 先再次验证token (前端会这样做)
    console.log('   - 再次验证token...');
    const tokenCheckResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!tokenCheckResponse.ok) {
      console.log('❌ Token验证失败，前端会重定向到登录页');
      return;
    }
    console.log('   ✅ Token验证通过');

    // 3b: 发送重发请求
    console.log('   - 发送重发验证邮件请求...');
    const resendResponse = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // 前端发送空body
    });

    const resendResult = await resendResponse.json();
    console.log('📤 重发响应:', resendResponse.status, resendResult);

    // 步骤4: 分析问题
    console.log('📋 步骤4: 问题分析...');

    if (resendResult.message === 'If that account exists, a verification email will be sent.') {
      console.log('❌ 问题确认: 用户查找失败');
      console.log('🔍 可能原因:');
      console.log('   1. /auth/me 返回的用户信息格式有问题');
      console.log('   2. 数据库查询失败');
      console.log('   3. Worker内部调用 /auth/me 时出现问题');

      // 测试Worker内部调用
      console.log('📋 测试Worker内部 /auth/me 调用...');
      const internalMeResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const internalMeResult = await internalMeResponse.json();
      console.log('📤 Worker内部 /auth/me 响应:', internalMeResponse.status, internalMeResult);

      if (internalMeResponse.ok && internalMeResult.user) {
        console.log('✅ /auth/me 工作正常，问题在用户查找逻辑');

        // 测试直接用邮箱查找
        console.log('📋 测试直接用邮箱重发...');
        const emailResendResponse = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'tms1997tmq@gmail.com' }),
        });

        const emailResendResult = await emailResendResponse.json();
        console.log('📤 邮箱重发响应:', emailResendResponse.status, emailResendResult);

        if (emailResendResult.message.includes('Unable to send')) {
          console.log('✅ 用户查找成功，但邮件发送失败');
          console.log('🔍 邮件服务问题需要解决域名验证');
        } else {
          console.log('❓ 未知情况');
        }
      } else {
        console.log('❌ /auth/me 本身就有问题');
      }
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

debugResendFull();
