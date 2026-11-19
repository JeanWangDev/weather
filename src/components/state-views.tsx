'use client';

/** 初始空状态：给快捷城市入口，避免白屏 */
export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-2.5 rounded-card border border-dashed border-line bg-surface p-9 text-center">
      <span className="animate-float text-[44px] leading-none" aria-hidden>
        🌤️
      </span>
      <h2 className="mt-1.5 text-xl font-semibold">{title}</h2>
      <p className="m-0 max-w-[380px] text-[13px] text-ink-muted">{hint}</p>
    </div>
  );
}

/** 加载骨架屏：形状贴合真实内容，减少数据到达时的跳动 */
export function LoadingState({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-[320px] flex-col items-center justify-center gap-2.5 rounded-card border border-dashed border-line bg-surface p-9 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="m-0 text-[13px] text-ink-muted">{label}</p>
      <div className="mt-1.5 flex w-full max-w-search flex-col gap-3">
        <span className="skeleton block h-4 w-2/5 rounded-lg" />
        <span className="skeleton block h-11 w-3/5 rounded-lg" />
        <div className="mt-1.5 grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className="skeleton block h-[58px] rounded-tile" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 错误状态：说明原因 + 重试，绝不让用户卡死在失败页面 */
export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex min-h-[320px] flex-col items-center justify-center gap-2.5 rounded-card border border-dashed border-line bg-surface p-9 text-center"
      role="alert"
    >
      <span className="text-[36px] leading-none text-danger" aria-hidden>
        ⚠
      </span>
      <h2 className="mt-1.5 text-xl font-semibold">{title}</h2>
      <p className="m-0 max-w-[420px] text-[13px] text-danger-text">{message}</p>
      <button
        type="button"
        className="mt-2 rounded-pill border border-accent bg-accent-soft px-5 py-2.5 text-[13px] font-semibold transition hover:bg-accent hover:text-base"
        onClick={onRetry}
      >
        {retryLabel}
      </button>
    </div>
  );
}
