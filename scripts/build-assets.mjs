#!/usr/bin/env node
/**
 * 静态资源管线
 * ----------------------------------------------------------------------------
 * 解决的问题：资源散落在 public/ 里时，引用靠手写字符串 `'/assets/svg/IconMoon.svg'`，
 * 改名/移目录不会报错，只能等到线上 404 才发现。
 *
 * 这个脚本把 public/assets 变成「有类型、可直接引入的组件」：
 *   1. public/assets/svg/*.svg   → 合并成 public/assets/sprite.svg（<symbol> 雪碧图）
 *   2. public/assets/svg/*.svg   → 每个图标生成一个 React 组件（src/assets/icons.tsx）
 *   3. public/assets/images/*    → 登记进清单，并读出像素尺寸（避免加载前布局抖动）
 *   4. 生成 src/assets/manifest.ts（ICONS / IMAGES / IconName / iconHref）
 *      与 src/assets/index.ts（统一出口，`import { IconMoon } from '@/assets'`）
 *
 * 约定：
 *   - 文件名任意写法（kebab / snake / camel）都会归一大驼峰（PascalCase）作为导出名；
 *   - 归一后撞名（如 IconMoon.svg 与 icon-moon.svg 同时存在）直接报错退出，不静默覆盖；
 *   - 生成物勿手改：sprite.svg、src/assets/{icons.tsx,manifest.ts,index.ts} 均有文件头警示。
 *
 * 用法：yarn assets（dev / build 前会自动跑）
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSET_DIR = path.join(ROOT, 'public', 'assets');
const SVG_DIR = path.join(ASSET_DIR, 'svg');
const IMAGE_DIR = path.join(ASSET_DIR, 'images');
const SPRITE_FILE = path.join(ASSET_DIR, 'sprite.svg');
const ASSETS_SRC_DIR = path.join(ROOT, 'src', 'assets');
const MANIFEST_FILE = path.join(ASSETS_SRC_DIR, 'manifest.ts');
const ICONS_FILE = path.join(ASSETS_SRC_DIR, 'icons.tsx');
const INDEX_FILE = path.join(ASSETS_SRC_DIR, 'index.ts');

const SVG_EXT = new Set(['.svg']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']);

/** kebab / snake / camel → PascalCase（Icon-Moon / iconMoon → IconMoon） */
function toPascal(name) {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** 列出目录下的文件；目录不存在时返回空数组，便于 images/ 暂时为空 */
async function listFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/** SVG 的 viewBox 决定 symbol 的比例；缺 viewBox 时用 width/height 兜底 */
function readViewBox(svg) {
  const viewBox = svg.match(/viewBox=["']([^"']+)["']/i);
  if (viewBox) return viewBox[1].trim();
  const width = svg.match(/width=["']([\d.]+)/i);
  const height = svg.match(/height=["']([\d.]+)/i);
  if (width && height) return `0 0 ${width[1]} ${height[1]}`;
  throw new Error('缺少 viewBox，无法合成雪碧图');
}

/**
 * 取 <svg> 内部内容，并把外层标签上的呈现属性（stroke / fill / stroke-width…）一并带出来。
 * 必须带出来：`<svg stroke="currentColor" fill="none">` 这种写法把样式挂在外层，
 * 只取内部路径的话 symbol 里就没有描边，图标会渲染成黑色实心块。
 */
const PRESENTATION_ATTRS = [
  'fill',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'opacity',
  'stroke-opacity',
  'fill-opacity',
];

function readShape(svg) {
  const openTag = svg.match(/<svg\b[^>]*>/i);
  const close = svg.lastIndexOf('</svg>');
  if (!openTag || close < 0) throw new Error('不是合法的 SVG');

  const attrs = [];
  for (const name of PRESENTATION_ATTRS) {
    const matched = openTag[0].match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
    if (matched) attrs.push(`${name}="${matched[1]}"`);
  }

  return { inner: svg.slice(openTag.index + openTag[0].length, close).trim(), attrs };
}

/** 只读文件头就能拿到位图尺寸：PNG 的 IHDR / JPEG 的 SOF 段 */
function readImageSize(buffer, ext) {
  if (ext === '.png' && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if ((ext === '.jpg' || ext === '.jpeg') && buffer.length > 4) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      // SOF0..SOF15（排除 DHT/JPG/DAC 三个非 SOF 标记）
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return { width: 0, height: 0 };
}

function assertNoDuplicate(items, kind) {
  const seen = new Map();
  for (const item of items) {
    if (seen.has(item.key)) {
      throw new Error(
        `${kind} 命名冲突：${seen.get(item.key)} 与 ${item.file} 归一后都是 ${item.key}，请改名`,
      );
    }
    seen.set(item.key, item.file);
  }
}

async function buildIcons() {
  const files = (await listFiles(SVG_DIR)).filter((file) =>
    SVG_EXT.has(path.extname(file).toLowerCase()),
  );
  const icons = [];
  for (const file of files.sort()) {
    const source = await readFile(path.join(SVG_DIR, file), 'utf8');
    icons.push({
      key: toPascal(path.basename(file, path.extname(file))),
      file,
      viewBox: readViewBox(source),
      ...readShape(source),
    });
  }
  assertNoDuplicate(icons, '图标');

  const symbols = icons
    .map(
      (icon) =>
        `  <symbol id="${icon.key}" viewBox="${icon.viewBox}"${
          icon.attrs.length ? ` ${icon.attrs.join(' ')}` : ''
        }>${icon.inner}</symbol>`,
    )
    .join('\n');
  const sprite = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- 由 scripts/build-assets.mjs 生成，请勿手改；源文件在 public/assets/svg/ -->',
    '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
    symbols,
    '</svg>',
    '',
  ].join('\n');
  await writeFile(SPRITE_FILE, sprite, 'utf8');
  return icons;
}

async function buildImages() {
  const files = (await listFiles(IMAGE_DIR)).filter((file) =>
    IMAGE_EXT.has(path.extname(file).toLowerCase()),
  );
  const images = [];
  for (const file of files.sort()) {
    const buffer = await readFile(path.join(IMAGE_DIR, file));
    const ext = path.extname(file).toLowerCase();
    images.push({
      key: toPascal(path.basename(file, ext)),
      file,
      src: `/assets/images/${file}`,
      ...readImageSize(buffer, ext),
    });
  }
  assertNoDuplicate(images, '图片');
  return images;
}

function renderManifest(icons, images) {
  const iconEntries = icons.map((icon) => `  ${icon.key}: '${icon.key}',`).join('\n');
  const imageEntries = images
    .map(
      (image) =>
        `  ${image.key}: { src: '${image.src}', width: ${image.width}, height: ${image.height} },`,
    )
    .join('\n');

  return `/**
 * 资源清单 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 * 源文件：public/assets/svg/*.svg（合成雪碧图）、public/assets/images/*（位图）
 * 重新生成：yarn assets
 */

/** 雪碧图地址：所有图标共用一次请求，靠 <use href="#id"> 复用 */
export const SPRITE_URL = '/assets/sprite.svg';

/** 图标清单。键与 symbol id 都是大驼峰，拼错即类型错误 */
export const ICONS = {
${iconEntries || '  // 暂无图标：把 .svg 放进 public/assets/svg/ 后重跑 yarn assets'}
} as const;

export type IconName = keyof typeof ICONS;

/** 位图清单，附带原始像素尺寸（用于设置宽高比，避免加载前布局抖动） */
export const IMAGES = {
${imageEntries || '  // 暂无位图：把 .png/.jpg/.webp 放进 public/assets/images/ 后重跑 yarn assets'}
} as const;

export type ImageName = keyof typeof IMAGES;

/** 生成 <use> 需要的片段：/assets/sprite.svg#IconMoon */
export function iconHref(name: IconName): string {
  return \`\${SPRITE_URL}#\${ICONS[name]}\`;
}
`;
}

function renderIcons(icons) {
  const components = icons
    .map(
      (icon) => `export function ${icon.key}(props: IconProps) {
  return <Icon name={ICONS.${icon.key}} {...props} />;
}`,
    )
    .join('\n\n');

  return `/**
 * 图标组件 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 *
 * 每个图标一个组件，直接从 '@/assets' 引入即可，不需要再包一层：
 *   import { IconMoon } from '@/assets';
 *   <IconMoon size={17} className="text-ink" />
 *
 * 需要按数据里的名字动态取图标时（如天气码 → 图标），用 \`Icon\`：
 *   <Icon name={condition.icon} size={54} />
 *
 * 所有组件共用 public/assets/sprite.svg，一次请求、浏览器缓存复用，
 * 颜色走 currentColor，换主题不用另出图标。
 */
import type { SVGProps } from 'react';
import { ICONS, iconHref, type IconName } from './manifest';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref' | 'name'> {
  size?: number;
}

export function Icon({ name, size = 16, className, ...rest }: IconProps & { name: IconName }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={className}
      {...rest}
    >
      <use href={iconHref(name)} />
    </svg>
  );
}

${components}
`;
}

function renderIndex() {
  return `/**
 * 静态资源总出口 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 *
 *   import { IconMoon, IconSun, IconRain, IMAGES } from '@/assets';
 *
 * 重新生成：yarn assets
 */
export * from './manifest';
export * from './icons';
`;
}

async function main() {
  await mkdir(ASSETS_SRC_DIR, { recursive: true });
  const [icons, images] = await Promise.all([buildIcons(), buildImages()]);
  await Promise.all([
    writeFile(MANIFEST_FILE, renderManifest(icons, images), 'utf8'),
    writeFile(ICONS_FILE, renderIcons(icons), 'utf8'),
    writeFile(INDEX_FILE, renderIndex(), 'utf8'),
  ]);
  console.log(
    `[assets] 图标 ${icons.length} 个 → sprite.svg + icons.tsx（${icons.length} 个组件）；位图 ${images.length} 个 → manifest.ts`,
  );
}

main().catch((error) => {
  console.error(`[assets] 失败：${error.message}`);
  process.exit(1);
});
