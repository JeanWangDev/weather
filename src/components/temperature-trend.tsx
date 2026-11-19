'use client';

import { describeWeather } from '@/lib/weather-codes';
import type { HourlyPoint } from '@/types/weather';
import { formatClock } from '@/lib/format';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/cn';

interface TemperatureTrendProps {
  hourly: HourlyPoint[];
}

/**
 * 温度趋势折线：纯 SVG 手绘，不引图表库。
 *
 * 为什么不用 recharts/echarts：这里只需要一条 24 点的曲线 + 面积填充，
 * 引图表库会带来数十 KB 体积、额外的响应式配置与主题适配成本，收益为负。
 * 坐标映射写成纯函数，min/max 自适应，换数据长度也不需要改布局。
 *
 * 数值标注：SVG 用了 preserveAspectRatio="none"（图表随宽度拉伸），
 * 如果把文字塞进 SVG 会被横向拉变形，所以数值用 HTML 叠层按百分比定位。
 */
export default function TemperatureTrend({ hourly }: TemperatureTrendProps) {
  const { locale, t } = useI18n();

  if (hourly.length < 2) return null;

  const values = hourly.map((point) => point.temperature);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);

  const WIDTH = 1000;
  const TOP = 8;
  const BOTTOM = 92;
  const usable = BOTTOM - TOP;

  const last = hourly.length - 1;
  const x = (index: number) => (index / last) * WIDTH;
  const y = (value: number) => BOTTOM - ((value - min) / span) * usable;

  const line = hourly
    .map((point, index) => `${x(index).toFixed(1)},${y(point.temperature).toFixed(1)}`)
    .join(' ');
  const area = `M0,${BOTTOM} L${line.replace(/ /g, ' L')} L${WIDTH},${BOTTOM} Z`;

  const axisIndexes = [0, Math.round(last / 3), Math.round((last * 2) / 3), last];

  /**
   * 数值标注：每 3 小时一个刻度 + 最高/最低必定标注。
   * 24 个全标会糊成一片；隔点标注既读得出走势，也不至于挤成数字墙。
   * 相邻不足 3.5% 宽度时后者让位，避免数字叠字。
   */
  const candidates: Array<{ index: number; highlight: boolean }> = [];
  for (let index = 0; index < hourly.length; index += 3) {
    candidates.push({ index, highlight: false });
  }
  candidates.push({ index: last, highlight: false });
  candidates.push({ index: values.indexOf(max), highlight: true });
  candidates.push({ index: values.indexOf(min), highlight: true });

  const labels = candidates
    .sort((a, b) => a.index - b.index)
    .reduce<Array<{ index: number; highlight: boolean }>>((kept, candidate) => {
      const duplicated = kept.some((item) => item.index === candidate.index);
      if (duplicated) {
        return kept.map((item) =>
          item.index === candidate.index
            ? { ...item, highlight: item.highlight || candidate.highlight }
            : item,
        );
      }
      const near = kept.find((item) => Math.abs(x(candidate.index) - x(item.index)) / WIDTH < 0.05);
      if (!near) return [...kept, candidate];

      // 靠得太近：只在「是极值且数值确实不同」时才硬插，否则和邻居的数字重复且更挤
      const sameValue =
        Math.round(hourly[candidate.index].temperature) ===
        Math.round(hourly[near.index].temperature);
      return candidate.highlight && !sameValue ? [...kept, candidate] : kept;
    }, []);

  return (
    <section className="panel px-[22px] py-5 pb-4" aria-label={t('trendTitle')}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-sm font-semibold tracking-[0.02em]">{t('trendTitle')}</h3>
        <div className="flex items-center gap-3 text-[11px] text-ink-faint">
          <span>{t('trendHint')}</span>
          <span className="text-ink-muted">
            {t('trendHigh')} {Math.round(max)}° / {t('trendLow')} {Math.round(min)}°
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          className="h-[124px] w-full"
          viewBox={`0 0 ${WIDTH} 100`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${t('trendTitle')} ${Math.round(min)}° ~ ${Math.round(max)}°`}
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-from)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--chart-from)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="trend-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-from)" />
              <stop offset="100%" stopColor="var(--chart-to)" />
            </linearGradient>
          </defs>

          {/* 三条水平参考线，给出高度感但不喧宾夺主 */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={WIDTH}
              y1={BOTTOM - usable * ratio}
              y2={BOTTOM - usable * ratio}
              stroke="var(--line)"
              strokeWidth="1"
            />
          ))}

          <path d={area} fill="url(#trend-fill)" />
          <polyline points={line} fill="none" stroke="url(#trend-stroke)" strokeWidth="2.2" />

          {hourly.map((point, index) => {
            const condition = describeWeather(point.weatherCode, true, locale);
            return (
              <g key={point.time}>
                {(index % 3 === 0 || index === last) && (
                  <circle cx={x(index)} cy={y(point.temperature)} r="3" fill="var(--accent)">
                    <title>
                      {formatClock(point.time)} · {Math.round(point.temperature)}° ·{' '}
                      {condition.label}
                    </title>
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* 数值标注层：按百分比定位，不会被 SVG 的横向拉伸影响 */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {labels.map(({ index, highlight }) => {
            const point = hourly[index];
            const yPercent = y(point.temperature);
            // 默认标在点上方；只有贴顶时才翻到下方，两端则做水平内缩，避免被容器裁掉
            const above = yPercent > 14;
            const alignX = index === 0 ? '0' : index === last ? '-100%' : '-50%';

            return (
              <span
                key={`${point.time}-label`}
                className={cn(
                  'absolute whitespace-nowrap rounded-pill border bg-surface-solid px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums leading-none',
                  highlight ? 'border-accent-line text-accent' : 'border-line text-ink-muted',
                )}
                style={{
                  left: `${(x(index) / WIDTH) * 100}%`,
                  top: `${(yPercent / 100) * 124}px`,
                  transform: `translate(${alignX}, ${above ? '-100%' : '0'}) translateY(${above ? '-7px' : '7px'})`,
                }}
              >
                {Math.round(point.temperature)}°
              </span>
            );
          })}
        </div>

        <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
          {axisIndexes.map((index, position) => (
            <span key={index}>{position === 0 ? t('now') : formatClock(hourly[index].time)}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
