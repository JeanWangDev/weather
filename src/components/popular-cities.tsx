'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { WeatherService } from '@/services/weather-service';
import { ApiClientError } from '@/services/api-client-error';
import { POPULAR_CITIES } from '@/config/cities';
import { describeWeather } from '@/lib/weather-codes';
import type { CityOverview, GeoLocation } from '@/types/weather';

interface PopularCitiesProps {
  onSelect: (location: GeoLocation) => void;
}

/**
 * 头部推荐城市胶囊：一次批量拿「城市 + 图标 + 当前温度」。
 * 数据没回来时显示城市名（不闪骨架，避免头像跳动）；点击时若已有坐标直接选中，
 * 未拿到坐标才回退成一次搜索。
 */
export default function PopularCities({ onSelect }: PopularCitiesProps) {
  const { locale, t } = useI18n();
  const cities = POPULAR_CITIES[locale];

  const [overview, setOverview] = useState<Record<string, CityOverview>>({});
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    WeatherService.getCityOverview(cities, locale, controller.signal)
      .then((payload) => {
        const next: Record<string, CityOverview> = {};
        for (const item of payload.items ?? []) next[item.query ?? item.location.name] = item;
        setOverview(next);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (error instanceof ApiClientError) setOverview({});
      });

    return () => controller.abort();
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePick(name: string) {
    const known = overview[name];
    if (known) {
      onSelect(known.location);
      return;
    }

    setPending(name);
    try {
      const payload = await WeatherService.searchLocations(name, locale);
      const [first] = payload.locations ?? [];
      if (first) onSelect(first);
    } catch {
      // 失败由页面统一提示：这里只保证不阻塞
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{t('popular')}</span>

      {cities.map((name) => {
        const item = overview[name];
        const condition = item ? describeWeather(item.weatherCode, item.isDay, locale) : null;

        return (
          <button
            key={name}
            type="button"
            disabled={pending !== null}
            onClick={() => void handlePick(name)}
            className="flex items-center gap-1.5 rounded-pill border border-line bg-tile px-3 py-1.5 text-[12px] text-ink-muted transition hover:-translate-y-px hover:border-accent hover:bg-accent-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            title={name}
          >
            {pending === name ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
            ) : (
              condition && <span aria-hidden className="text-[13px] leading-none">{condition.icon}</span>
            )}
            <span>{name}</span>
            {item && (
              <span className="font-semibold text-ink tabular-nums">
                {Math.round(item.temperature)}°
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
