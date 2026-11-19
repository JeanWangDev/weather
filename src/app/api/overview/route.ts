import { getCityOverview } from '@/server/weather/overview';
import { toWeatherError } from '@/server/weather-error';
import { fail, ok } from '@/server/envelope';
import type { Locale } from '@/config/i18n';

/**
 * GET /api/overview?cities=北京,上海&lang=zh
 * 返回推荐城市的当前温度，供头部胶囊展示「城市 + 天气图标 + 温度」。
 */
const MAX_CITIES = 8;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lang: Locale = params.get('lang') === 'en' ? 'en' : 'zh';

  const cities = (params.get('cities') ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, MAX_CITIES);

  if (cities.length === 0) {
    return fail('缺少城市列表参数', 400);
  }

  try {
    const items = await getCityOverview(cities, lang);
    return ok(
      { items },
      // no-store：响应里带「请求用的城市名」，浏览器缓存会拿旧结构当新数据用（踩过）
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const weatherError = toWeatherError(error);
    return fail(weatherError.message, weatherError.status);
  }
}
