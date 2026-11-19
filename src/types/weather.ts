/**
 * 天气领域模型（与后端 DTO 对应）。
 * 目录约定对齐 Velora-web：src/types 只放跨层复用的数据结构，不放逻辑。
 */

export interface GeoLocation {
  id: number;
  name: string;
  country: string;
  /** 一级行政区，如「广东省」 */
  admin1?: string;
  latitude: number;
  longitude: number;
  /** IANA 时区，如 Asia/Shanghai */
  timezone: string;
  /** 城市人口，用于结果排序与同名城市区分 */
  population?: number;
}

export interface CurrentWeather {
  /** 当地时间，形如 2026-11-19T14:00 */
  time: string;
  temperature: number;
  /** 体感温度：数据源不提供时缺失，UI 自动隐藏 */
  apparentTemperature?: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  /** 近 1 小时降水量（mm） */
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitation: number;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherSnapshot {
  location: GeoLocation;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyForecast[];
  units: {
    temperature: string;
    windSpeed: string;
    pressure: string;
    precipitation: string;
  };
  /** 数据源最后更新时间（ISO） */
  updatedAt: string;
  /** 数据来源标识，用于脚注展示与排障 */
  provider: string;
}

/** 推荐城市概览：一个城市当前天气的轻量快照（用于头部胶囊） */
export interface CityOverview {
  /** 请求时用的城市名，用于和胶囊文案对齐（上游可能返回繁体译名，如「紐約市」） */
  query: string;
  location: GeoLocation;
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}
