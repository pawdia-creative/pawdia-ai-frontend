// 这是一个空的 Worker 文件，用于满足 Cloudflare Pages 的要求
// 实际上 Pages 会使用静态文件，不会执行这个 Worker

export default {
  async fetch(request, env, ctx) {
    // Pages 会自动处理静态文件，这里返回 404
    return new Response('Not Found', { status: 404 });
  }
}