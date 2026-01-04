// 调试JWT token内容
const API_BASE_URL = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

// 解码JWT token (不验证签名)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

async function debugToken() {
  console.log('🔍 调试JWT token内容...');

  try {
    // 登录获取token
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

    console.log('📋 JWT Token:', token);

    // 解码token
    const decoded = decodeJWT(token);
    console.log('📋 解码后的Token Payload:', decoded);

    // 调用 /auth/me
    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    const meResult = await meResponse.json();
    console.log('📋 /auth/me 返回的用户信息:', meResult);

    // 比较token中的sub和/auth/me返回的id
    if (decoded && meResult.user) {
      console.log('🔍 比较结果:');
      console.log('   Token sub:', decoded.sub);
      console.log('   /auth/me id:', meResult.user.id);
      console.log('   是否匹配:', decoded.sub === meResult.user.id);
    }

  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

debugToken();
