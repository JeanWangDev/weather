'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebounceFn } from 'ahooks';
import { WeatherService } from '@/services/weather-service';
import { ApiClientError } from '@/services/api-client-error';
import type { Locale } from '@/config/i18n';
import type { GeoLocation } from '@/types/weather';

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

type SearchStatus = 'idle' | 'typing' | 'loading' | 'success' | 'error';

interface UseLocationSearchResult {
  query: string;
  results: GeoLocation[];
  status: SearchStatus;
  errorStatus: number | null;
  setQuery: (value: string) => void;
  clear: () => void;
}

/**
 * 地点搜索：输入 → ahooks 防抖 → 请求 → 结果。
 * 防抖负责"少发请求"，AbortController 负责"丢弃过期结果"，两者职责分开。
 * locale 作为依赖：切换语言后重新搜索会拿到对应语言的地名。
 */
export function useLocationSearch(locale: Locale): UseLocationSearchResult {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const { run: runSearch, cancel: cancelSearch } = useDebounceFn(
    async (value: string) => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const payload = await WeatherService.searchLocations(value, locale, controller.signal);
        setResults(payload.locations ?? []);
        setStatus('success');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResults([]);
        setErrorStatus(err instanceof ApiClientError ? err.status : 500);
        setStatus('error');
      }
    },
    { wait: DEBOUNCE_MS },
  );

  const setQuery = (value: string) => {
    setQueryState(value);
    if (!value.trim()) {
      abortRef.current?.abort();
      setResults([]);
      setStatus('idle');
      setErrorStatus(null);
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    cancelSearch();
    setQueryState('');
    setResults([]);
    setStatus('idle');
    setErrorStatus(null);
  };

  useEffect(() => {
    const trimmed = query.trim();

    abortRef.current?.abort();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setStatus(trimmed.length === 0 ? 'idle' : 'typing');
      setResults([]);
      setErrorStatus(null);
      cancelSearch();
      return;
    }

    setStatus('loading');
    setErrorStatus(null);
    runSearch(trimmed);

    return cancelSearch;
  }, [query, runSearch, cancelSearch]);

  return { query, results, status, errorStatus, setQuery, clear };
}
