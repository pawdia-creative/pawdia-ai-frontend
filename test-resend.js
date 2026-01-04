// 测试 Resend API 连接的脚本
const RESEND_API_KEY = 're_iEpaVLYK_EYFiNU8GjWkrWAETWy4YRiTM'; // 请替换为你的实际密钥

async function testResendAPI() {
  console.log('🧪 测试 Resend API 连接...');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'no-reply@pawdia-ai.com',
        to: 'tms1997tmq@gmail.com',
        subject: '测试邮件 - Pawdia AI',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>测试邮件</h2>
            <p>这是一封测试邮件，用于验证 Resend API 配置是否正确。</p>
            <p>如果您收到这封邮件，说明邮件服务配置成功！</p>
            <br>
            <p>来自 Pawdia AI 团队</p>
          </div>
        `
      })
    });

    console.log('📤 API响应状态:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Resend API 调用成功!');
      console.log('📧 邮件ID:', result.id);
      console.log('📬 请检查邮箱是否收到测试邮件');
    } else {
      const error = await response.text();
      console.log('❌ Resend API 调用失败:');
      console.log('📋 错误详情:', error);

      // 解析常见错误
      if (error.includes('domain')) {
        console.log('🔍 可能的原因: 域名未验证');
        console.log('📝 解决方案: 在 Resend 控制台验证域名 pawdia-ai.com');
      } else if (error.includes('from')) {
        console.log('🔍 可能的原因: 发件人地址未验证');
        console.log('📝 解决方案: 在 Resend 中验证 no-reply@pawdia-ai.com');
      } else if (error.includes('unauthorized')) {
        console.log('🔍 可能的原因: API 密钥无效');
        console.log('📝 解决方案: 检查 RESEND_API_KEY 是否正确');
      } else if (error.includes('quota')) {
        console.log('🔍 可能的原因: 发送配额不足');
        console.log('📝 解决方案: 检查 Resend 账户的发送限制');
      }
    }
  } catch (error) {
    console.error('❌ 网络错误:', error.message);
  }
}

testResendAPI();
