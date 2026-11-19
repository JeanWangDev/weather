'use client';

import { create } from 'zustand';
import { WeatherService } from '@/services/weather-service';
import { ApiClientError } from '@/services/api-client-error';
import type { GeoLocation, WeatherSnapshot } from '@/types/weather';

/**
 * 天气状态机（对齐 Velora-web 的 stores 范式：Zustand 单 store + 模块级副作用句柄）。
 *
 * - 用可辨识联合表达状态，非法组合在类型层就无法构造；
 * - 单飞：新请求取消旧请求，避免慢请求覆盖新结果；
 * - 10 分钟缓存：同城来回切换不重复打接口，refresh 强制绕过；
 * - 错误只存 HTTP 状态码，文案交给 i18n 层翻译（换语言时错误提示也随之切换）。
 */
type WeatherState =
  | { status: 'idle' }
  | { status: 'loading'; location: GeoLocation }
  | { status: 'success'; location: GeoLocation; data: WeatherSnapshot }
  | { status: 'error'; location: GeoLocation; errorStatus: number };

interface WeatherStore {
  state: WeatherState;
  selectLocation: (location: GeoLocation) => void;
  retry: () => void;
  refresh: () => void;
}

const CACHE_TTL_MS = 10 * 60 * 1000;

/** 请求句柄与缓存是副作用资源，放在 store 外，避免进入 React 渲染依赖 */
let abortController: AbortController | null = null;
const cache = new Map<number, { data: WeatherSnapshot; cachedAt: number }>();
let lastLocation: GeoLocation | null = null;

export const useWeatherStore = create<WeatherStore>((set) => {
  const load = async (location: GeoLocation, options: { force?: boolean } = {}) => {
    lastLocation = location;

    if (!options.force && location.id) {
      const cached = cache.get(location.id);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        set({ state: { status: 'success', location, data: cached.data } });
        return;
      }
    }

    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    set({ state: { status: 'loading', location } });

    try {
      const data = await WeatherService.getSnapshot(location, controller.signal);
      if (location.id) cache.set(location.id, { data, cachedAt: Date.now() });
      set({ state: { status: 'success', location, data } });
    } catch (error) {
      // 主动取消：交给新请求接管，不改状态
      if (error instanceof DOMException && error.name === 'AbortError') return;

      set({
        state: {
          status: 'error',
          location,
          errorStatus: error instanceof ApiClientError ? error.status : 500,
        },
      });
    }
  };

  return {
    state: { status: 'idle' },
    selectLocation: (location) => void load(location),
    retry: () => {
      if (lastLocation) void load(lastLocation, { force: true });
    },
    refresh: () => {
      if (lastLocation) void load(lastLocation, { force: true });
    },
  };
});
