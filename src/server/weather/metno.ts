/**
 * 天气预报数据源：MET Norway locationforecast 2.0。
 * 适配层职责：逐小时序列 → 日聚合、symbol_code → WMO 代码、UTC → 地点当地时间。
 */
import { UPSTREAM } from '@/config/api';
import type { DailyForecast, GeoLocation, HourlyPoint, WeatherSnapshot } from '@/types/weather';
import { toLocalDateString, toLocalIsoString } from '@/lib/time';
import { WeatherError } from '@/server/weather-error';

const HOURLY_WINDOW = 24;
const DAILY_WINDOW = 7;

interface MetNoPoint {
  time: string;
  data: {
    instant: {
      details: {
        air_pressure_at_sea_level?: number;
        air_temperature: number;
        relative_humidity?: number;
        wind_speed?: number;
        wind_from_direction?: number;
      };
    };
    next_1_hours?: { summary: { symbol_code: string }; details: { precipitation_amount?: number } };
    next_6_hours?: { summary: { symbol_code: string }; details: { precipitation_amount?: number } };
    next_12_hours?: { summary: { symbol_code: string } };
  };
}

interface MetNoResponse {
  properties?: {
    meta?: { updated_at?: string };
    timeseries?: MetNoPoint[];
  };
}

/** symbol_code → WMO 天气代码（去掉 _day/_night/_polartwilight 后缀后查表） */
const SYMBOL_TO_WMO: Record<string, number> = {
  clearsky: 0,
  fair: 1,
  partlycloudy: 2,
  cloudy: 3,
  fog: 45,
  lightrainshowers: 80,
  rainshowers: 81,
  heavyrainshowers: 82,
  lightrain: 61,
  rain: 63,
  heavyrain: 65,
  lightrainshowersandthunder: 95,
  rainshowersandthunder: 95,
  heavyrainshowersandthunder: 96,
  lightrainandthunder: 95,
  rainandthunder: 95,
  heavyrainandthunder: 96,
  lightsleet: 66,
  sleet: 67,
  heavysleet: 67,
  lightsleetshowers: 66,
  sleetshowers: 67,
  heavysleetshowers: 67,
  lightsnow: 71,
  snow: 73,
  heavysnow: 75,
  lightsnowshowers: 85,
  snowshowers: 85,
  heavysnowshowers: 86,
  lightsleetandthunder: 95,
  sleetandthunder: 95,
  lightsnowandthunder: 95,
  snowandthunder: 95,
  partlycloudyandthunder: 95,
};

function symbolToWmo(symbol: string | undefined): number {
  if (!symbol) return 3;
  return SYMBOL_TO_WMO[symbol.replace(/_(day|night|polartwilight)$/, '')] ?? 3;
}

function symbolIsDay(symbol: string | undefined, fallback: boolean): boolean {
  if (!symbol) return fallback;
  if (symbol.endsWith('_night')) return false;
  if (symbol.endsWith('_day')) return true;
  return fallback;
}

/**
 * 备注：越靠近当前时刻，数据粒度越细。优先 1 小时描述，其次 6 小时、12 小时，
 * 因为远端时段上游只给粗粒度；缺描述时回退到「阴」（WMO 3），不猜晴天。
 */
function pickSymbol(point: MetNoPoint): string | undefined {
  return (
    point.data.next_1_hours?.summary.symbol_code ??
    point.data.next_6_hours?.summary.symbol_code ??
    point.data.next_12_hours?.summary.symbol_code
  );
}

/** 1 小时粒度用 next_1_hours、6 小时粒度用 next_6_hours，避免同段降水被重复累加 */
function precipitationOf(point: MetNoPoint): number {
  const hourly = point.data.next_1_hours?.details.precipitation_amount;
  if (typeof hourly === 'number') return hourly;
  return point.data.next_6_hours?.details.precipitation_amount ?? 0;
}

export async function fetchWeather(location: GeoLocation): Promise<WeatherSnapshot> {
  const url = `${UPSTREAM.forecast}?${new URLSearchParams({
    lat: location.latitude.toFixed(4),
    lon: location.longitude.toFixed(4),
  }).toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': UPSTREAM.userAgent },
      signal: AbortSignal.timeout(UPSTREAM.timeoutMs),
      // 上游 10 分钟更新一次，同粒度缓存可降低公共接口压力
      next: { revalidate: 600 },
    });
  } catch (error) {
    throw new WeatherError('天气服务连接失败，请稍后重试', 502, { cause: error });
  }

  if (response.status === 429) {
    throw new WeatherError('请求太频繁了，请稍后再试', 429);
  }
  if (!response.ok) {
    throw new WeatherError('天气服务暂时不可用，请稍后重试', 502);
  }

  let payload: MetNoResponse;
  try {
    payload = (await response.json()) as MetNoResponse;
  } catch (error) {
    throw new WeatherError('天气数据解析失败，请重试', 502, { cause: error });
  }

  const series = payload.properties?.timeseries ?? [];
  if (series.length === 0) {
    throw new WeatherError('该地点暂无可用天气数据', 404);
  }

  const now = Date.now();
  const currentIndex = Math.max(
    0,
    series.findIndex((point) => new Date(point.time).getTime() >= now - 60 * 60 * 1000),
  );
  const currentPoint = series[currentIndex];
  const currentSymbol = pickSymbol(currentPoint);

  const current = {
    time: toLocalIsoString(new Date(currentPoint.time), location.timezone),
    temperature: currentPoint.data.instant.details.air_temperature,
    humidity: currentPoint.data.instant.details.relative_humidity ?? 0,
    windSpeed: (currentPoint.data.instant.details.wind_speed ?? 0) * 3.6, // m/s → km/h
    windDirection: currentPoint.data.instant.details.wind_from_direction ?? 0,
    pressure: currentPoint.data.instant.details.air_pressure_at_sea_level ?? 0,
    precipitation: precipitationOf(currentPoint),
    weatherCode: symbolToWmo(currentSymbol),
    isDay: symbolIsDay(currentSymbol, true),
  };

  const hourly: HourlyPoint[] = series
    .slice(currentIndex)
    .filter((point) => point.data.next_1_hours)
    .slice(0, HOURLY_WINDOW)
    .map((point) => ({
      time: toLocalIsoString(new Date(point.time), location.timezone),
      temperature: point.data.instant.details.air_temperature,
      weatherCode: symbolToWmo(pickSymbol(point)),
      precipitation: precipitationOf(point),
    }));

  return {
    location,
    current,
    hourly,
    daily: aggregateDaily(series, location.timezone, current.time.slice(0, 10)),
    units: { temperature: '°C', windSpeed: 'km/h', pressure: 'hPa', precipitation: 'mm' },
    updatedAt: payload.properties?.meta?.updated_at ?? new Date().toISOString(),
    provider: 'MET Norway',
  };
}

/**
 * 逐小时序列按当地日期聚合成日预报：
 * 温度取当日 min/max，降水按小时累加，天气符号取离当地 12:00 最近的时段。
 */
function aggregateDaily(
  series: MetNoPoint[],
  timeZone: string,
  todayLocalDate: string,
): DailyForecast[] {
  const buckets = new Map<
    string,
    { temps: number[]; precipitation: number; noonSymbol?: string; noonDistance: number }
  >();

  // 备注：以「地点当地日期」分桶，而不是 UTC 日期——跨时区时 UTC 分桶会把一天拆成两段；
  // 中午 13 点的 symbol 作为当天代表，靠近正午的样本胜出（noonDistance 越小越优先）。
  for (const point of series) {
    const date = toLocalDateString(new Date(point.time), timeZone);
    if (date < todayLocalDate) continue;

    let bucket = buckets.get(date);
    if (!bucket) {
      bucket = { temps: [], precipitation: 0, noonDistance: Number.POSITIVE_INFINITY };
      buckets.set(date, bucket);
    }

    bucket.temps.push(point.data.instant.details.air_temperature);
    bucket.precipitation += precipitationOf(point);

    const hour = Number(toLocalIsoString(new Date(point.time), timeZone).slice(11, 13));
    const hourDistance = Math.abs(hour - 12);
    if (hourDistance < bucket.noonDistance) {
      bucket.noonDistance = hourDistance;
      bucket.noonSymbol = pickSymbol(point);
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, DAILY_WINDOW)
    .map(([date, bucket]) => ({
      date,
      weatherCode: symbolToWmo(bucket.noonSymbol),
      temperatureMax: Math.max(...bucket.temps),
      temperatureMin: Math.min(...bucket.temps),
      precipitation: Math.round(bucket.precipitation * 10) / 10,
    }));
}
