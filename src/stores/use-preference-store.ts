'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/config/i18n';
import type { GeoLocation } from '@/types/weather';

export type Theme = 'dark' | 'light';

interface PreferenceStore {
  locale: Locale;
  theme: Theme;
  /** 上次查看的城市：下次进入直接恢复，避免每次都从空白开始 */
  lastLocation: GeoLocation | null;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  rememberLocation: (location: GeoLocation) => void;
}

/**
 * 外观/语言偏好：持久化到 localStorage，并同步到 <html> 的 data-theme 与 lang。
 * 主题走 CSS 变量（见 globals.css），组件只写 bg-surface / text-ink 这类语义类名，
 * 所以换肤不需要任何组件改动。
 */
function applyPreferences(theme: Theme, locale: Locale): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.dataset.theme = theme;
  html.lang = locale === 'zh' ? 'zh-CN' : 'en';
  html.style.colorScheme = theme;
}

export const PREFERENCE_STORAGE_KEY = 'weather:prefs';

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set, get) => ({
      locale: 'zh',
      theme: 'dark',
      lastLocation: null,
      setLocale: (locale) => {
        applyPreferences(get().theme, locale);
        set({ locale });
      },
      setTheme: (theme) => {
        applyPreferences(theme, get().locale);
        set({ theme });
      },
      rememberLocation: (location) => set({ lastLocation: location }),
      toggleTheme: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        applyPreferences(next, get().locale);
        set({ theme: next });
      },
    }),
    {
      name: PREFERENCE_STORAGE_KEY,
      partialize: (state) => ({
        locale: state.locale,
        theme: state.theme,
        lastLocation: state.lastLocation,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) applyPreferences(state.theme, state.locale);
      },
    },
  ),
);

/** 首屏防闪：layout 里内联执行，先于 React 挂载把主题写到 <html> */
export const PREFERENCE_BOOTSTRAP_SCRIPT = `(function(){try{var raw=localStorage.getItem('${PREFERENCE_STORAGE_KEY}');var s=raw?JSON.parse(raw).state||{}:{};var theme=s.theme==='light'?'light':'dark';var locale=s.locale==='en'?'en':'zh';var h=document.documentElement;h.dataset.theme=theme;h.lang=locale==='zh'?'zh-CN':'en';h.style.colorScheme=theme;}catch(e){}})();`;
