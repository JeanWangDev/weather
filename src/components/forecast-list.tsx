'use client';

import { describeWeather } from '@/lib/weather-codes';
import type { DailyForecast } from '@/types/weather';
import { clamp, formatWeekday } from '@/lib/format';
import { useI18n } from '@/hooks/use-i18n';

interface ForecastListProps {
  daily: DailyForecast[];
}

/**
 * 未来 7 天：温度条以「7 天全局最低~最高」为刻度，
 * 让不同日期的冷暖可直接横向比较（而不是每天各自拉伸）。
 */
export default function ForecastList({ daily }: ForecastListProps) {
  const { locale, t } = useI18n();

  if (daily.length === 0) return null;

  const globalMin = Math.min(...daily.map((day) => day.temperatureMin));
  const globalMax = Math.max(...daily.map((day) => day.temperatureMax));
  const span = Math.max(globalMax - globalMin, 1);

  return (
    <section className="panel px-[22px] py-5 pb-3" aria-label={t('forecastTitle')}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-sm font-semibold tracking-[0.02em]">{t('forecastTitle')}</h3>
        <span className="text-[11px] text-ink-faint">{t('forecastHint')}</span>
      </div>

      <ul className="m-0 list-none p-0">
        {daily.map((day, index) => {
          const condition = describeWeather(day.weatherCode, true, locale);
          const left = clamp(((day.temperatureMin - globalMin) / span) * 100, 0, 100);
          const width = clamp(
            ((day.temperatureMax - day.temperatureMin) / span) * 100,
            8,
            100 - left,
          );

          return (
            <li
              key={day.date}
              className="flex items-center gap-2.5 border-t border-line py-2.5 text-[13px] first:border-t-0"
            >
              <span className="w-11 shrink-0 font-semibold max-sm:w-10">
                {index === 0 ? t('today') : formatWeekday(day.date, locale, { short: true })}
              </span>
              <span className="hidden w-[74px] shrink-0 text-[11px] text-ink-faint sm:block">
                {formatWeekday(day.date, locale)}
              </span>
              <span className="w-6 shrink-0 text-center text-[17px] leading-none" aria-hidden>
                {condition.icon}
              </span>
              <span className="hidden flex-1 truncate text-xs text-ink-muted sm:block">
                {condition.label}
              </span>
              <span className="hidden w-16 shrink-0 justify-end whitespace-nowrap text-[11px] text-ink-faint sm:flex">
                {day.precipitation > 0 ? `💧 ${day.precipitation.toFixed(1)}mm` : ''}
              </span>
              <span className="w-9 shrink-0 text-right text-ink-muted">
                {Math.round(day.temperatureMin)}°
              </span>
              <span className="relative h-1.5 min-w-[64px] flex-1 rounded-pill bg-tile-strong">
                <span
                  className="absolute top-0 h-full rounded-pill bg-gradient-to-r from-chart-from to-chart-to transition-all duration-300"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </span>
              <span className="w-9 shrink-0 text-right font-semibold">
                {Math.round(day.temperatureMax)}°
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
