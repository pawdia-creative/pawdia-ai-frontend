const testSubscriptionUpdate = async () => {
  console.log('=== 测试订阅更新功能 ===');

  // 模拟前端发送的请求数据
  const testPayload = {
    plan: 'premium',
    status: 'active',
    expiresAt: '2026-12-31T23:59:59.000Z',
    setCredits: '100',
    addPlanCredits: false
  };

  const apiUrl = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api/admin/users';

  // 注意：这里需要一个有效的用户ID和管理员token
  // 为了测试，我们先获取用户列表看看是否有用户
  console.log('1. 获取用户列表...');
  try {
    const response = await fetch(`${apiUrl}?page=1&perPage=10`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // 需要替换为真实的token
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const users = await response.json();
      console.log('用户列表:', users);

      if (users.data && users.data.length > 0) {
        const testUserId = users.data[0].id;
        console.log(`2. 测试更新用户 ${testUserId} 的订阅...`);

        const updateResponse = await fetch(`${apiUrl}/${testUserId}/subscription`, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE', // 需要替换为真实的token
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload),
        });

        console.log('响应状态:', updateResponse.status);
        const result = await updateResponse.json();
        console.log('响应内容:', result);
      }
    } else {
      console.log('获取用户列表失败:', response.status, await response.text());
    }
  } catch (error) {
    console.error('测试出错:', error);
  }
};

// 运行测试
testSubscriptionUpdate();
