/**
 * 时间与时区工具（服务端使用）
 * 注意：客户端格式化用 lib/format.ts（带 locale），这里只负责 UTC → 地点当地时间的换算。
 */

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function localFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  formatterCache.set(timeZone, formatter);
  return formatter;
}

/**
 * 把 UTC 时间换算成「地点当地时间」的 ISO 风格字符串（YYYY-MM-DDTHH:mm）。
 * 时区与夏令时交给 Intl，避免自己算偏移。
 */
export function toLocalIsoString(date: Date, timeZone: string): string {
  const parts = localFormatter(timeZone).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  return `${pick('year')}-${pick('month')}-${pick('day')}T${pick('hour')}:${pick('minute')}`;
}

export function toLocalDateString(date: Date, timeZone: string): string {
  return toLocalIsoString(date, timeZone).slice(0, 10);
}
