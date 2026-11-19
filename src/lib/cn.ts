/** 条件 className 拼接：与 Velora-web 的 lib/cn 保持一致，不引 clsx */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
