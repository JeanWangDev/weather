'use client';

import { useCallback } from 'react';
import { dictionaries, format, type Locale, type TranslationKey } from '@/config/i18n';
import { usePreferenceStore } from '@/stores/use-preference-store';

/**
 * 取词器：`t('title')` / `t('updatedAt', { time: '17:21' })`。
 * 词典按 locale 从 config/i18n 取，组件不感知语言实现细节。
 */
export function useI18n() {
  const locale = usePreferenceStore((store) => store.locale);
  const setLocale = usePreferenceStore((store) => store.setLocale);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      format(dictionaries[locale][key], vars),
    [locale],
  );

  return { locale, setLocale, t };
}

export type { Locale };
