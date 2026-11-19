'use client';

import { cn } from '@/lib/cn';

interface BrandMarkProps {
  locating: boolean;
  label: string;
  onClick: () => void;
}

/**
 * logo 即「定位到我的位置」入口：
 * 图形用纯 CSS 渐变（蓝→橙，呼应温度趋势的冷暖色），不依赖图片资源；
 * 定位中把 W 隐去、显示旋转指示器，点击语义通过 aria-label / title 暴露给读屏。
 */
export default function BrandMark({ locating, label, onClick }: BrandMarkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-busy={locating}
      className={cn(
        'group relative grid h-11 w-11 shrink-0 place-items-center rounded-full',
        'bg-gradient-to-br from-accent to-chart-to text-white',
        'shadow-[0_10px_24px_-12px_var(--accent)] transition',
        'hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_var(--accent)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      {locating ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      ) : (
        <span className="text-[15px] font-bold leading-none tracking-tight">W</span>
      )}
      {/* 指示「可点击定位」：右下角一个小圆点，悬停放大 */}
      <span
        className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border border-white/40 bg-surface-solid text-[9px] text-ink-muted transition group-hover:scale-110"
        aria-hidden
      >
        ◎
      </span>
    </button>
  );
}
