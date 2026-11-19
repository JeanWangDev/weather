'use client';

import { LOCALES } from '@/config/i18n';
import { useI18n } from '@/hooks/use-i18n';
import { usePreferenceStore } from '@/stores/use-preference-store';
import { cn } from '@/lib/cn';
import { IconMoon, IconSun } from '@/assets';

/**
 * 外观控制条：主题切换 + 语言切换。
 * 两个开关都只写偏好 store，主题靠 CSS 变量、语言靠 i18n 词典生效，
 * 组件本身不持有任何翻译或配色逻辑。
 */
export default function AppControls() {
  const { locale, setLocale, t } = useI18n();
  const theme = usePreferenceStore((store) => store.theme);
  const toggleTheme = usePreferenceStore((store) => store.toggleTheme);

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center rounded-pill border border-line bg-surface-solid p-1 backdrop-blur-xl"
        role="group"
        aria-label={t('languageLabel')}
      >
        {LOCALES.map((item) => (
          <button
            key={item.value}
            type="button"
            lang={item.value === 'zh' ? 'zh-CN' : 'en'}
            className={cn(
              'rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-colors',
              locale === item.value
                ? 'bg-accent-soft text-accent'
                : 'text-ink-faint hover:text-ink',
            )}
            aria-pressed={locale === item.value}
            onClick={() => setLocale(item.value)}
          >
            {item.short}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="grid h-[34px] w-[34px] place-items-center rounded-full border border-line bg-surface-solid text-base backdrop-blur-xl transition hover:border-accent hover:bg-accent-soft"
        onClick={toggleTheme}
        aria-label={isDark ? t('themeToLight') : t('themeToDark')}
        title={isDark ? t('themeToLight') : t('themeToDark')}
      >
        {/* 图标组件由 public/assets/svg 生成；颜色随 currentColor 走主题。
            这里必须显式给 text-ink：按钮本身没有文字色，继承下来是近白色，浅色主题下会看不见 */}
        {isDark ? (
          <IconSun size={17} className="text-ink" />
        ) : (
          <IconMoon size={17} className="text-ink" />
        )}
      </button>
    </div>
  );
}
