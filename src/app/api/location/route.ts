import { reverseGeocode } from '@/server/weather/reverse';
import { toWeatherError } from '@/server/weather-error';
import { fail, ok } from '@/server/envelope';
import type { Locale } from '@/config/i18n';

/**
 * 逆地理编码：GET /api/location?lat=&lon=&tz=&lang=
 * 供「使用我的位置」把浏览器坐标系结果翻译成可读地名。
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const latitude = Number(params.get('lat'));
  const longitude = Number(params.get('lon'));
  const timezone = params.get('tz') ?? 'UTC';
  const lang: Locale = params.get('lang') === 'en' ? 'en' : 'zh';

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return fail('缺少或无效的坐标参数', 400);
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return fail('经纬度超出有效范围', 400);
  }

  try {
    const location = await reverseGeocode(latitude, longitude, lang, timezone);
    return ok(location, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    const weatherError = toWeatherError(error);
    return fail(weatherError.message, weatherError.status);
  }
}
