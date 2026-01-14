// 测试管理员API分页功能
const API_BASE = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

async function loginAsAdmin() {
  console.log('🔐 正在登录管理员账号...');

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@pawdia.ai',
      password: 'admin123456'
    })
  });

  if (!response.ok) {
    throw new Error(`登录失败: ${response.status}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('未收到token');
  }

  console.log('✅ 管理员登录成功');
  return data.token;
}

async function testPagination(token) {
  console.log('\n📊 测试分页功能...\n');

  // 测试不同的分页参数
  const testCases = [
    { page: 1, perPage: 2, desc: '第1页，每页2个用户' },
    { page: 2, perPage: 2, desc: '第2页，每页2个用户' },
    { page: 3, perPage: 2, desc: '第3页，每页2个用户' },
    { page: 1, perPage: 10, desc: '第1页，每页10个用户' },
    { page: 1, perPage: 5, desc: '第1页，每页5个用户（带搜索）' }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 ${testCase.desc}:`);
    const params = new URLSearchParams({
      page: testCase.page.toString(),
      perPage: testCase.perPage.toString()
    });

    if (testCase.desc.includes('搜索')) {
      params.append('search', 'Yi');
    }

    try {
      const response = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        console.log(`❌ 请求失败: ${response.status} - ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      console.log(`📄 总用户数: ${data.total}`);
      console.log(`👥 返回用户数: ${data.users.length}`);
      console.log(`📋 用户列表:`);
      data.users.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }
    console.log('');
  }
}

async function main() {
  try {
    const token = await loginAsAdmin();
    await testPagination(token);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
main();
