'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CurrentWeatherCard from './components/current-weather-card';
import ForecastList from './components/forecast-list';
import HourlyStrip from './components/hourly-strip';
import SearchBar from './components/search-bar';
import TemperatureTrend from './components/temperature-trend';
import LocationMap from './components/location-map';
import PopularCities from './components/popular-cities';
import AppControls from '@/components/app-controls';
import BrandMark from '@/components/brand-mark';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-views';
import { useWeatherStore } from '@/stores/use-weather-store';
import { usePreferenceStore } from '@/stores/use-preference-store';
import { WeatherService } from '@/services/weather-service';
import { useI18n } from '@/hooks/use-i18n';
import { useGeolocation } from '@/hooks/use-geolocation';
import { DEFAULT_CITY } from '@/config/cities';
import { resolveErrorKey, type TranslationKey } from '@/config/i18n';
import { formatUpdatedAt } from '@/lib/format';
import type { GeoLocation } from '@/types/weather';

type Notice = { key: TranslationKey; vars?: Record<string, string | number> } | null;

/**
 * 页面层只做编排：store 状态 → 组件，交互入口（搜索 / 定位 / 推荐城市 / 刷新）。
 *
 * 目录约定（这是路由组 `(weather)`，圈出「天气」这个业务模块，不影响 URL）：
 *   app/(weather)/components/  只服务本模块的业务组件（天气卡、预报、趋势、地图…）
 *   components/                跨模块可复用的公共组件（品牌、主题/语言控件、状态视图）
 * 业务逻辑仍然在 services / stores，组件里不放取数逻辑。
 */
export default function HomePage() {
  const { locale, t } = useI18n();
  const state = useWeatherStore((store) => store.state);
  const selectLocation = useWeatherStore((store) => store.selectLocation);
  const retry = useWeatherStore((store) => store.retry);
  const refresh = useWeatherStore((store) => store.refresh);
  const rememberLocation = usePreferenceStore((store) => store.rememberLocation);

  const [notice, setNotice] = useState<Notice>(null);
  const localeRef = useRef(locale);

  const handleResolved = useCallback(
    (location: GeoLocation) => {
      setNotice(null);
      selectLocation(location);
    },
    [selectLocation],
  );

  const geolocation = useGeolocation(locale, handleResolved);

  /**
   * 首屏不空屏：优先恢复上次查看的城市，没有历史则拉默认城市。
   * 只跑一次（用 ref 锁），避免用户手动清空状态后被反复覆盖。
   */
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const current = useWeatherStore.getState().state;
    if (current.status !== 'idle') return;

    const remembered = usePreferenceStore.getState().lastLocation;
    if (remembered) {
      selectLocation(remembered);
      return;
    }

    WeatherService.searchLocations(DEFAULT_CITY[locale], locale)
      .then((payload) => {
        const [first] = payload.locations ?? [];
        if (first) selectLocation(first);
      })
      .catch(() => {
        // 默认城市失败时保留空状态，用户仍可搜索/定位
      });
  }, [locale, selectLocation]);

  // 记住当前城市，下次进入直接恢复
  useEffect(() => {
    if (state.status === 'success') rememberLocation(state.location);
  }, [state, rememberLocation]);

  // 切换语言后，已展示的地名按新语言重建（天气数据不变，命中客户端缓存，不会二次拉上游）
  useEffect(() => {
    if (localeRef.current === locale) return;
    localeRef.current = locale;

    const current = useWeatherStore.getState().state;
    if (current.status !== 'success') return;

    WeatherService.reverseGeocode(current.location.latitude, current.location.longitude, locale)
      .then((resolved) =>
        selectLocation({
          ...current.location,
          name: resolved.name,
          admin1: resolved.admin1,
          country: resolved.country,
        }),
      )
      .catch(() => {
        // 逆地理编码失败不影响主流程：保留原地名继续展示
      });
  }, [locale, selectLocation]);

  const updatedAt =
    state.status === 'success' ? formatUpdatedAt(state.data.updatedAt, locale) : null;

  const noticeText = notice ? t(notice.key, notice.vars) : null;
  const locateError = geolocation.errorKey ? t(geolocation.errorKey) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-page flex-col gap-[22px] px-6 pb-14 pt-12 max-sm:gap-4 max-sm:px-4 max-sm:pb-10 max-sm:pt-8">
      <header className="flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
              {t('kicker')}
            </span>
            <h1 className="mt-2 text-[34px] font-bold tracking-tight max-sm:text-[26px]">
              {t('title')}
            </h1>
            {updatedAt && (
              <button
                type="button"
                className="mt-2.5 rounded-pill border border-line bg-tile px-3 py-1.5 text-[11px] text-ink-muted transition hover:bg-tile-strong hover:text-ink"
                onClick={refresh}
              >
                {t('updatedAt', { time: updatedAt })}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <AppControls />
            <BrandMark
              locating={geolocation.locating}
              label={t('locate')}
              onClick={geolocation.locate}
            />
          </div>
        </div>

        <PopularCities onSelect={selectLocation} />
      </header>

      <SearchBar
        onSelect={selectLocation}
        onLocate={geolocation.locate}
        locating={geolocation.locating}
      />

      {/* 备注：md 及以上把「当前天气卡 + 地图」并排（1.4 : 1）；
          用 md 而不是 lg，是因为 967px 宽的窗口下 lg(1024) 不生效，地图会被挤到下面单独一行。 */}
      <div className="flex flex-col gap-3.5">
        {(noticeText || locateError) && (
          <p className="m-0 rounded-tile border border-danger bg-danger-soft px-3.5 py-2.5 text-xs text-danger-text">
            {locateError ?? noticeText}
          </p>
        )}

        {state.status === 'idle' && <EmptyState title={t('emptyTitle')} hint={t('emptyHint')} />}

        {state.status === 'loading' && (
          <LoadingState label={t('loading', { place: state.location.name })} />
        )}

        {state.status === 'error' && (
          <ErrorState
            title={t('errorTitle')}
            message={t(resolveErrorKey(state.errorStatus))}
            retryLabel={t('retry')}
            onRetry={retry}
          />
        )}

        {state.status === 'success' && (
          <div className="flex flex-col gap-3.5">
            <div className="grid gap-3.5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <CurrentWeatherCard data={state.data} />
              <LocationMap location={state.data.location} hourly={state.data.hourly} />
            </div>
            <TemperatureTrend hourly={state.data.hourly} />
            <HourlyStrip hourly={state.data.hourly} />
            <ForecastList daily={state.data.daily} />
          </div>
        )}
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-[18px] text-[11px] text-ink-faint">
        <span>{t('footerSource')}</span>
        <span>{t('footerStack')}</span>
      </footer>
    </main>
  );
}
