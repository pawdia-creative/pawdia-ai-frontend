// 测试重发验证邮件的完整流程
const API_BASE_URL = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

async function testResendVerificationFlow() {
  console.log('🧪 测试重发验证邮件的完整流程...');

  try {
    // 步骤1: 模拟登录获取token
    console.log('📋 步骤1: 模拟用户登录...');
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
    console.log('📤 登录响应:', loginResponse.status, loginResult);

    if (!loginResponse.ok) {
      console.log('❌ 无法登录用户，可能用户不存在或密码错误');
      return;
    }

    // 步骤2: 验证token是否有效
    console.log('📋 步骤2: 验证token...');
    const token = loginResult.token;
    if (!token) {
      console.log('❌ 登录响应中没有token');
      return;
    }

    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    const meResult = await meResponse.json();
    console.log('📤 /auth/me 响应:', meResponse.status, meResult);

    if (!meResponse.ok) {
      console.log('❌ Token 无效，无法继续测试');
      return;
    }

    // 步骤3: 调用重发验证邮件
    console.log('📋 步骤3: 调用重发验证邮件API...');

    // 先尝试用邮箱直接调用（不通过token）
    console.log('📧 先尝试直接用邮箱调用...');
    const directResendResponse = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'tms1997tmq@gmail.com'
      }),
    });

    const directResendResult = await directResendResponse.json();
    console.log('📤 直接用邮箱调用响应:', directResendResponse.status, directResendResult);

    // 再尝试用token调用
    console.log('🔑 再尝试用token调用...');
    const resendResponse = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const resendResult = await resendResponse.json();
    console.log('📤 用token调用响应:', resendResponse.status, resendResult);

    // 步骤4: 分析结果
    console.log('📋 步骤4: 分析结果...');

    if (resendResponse.ok) {
      if (resendResult.message.includes('Verification email sent')) {
        console.log('✅ 邮件发送成功!');
        console.log('📧 请检查邮箱是否收到验证邮件');
      } else if (resendResult.message.includes('Unable to send')) {
        console.log('❌ 邮件发送失败');
        console.log('🔍 失败原因:', resendResult.message);
        console.log('📋 需要检查:');
        console.log('   - Resend/SendGrid API配置');
        console.log('   - 域名验证');
        console.log('   - 发件人地址验证');
      } else {
        console.log('❓ 未知响应:', resendResult.message);
      }
    } else {
      console.log('❌ API调用失败');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testResendVerificationFlow();
