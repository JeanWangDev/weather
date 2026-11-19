import { searchLocations } from '@/server/weather/geocoding';
import { toWeatherError } from '@/server/weather-error';
import { fail, ok } from '@/server/envelope';
import type { Locale } from '@/config/i18n';

/**
 * 地点搜索代理：客户端只与自家 /api 打交道，
 * 上游地址、参数名、超时与排序策略全部收敛在服务端。
 * lang 决定返回的地名语言（zh / en），与界面语言保持一致。
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get('q') ?? '';
  const lang: Locale = params.get('lang') === 'en' ? 'en' : 'zh';

  try {
    const locations = await searchLocations(query, lang);
    return ok(
      { locations },
      { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
    );
  } catch (error) {
    const weatherError = toWeatherError(error);
    return fail(weatherError.message, weatherError.status);
  }
}
