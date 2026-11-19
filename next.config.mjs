/** @type {import('next').NextConfig} */
const nextConfig = {
  // 生产构建产出 .next/standalone（自带最小化 node_modules + server.js），
  // Docker 镜像只拷这一个目录即可，不必把整棵 node_modules 搬进运行层。
  output: 'standalone',
  reactStrictMode: true,

  webpack(config) {
    // 让 .svg 在 TS/TSX 里能被 import 成 React 组件（SVGR）。
    // Next 默认把 svg 当静态图片资源处理，两条规则会同时命中同一个文件，
    // 所以先把默认的 svg 资源规则排除掉，再挂 SVGR。
    const svgAssetRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));
    if (svgAssetRule) {
      svgAssetRule.exclude = /\.svg$/i;
    }

    config.module.rules.push({
      test: /\.svg$/i,
      // issuer 限定只有代码文件 import 时才走 SVGR；CSS url() 里的 svg 仍然按资源处理
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            // 去掉 svg 自身的 width/height，由使用处的 props 决定尺寸
            dimensions: false,
            // 保留 viewBox，否则缩放会变形
            svgo: true,
            svgoConfig: {
              plugins: [
                { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
              ],
            },
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
