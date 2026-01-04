// 测试邮件发送和用户检查功能的脚本
const API_BASE_URL = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

async function checkUserExists(email) {
  console.log(`🔍 检查用户是否存在: ${email}`);

  try {
    // 尝试使用邮箱注册来检查用户
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: 'testpassword123',
        name: 'Test User'
      }),
    });

    const result = await response.json();
    console.log('📤 注册响应:', response.status, result);

    if (response.status === 409 && result.message && result.message.includes('already exists')) {
      console.log('✅ 用户已存在于系统中');
      return true;
    } else if (response.status === 201) {
      console.log('✅ 用户已创建 (测试用户)');
      return true;
    } else if (response.status === 200 && result.emailSent === false) {
      console.log('✅ 用户已存在 (注册成功但邮件发送失败)');
      return true;
    } else {
      console.log('❓ 无法确定用户状态');
      return false;
    }
  } catch (error) {
    console.error('❌ 检查用户时出错:', error);
    return false;
  }
}

async function testEmailSending() {
  console.log('🧪 测试邮件发送功能...');
  console.log('📍 API 端点:', API_BASE_URL);

  const testEmail = 'tms1997tmq@gmail.com';

  // 首先检查用户是否存在
  const userExists = await checkUserExists(testEmail);

  if (!userExists) {
    console.log('⚠️ 无法确认用户是否存在，请先注册账户');
    return;
  }

  try {
    console.log(`📧 发送测试邮件到: ${testEmail}`);

    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail
      }),
    });

    console.log('📤 API响应状态:', response.status);

    try {
      const result = await response.json();
      console.log('📤 API响应内容:', result);

      const responseMessage = result?.message || '';

      if (response.ok) {
        if (responseMessage.includes('If that account exists')) {
          console.log('⚠️ API返回通用消息，可能是因为用户不存在或邮箱不匹配');
          console.log('🔍 请检查:');
          console.log('   1. 用户是否真的在这个系统中注册');
          console.log('   2. 邮箱地址是否正确');
        } else if (responseMessage.includes('Unable to send') || responseMessage.includes('failed')) {
          console.log('❌ 邮件发送实际失败!');
          console.log('🔍 失败原因:', responseMessage);
          console.log('📋 可能的解决方案:');
          console.log('   1. 检查 RESEND_API_KEY 是否正确设置');
          console.log('   2. 检查 Resend 控制台的域名验证');
          console.log('   3. 检查 Resend 账户的发送配额');
          console.log('   4. 检查发件人邮箱是否已验证');
        } else if (responseMessage.includes('Verification email sent')) {
          console.log('✅ 邮件发送成功!');
          console.log('📧 请检查邮箱是否收到邮件');
          console.log('📬 如果没有收到，请检查:');
          console.log('   1. 垃圾邮件文件夹');
          console.log('   2. Resend 控制台的邮件发送状态');
          console.log('   3. 域名验证状态');
        } else {
          console.log('❓ 未知响应消息:', responseMessage);
        }
      } else {
        console.log('❌ 邮件发送API调用失败');
        console.log('🔍 可能的原因:');
        console.log('   - RESEND_API_KEY 未正确设置');
        console.log('   - 发件人域名未验证');
        console.log('   - 邮件服务配额不足');
      }
    } catch (parseError) {
      console.log('📤 API响应 (非JSON):', await response.text());
    }

  } catch (error) {
    console.error('❌ 测试过程中发生网络错误:', error.message);
    console.log('🔍 检查网络连接或 API 端点是否可访问');
  }
}

// 运行测试
testEmailSending();
