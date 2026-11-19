'use client';

import { useMemo } from 'react';
import { MAP_TILE, buildExternalMapUrl, buildTileUrl, hasBasemapCoverage } from '@/config/map';
import { useI18n } from '@/hooks/use-i18n';
import type { GeoLocation, HourlyPoint } from '@/types/weather';
import { formatCoordinate } from '@/lib/format';
import { SvgPor } from '@/assets';

interface LocationMapProps {
  location: GeoLocation;
  hourly: HourlyPoint[];
}

/** 经纬度 → 分数瓦片坐标（Web Mercator） */
function toFractionalTile(latitude: number, longitude: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((longitude + 180) / 360) * n;
  const latRad = (latitude * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/**
 * 位置地图：真实栅格瓦片（高德 XYZ）+ 中心标记。
 *
 * 为什么自己拼瓦片而不引 Leaflet/Mapbox：
 * 需求只是「把当前城市钉在地图上」，Leaflet 会带来一整套交互状态机与 ~140KB 依赖；
 * 这里 3×3 瓦片 + 手算墨卡托投影就够，且完全可控（主题滤镜、无手势冲突）。
 */
export default function LocationMap({ location, hourly }: LocationMapProps) {
  const { t } = useI18n();

  // 高德瓦片只覆盖中国境内；境外坐标会拿到纯白瓦片，因此先判覆盖再决定是否画底图
  const covered = hasBasemapCoverage(location.latitude, location.longitude);

  const tiles = useMemo(() => {
    if (!hasBasemapCoverage(location.latitude, location.longitude)) return [];

    const zoom = MAP_TILE.zoom;
    const size = MAP_TILE.size;
    const { x: fx, y: fy } = toFractionalTile(location.latitude, location.longitude, zoom);
    const baseX = Math.floor(fx);
    const baseY = Math.floor(fy);
    const count = 2 ** zoom;

    const items: Array<{ key: string; src: string; left: string; top: string }> = [];

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const tx = (baseX + dx + count) % count;
        const ty = baseY + dy;
        if (ty < 0 || ty >= count) continue;

        items.push({
          key: `${zoom}/${tx}/${ty}`,
          src: buildTileUrl(tx, ty, zoom),
          left: `calc(50% + ${((tx - fx) * size).toFixed(1)}px)`,
          top: `calc(50% + ${(baseY + dy - fy) * size}px)`,
        });
      }
    }

    return items;
  }, [location.latitude, location.longitude]);

  // 未来两小时是否有降水：直接由逐小时数据求和，不做"假结论"
  const nextTwoHoursRain = hourly.slice(0, 2).reduce((sum, point) => sum + point.precipitation, 0);
  const rainText = nextTwoHoursRain > 0.05 ? t('rainSome') : t('rainNone');

  return (
    <section
      className="panel flex h-full animate-fadeUp flex-col overflow-hidden p-0"
      aria-label={t('mapAria')}
    >
      <div className="relative min-h-[188px] flex-1 overflow-hidden">
        {/* 3×3 瓦片铺满容器，深色主题由 CSS 滤镜统一反相 */}
        {/* 这里刻意用原生 img：瓦片是外部图床的固定尺寸 PNG，不需要 next/image 的优化管线 */}
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            aria-hidden
            loading="eager"
            referrerPolicy="no-referrer"
            className="map-tiles pointer-events-none absolute h-64 w-64 max-w-none select-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}

        {!covered && (
          <div
            className="absolute inset-0 bg-tile"
            style={{
              backgroundImage:
                'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
            aria-hidden
          />
        )}

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="block h-3 w-3 rounded-full border-2 border-white bg-accent shadow-[0_0_0_6px_var(--accent-soft)]" />
        </div>

        {!covered && (
          <p className="absolute inset-x-0 bottom-6 m-0 px-4 text-center text-[11px] text-ink-muted">
            {t('mapUnavailable')}
          </p>
        )}

        <div className="absolute left-3 top-3 rounded-pill bg-surface-solid px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">
          {location.name} · {formatCoordinate(location.latitude, location.longitude)}
        </div>

        <span className="absolute bottom-1.5 left-2 rounded-pill bg-surface-solid px-2 py-0.5 text-[10px] text-ink-faint backdrop-blur">
          {t('mapAttribution')}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3.5 py-2.5">
        <p className="m-0 line-clamp-1 text-[12px] text-ink-muted" title={rainText}>
          {rainText}
        </p>
        <a
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent transition hover:underline"
          href={buildExternalMapUrl(location.latitude, location.longitude, location.name)}
          target="_blank"
          rel="noreferrer"
        >
          {t('openMap')}
          <SvgPor.IconArrowUpRight width={13} height={13} />
        </a>
      </div>
    </section>
  );
}
