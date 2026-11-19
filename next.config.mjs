/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产构建产出 .next/standalone（自带最小化 node_modules + server.js），
  // Docker 镜像只拷这一个目录即可，不必把整棵 node_modules 搬进运行层。
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
