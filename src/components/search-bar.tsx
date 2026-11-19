'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocationSearch } from '@/hooks/use-location-search';
import { useI18n } from '@/hooks/use-i18n';
import { resolveErrorKey } from '@/config/i18n';
import type { GeoLocation } from '@/types/weather';
import { formatPopulation } from '@/lib/format';
import { cn } from '@/lib/cn';
import { IconLocate } from '@/assets';

interface SearchBarProps {
  onSelect: (location: GeoLocation) => void;
  /** 字段内的定位入口：与头部 logo 走同一套逻辑 */
  onLocate: () => void;
  locating: boolean;
}

/**
 * 地点搜索框。
 * 键盘可达（↑/↓ 高亮、Enter 选中、Esc 关闭）、点击外部收起、
 * 空结果与错误都在下拉内提示，不静默失败。
 */
export default function SearchBar({ onSelect, onLocate, locating }: SearchBarProps) {
  const { locale, t } = useI18n();
  const { query, results, status, errorStatus, setQuery, clear } = useLocationSearch(locale);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function handleSelect(location: GeoLocation) {
    onSelect(location);
    clear();
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % results.length);
      return;
    }
    if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
      return;
    }
    if (event.key === 'Enter') {
      const target = results[activeIndex] ?? results[0];
      if (target) {
        event.preventDefault();
        handleSelect(target);
      }
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown = open && (query.trim().length >= 2 || status === 'error');

  return (
    <div className="relative w-full max-w-search" ref={containerRef}>
      <div
        className={cn(
          'flex h-14 items-center gap-3 rounded-pill border bg-surface-solid px-[18px] backdrop-blur-xl transition',
          'border-line focus-within:border-accent',
          'focus-within:shadow-[0_0_0_4px_var(--accent-soft)]',
        )}
      >
        <span className="-translate-y-px text-lg leading-none text-ink-muted" aria-hidden>
          ⌕
        </span>
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] tracking-[0.01em] outline-none placeholder:text-ink-faint"
          type="search"
          value={query}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchAria')}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="grid h-[26px] w-[26px] place-items-center rounded-full bg-tile-strong text-xs text-ink-muted transition hover:bg-surface-strong hover:text-ink"
            onClick={clear}
            aria-label={t('searchClear')}
          >
            ✕
          </button>
        )}
        {status === 'loading' && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent"
            aria-label={t('searching')}
          />
        )}

        <span className="h-6 w-px shrink-0 bg-line" aria-hidden />

        <button
          type="button"
          onClick={onLocate}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted transition hover:bg-accent-soft hover:text-accent"
          aria-label={t('locate')}
          title={t('locate')}
        >
          {locating ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
          ) : (
            /* 十字准星图标：public/assets/svg/IconLocate.svg，经雪碧图复用 */
            <IconLocate size={16} />
          )}
        </button>
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 max-h-80 animate-dropIn overflow-y-auto rounded-tile border border-line bg-surface-solid p-2 shadow-card backdrop-blur-2xl"
          role="listbox"
          aria-label={t('resultsAria')}
        >
          {status === 'loading' && (
            <p className="m-0 p-3 text-[13px] text-ink-faint">{t('searching')}</p>
          )}

          {status === 'error' && (
            <p className="m-0 p-3 text-[13px] text-danger-text">
              {t(resolveErrorKey(errorStatus ?? 0))}
            </p>
          )}

          {status === 'success' && results.length === 0 && (
            <p className="m-0 p-3 text-[13px] text-ink-faint">{t('noResults', { query })}</p>
          )}

          {status === 'success' &&
            results.map((location, index) => (
              <button
                key={location.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 rounded-[10px] px-3 py-2.5 text-left transition-colors',
                  index === activeIndex && 'bg-accent-soft',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(location)}
              >
                <span className="text-sm font-semibold">{location.name}</span>
                <span className="text-xs text-ink-faint">
                  {[
                    location.admin1,
                    location.country,
                    formatPopulation(location.population, locale),
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
