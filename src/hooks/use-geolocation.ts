'use client';

import { useCallback, useRef, useState } from 'react';
import type { TranslationKey } from '@/config/i18n';
import type { Locale } from '@/config/i18n';
import { WeatherService } from '@/services/weather-service';
import { ApiClientError } from '@/services/api-client-error';
import type { GeoLocation } from '@/types/weather';

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false, // 城市级精度就够，高精度反而更慢更耗电
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000,
};

interface GeolocationResult {
  locating: boolean;
  errorKey: TranslationKey | null;
  locate: () => void;
  reset: () => void;
}

/** 浏览器定位失败码 → 可翻译的错误 key */
function mapPositionError(code: number): TranslationKey {
  if (code === 1) return 'locationDenied';
  if (code === 3) return 'locationTimeout';
  return 'locationUnavailable';
}

/**
 * 「使用我的位置」：navigator.geolocation + 逆地理编码。
 * 隐私与降级：只在用户点击时才请求权限；拒绝/超时/不支持都给明确提示并保留手动搜索。
 */
export function useGeolocation(
  locale: Locale,
  onResolved: (location: GeoLocation) => void,
): GeolocationResult {
  const [locating, setLocating] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locate = useCallback(() => {
    setErrorKey(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrorKey('locationUnavailable');
      return;
    }

    setLocating(true);

    // 看门狗：某些环境（无头浏览器/被系统吞掉回调）不会触发 success 或 error，
    // 没有它按钮会永远停在"定位中"，所以超时后强制收口成可重试的错误态。
    watchdog.current = setTimeout(() => {
      setLocating(false);
      setErrorKey('locationTimeout');
    }, 12_000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (watchdog.current) clearTimeout(watchdog.current);
        try {
          const location = await WeatherService.reverseGeocode(
            position.coords.latitude,
            position.coords.longitude,
            locale,
          );
          onResolved(location);
        } catch (error) {
          setErrorKey(
            error instanceof ApiClientError && error.status === 404
              ? 'locationUnavailable'
              : 'locationFailed',
          );
        } finally {
          if (watchdog.current) clearTimeout(watchdog.current);
          setLocating(false);
        }
      },
      (error) => {
        if (watchdog.current) clearTimeout(watchdog.current);
        setErrorKey(mapPositionError(error.code));
        setLocating(false);
      },
      GEO_OPTIONS,
    );
  }, [locale, onResolved]);

  return { locating, errorKey, locate, reset: () => setErrorKey(null) };
}
