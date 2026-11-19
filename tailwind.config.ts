import type { Config } from 'tailwindcss';

/**
 * 设计系统集中在这里：色板、圆角、字体、动效。
 *
 * 颜色全部映射到 CSS 变量（见 src/app/globals.css 的 :root / [data-theme='light']），
 * 因此换肤只改变量、不碰组件：组件永远只写 bg-surface、text-ink-muted 这类语义类名。
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--base)',
        surface: {
          DEFAULT: 'var(--surface)',
          strong: 'var(--surface-strong)',
          solid: 'var(--surface-solid)',
        },
        tile: {
          DEFAULT: 'var(--tile)',
          strong: 'var(--tile-strong)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          line: 'var(--accent-line)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
          text: 'var(--danger-text)',
        },
        chart: {
          from: 'var(--chart-from)',
          to: 'var(--chart-to)',
        },
      },
      borderRadius: {
        pill: '999px',
        card: '24px',
        tile: '16px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      keyframes: {
        spin: { to: { transform: 'rotate(360deg)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        // 入场动画只动 transform，不依赖 opacity：
        // 动画被打断（后台标签页、低端设备）时内容也始终可见，不会出现「空白卡片」
        fadeUp: {
          from: { transform: 'translateY(8px)' },
          to: { transform: 'translateY(0)' },
        },
        dropIn: {
          from: { transform: 'translateY(-4px)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        spin: 'spin 0.7s linear infinite',
        float: 'float 3.2s ease-in-out infinite',
        fadeUp: 'fadeUp 0.35s ease-out',
        dropIn: 'dropIn 0.16s ease-out',
        shimmer: 'shimmer 1.4s linear infinite',
      },
      maxWidth: {
        page: '880px',
        search: '520px',
      },
    },
  },
  plugins: [],
};

export default config;
