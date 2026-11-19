#!/usr/bin/env node
/**
 * 本地生产预览：起真正的 standalone server。
 * ----------------------------------------------------------------------------
 * 为什么不能直接用 `next start`：项目开了 `output: 'standalone'`，构建产物是
 * 「自带最小 node_modules 的独立服务」，`next start` 找不到 vendor-chunks，
 * 页面直接 500（Next 官方也明确说两者不兼容）。
 *
 * standalone/server.js 只带代码，不带 static 与 public，所以起服务前要把它们
 * 拷进 `.next/standalone/`——这正是 Dockerfile 运行层做的事，这里保持一致，
 * 避免「本地看着好好的、镜像里少文件」。
 *
 * 用法：yarn build && PORT=3123 yarn start
 */

import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const STANDALONE = path.join(ROOT, '.next', 'standalone');

if (!existsSync(path.join(STANDALONE, 'server.js'))) {
  console.error('[start] 找不到 .next/standalone/server.js，先跑 yarn build');
  process.exit(1);
}

// 静态资源每次起服务前同步一遍：改了图/图标但只在 build 里生成时，不会漏拷
cpSync(path.join(ROOT, 'public'), path.join(STANDALONE, 'public'), { recursive: true });
cpSync(path.join(ROOT, '.next', 'static'), path.join(STANDALONE, '.next', 'static'), {
  recursive: true,
});

const child = spawn(process.execPath, [path.join(STANDALONE, 'server.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT ?? '3000',
    HOSTNAME: process.env.HOSTNAME ?? '0.0.0.0',
  },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code) => process.exit(code ?? 0));
