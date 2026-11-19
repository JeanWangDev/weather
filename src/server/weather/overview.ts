/**
 * 推荐城市概览：一次拿到多个城市的当前温度，用于头部胶囊。
 *
 * 为什么放服务端批量：客户端逐个请求会有 6 次往返 + 6 次地理编码，
 * 这里在服务端并发解析并做 10 分钟缓存，多用户共享同一份结果。
 * 单个城市失败不影响其它城市（Promise.allSettled），避免一颗老鼠屎坏一锅汤。
 */
import type { Locale } from '@/config/i18n';
import type { CityOverview } from '@/types/weather';
import { searchLocations } from './geocoding';
import { fetchWeather } from './metno';

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { data: CityOverview; cachedAt: number }>();

async function loadCity(name: string, lang: Locale): Promise<CityOverview> {
  const key = `${lang}:${name}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.data;

  const [first] = await searchLocations(name, lang);
  if (!first) throw new Error(`city not found: ${name}`);

  const snapshot = await fetchWeather(first);
  const data: CityOverview = {
    query: name,
    location: first,
    temperature: snapshot.current.temperature,
    weatherCode: snapshot.current.weatherCode,
    isDay: snapshot.current.isDay,
  };

  cache.set(key, { data, cachedAt: Date.now() });
  return data;
}

export async function getCityOverview(names: string[], lang: Locale): Promise<CityOverview[]> {
  const settled = await Promise.allSettled(names.map((name) => loadCity(name, lang)));

  return settled
    .filter((item): item is PromiseFulfilledResult<CityOverview> => item.status === 'fulfilled')
    .map((item) => item.value);
}
