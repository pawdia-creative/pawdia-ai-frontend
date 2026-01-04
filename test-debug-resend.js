// 简化的重发验证邮件调试测试
const API_BASE_URL = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

async function debugResendSimple() {
  console.log('🔍 简化的重发验证邮件调试...');

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

    // 步骤2: 调用重发验证邮件
    console.log('📋 步骤2: 调用重发验证邮件API...');
    const resendResponse = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const resendResult = await resendResponse.json();
    console.log('📤 重发响应:', resendResponse.status, resendResult);

    // 分析结果
    if (resendResult.message === 'If that account exists, a verification email will be sent.') {
      console.log('❌ 问题确认: 用户查找失败');
      console.log('📋 这意味着在 /auth/resend-verification 端点中，系统无法找到用户');
      console.log('🔍 可能的原因:');
      console.log('   1. Worker内部调用 /auth/me 时失败');
      console.log('   2. 从 /auth/me 响应中解析用户信息失败');
      console.log('   3. 数据库查询失败');
      console.log('   4. 邮箱地址不匹配');
    } else if (resendResult.message.includes('Verification email sent')) {
      console.log('✅ 邮件发送成功');
    } else {
      console.log('❓ 未知响应');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

debugResendSimple();
