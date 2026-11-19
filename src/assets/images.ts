/**
 * 位图注册表 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 * 源文件：public/assets/images/*（png / jpg / webp / avif / gif）
 * 重新生成：yarn assets
 */

export const IMAGES = {
  // 暂无位图：把图片放进 public/assets/images/ 后重跑 yarn assets
} as const;

export type ImageName = keyof typeof IMAGES;
