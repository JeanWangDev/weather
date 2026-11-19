/**
 * 地图瓦片配置。
 *
 * 选型：OSM / Carto 在本机网络均不可达，高德栅格瓦片（webrd）可达且中国境内覆盖最好，
 * 因此用它作为真实底图。瓦片模板遵循标准 XYZ（Web Mercator）。
 * 深色主题不做单独底图源（高德无官方暗色瓦片），改用 CSS 滤镜反相，见 globals.css。
 */
export const MAP_TILE = {
  url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
  size: 256,
  zoom: 11,
} as const;

/**
 * 高德栅格瓦片的覆盖范围（中国境内）。
 *
 * 备注：高德境外瓦片不是"没有图"，而是返回一张纯白的 256×256 PNG——
 * 直接把境外城市的坐标丢给它会得到一张空白底图，标记点悬在白色背景上。
 * 因此先按经纬度判断覆盖，境外改为渲染"无底图"提示，而不是假装画出一张地图。
 */
const BASEMAP_BOUNDS = { minLat: 17.5, maxLat: 54, minLon: 73, maxLon: 135.5 } as const;

export function hasBasemapCoverage(latitude: number, longitude: number): boolean {
  return (
    latitude >= BASEMAP_BOUNDS.minLat &&
    latitude <= BASEMAP_BOUNDS.maxLat &&
    longitude >= BASEMAP_BOUNDS.minLon &&
    longitude <= BASEMAP_BOUNDS.maxLon
  );
}

/** 按标准 XYZ 模板拼单张瓦片地址（{x}/{y}/{z} 三处替换） */
export function buildTileUrl(x: number, y: number, zoom: number = MAP_TILE.zoom): string {
  return MAP_TILE.url
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{z}', String(zoom));
}

/** 外部地图深链（高德 URI，坐标顺序是 lon,lat） */
export function buildExternalMapUrl(latitude: number, longitude: number, name: string): string {
  const label = encodeURIComponent(name);
  return `https://uri.amap.com/marker?position=${longitude},${latitude}&name=${label}&coordinate=gaode&callnative=0`;
}
