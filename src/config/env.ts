/**
 * 环境相关常量（对齐 Velora-web 的 config/env）。
 * 只放"随环境变化"的值；接口地址拼接放 config/api。
 */

/** 浏览器同源请求走 Next 的 Route Handler（/api/*），无需跨域，也不需要 CORS 配置 */
export const API_BASE_PATH = '/api';

/** 客户端请求超时（毫秒）：10s 足够覆盖冷启动，又不至于让用户干等 */
export const REQUEST_TIMEOUT_MS = 10_000;
