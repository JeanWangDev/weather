import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PREFERENCE_BOOTSTRAP_SCRIPT } from '@/stores/use-preference-store';

/**
 * 根布局：只做三件事——内联偏好引导脚本、挂全局样式、提供页面外壳。
 * 这里不碰业务数据，天气查询全部发生在 page 及其下游，避免布局层被迫变成客户端组件。
 */

export const metadata: Metadata = {
  title: '天气 · Weather',
  description: '搜索城市或定位，查看当前天气与未来预报；支持深色/浅色主题与中英切换。',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b1424' },
    { media: '(prefers-color-scheme: light)', color: '#eef3fb' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* 首屏防闪：在 React 挂载前把持久化的主题/语言写回 <html> */}
        <script dangerouslySetInnerHTML={{ __html: PREFERENCE_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
