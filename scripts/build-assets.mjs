#!/usr/bin/env node
/**
 * 静态资源管线
 * ----------------------------------------------------------------------------
 * 图标的用法就一句：`import { SvgPor } from '@/assets'` → `<SvgPor.IconMoon width={17} />`
 * 这个脚本只干一件事：把 public/assets/svg 里的文件登记成 SvgPor 类上的静态属性。
 *
 * 为什么源文件放 public/ 而不是 src/：静态资源就一个家（public/assets），
 * 图片、svg 都在同一个目录里按名字管理；为了能让它们被 import 成组件，
 * 用 tsconfig 的 `@public/*` 别名把 public 目录也纳入解析范围（Next 会读取 tsconfig paths）。
 *
 * 为什么还要脚本：手写 `import X from './svg/xxx.svg'` 时，新增一个图标要改两处（文件 + 清单），
 * 漏改不会有任何提示，只在渲染时白屏。生成后清单与文件永远同步，属性名还是类型安全的。
 *
 * 顺带把 public/assets/images 的位图登记成 IMAGES（带像素尺寸，避免加载前布局抖动）。
 *
 * 约定：
 *   - 文件名任意写法（kebab / snake / camel）都会归一大驼峰（PascalCase）作为属性名；
 *   - 归一后撞名直接报错退出，不静默覆盖；
 *   - 生成物（src/assets/{icons,images,index}.ts）勿手改。
 *
 * 用法：yarn assets（dev / build 前会自动跑）
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'src', 'assets');
const SVG_DIR = path.join(ROOT, 'public', 'assets', 'svg');
const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'images');
const ICONS_FILE = path.join(ASSETS_DIR, 'icons.ts');
const IMAGES_FILE = path.join(ASSETS_DIR, 'images.ts');
const INDEX_FILE = path.join(ASSETS_DIR, 'index.ts');

const SVG_EXT = '.svg';
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']);

/** kebab / snake / camel → PascalCase（icon-moon / iconMoon → IconMoon） */
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
    if (seen.has(item.name)) {
      throw new Error(
        `${kind} 命名冲突：${seen.get(item.name)} 与 ${item.file} 归一后都是 ${item.name}，请改名`,
      );
    }
    seen.set(item.name, item.file);
  }
}

async function buildIcons() {
  const icons = (await listFiles(SVG_DIR))
    .filter((file) => file.toLowerCase().endsWith(SVG_EXT))
    .sort()
    .map((file) => ({ name: toPascal(file.slice(0, -SVG_EXT.length)), file }));
  assertNoDuplicate(icons, '图标');
  return icons;
}

async function buildImages() {
  const images = [];
  const files = (await listFiles(IMAGE_DIR))
    .filter((file) => IMAGE_EXT.has(path.extname(file).toLowerCase()))
    .sort();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const size = readImageSize(await readFile(path.join(IMAGE_DIR, file)), ext);
    images.push({ name: toPascal(path.basename(file, ext)), file, ...size });
  }

  assertNoDuplicate(images, '图片');
  return images;
}

function renderIcons(icons) {
  const imports = icons
    .map((icon) => `import ${icon.name} from '@public/assets/svg/${icon.file}';`)
    .join('\n');
  const statics = icons.map((icon) => `  static ${icon.name} = ${icon.name};`).join('\n');
  const registry = icons.map((icon) => `  ${icon.name},`).join('\n');

  return `/**
 * 图标注册表 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 * 源文件：public/assets/svg/*.svg（文件名即属性名，大驼峰）
 * 重新生成：yarn assets
 *
 * 用法：
 *   import { SvgPor } from '@/assets';
 *   <SvgPor.IconMoon width={17} height={17} className="text-ink" />
 *
 * 或按数据里的名字动态取（类属性不能直接用变量索引，用同名 helper）：
 *   const Glyph = svgIcon(condition.icon);
 *   <Glyph width={48} height={48} />
 */
${imports}

/** 名字 → 组件映射，供「按数据里的图标名动态取」使用 */
const REGISTRY = {
${registry || '  // 暂无图标'}
} as const;

export class SvgPor {
${statics || '  // 暂无图标：把 .svg 放进 public/assets/svg/ 后重跑 yarn assets'}
}

/** 图标名（= 类属性名 = svg 文件名）。拼错即编译报错 */
export type SvgIconName = keyof typeof REGISTRY;

/** 动态取图标：const Glyph = svgIcon(condition.icon) */
export function svgIcon(name: SvgIconName) {
  return REGISTRY[name];
}
`;
}

function renderImages(images) {
  const sizes = images
    .map(
      (image) => `const SIZE_${image.name} = { width: ${image.width}, height: ${image.height} };`,
    )
    .join('\n');
  const entries = images
    .map(
      (image) => `  ${image.name}: { src: '/assets/images/${image.file}', ...SIZE_${image.name} },`,
    )
    .join('\n');

  return `/**
 * 位图注册表 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 * 源文件：public/assets/images/*（png / jpg / webp / avif / gif）
 * 重新生成：yarn assets
 */
${sizes ? `${sizes}\n` : ''}
export const IMAGES = {
${entries || '  // 暂无位图：把图片放进 public/assets/images/ 后重跑 yarn assets'}
} as const;

export type ImageName = keyof typeof IMAGES;
`;
}

function renderIndex() {
  return `/**
 * 静态资源总出口 —— 由 scripts/build-assets.mjs 生成，请勿手改。
 *
 *   import { SvgPor, IMAGES } from '@/assets';
 *
 * 重新生成：yarn assets
 */
export * from './icons';
export * from './images';
`;
}

async function main() {
  await mkdir(ASSETS_DIR, { recursive: true });
  const [icons, images] = await Promise.all([buildIcons(), buildImages()]);

  await Promise.all([
    writeFile(ICONS_FILE, renderIcons(icons), 'utf8'),
    writeFile(IMAGES_FILE, renderImages(images), 'utf8'),
    writeFile(INDEX_FILE, renderIndex(), 'utf8'),
  ]);

  console.log(
    `[assets] 图标 ${icons.length} 个 → src/assets/icons.ts（SvgPor 类）；位图 ${images.length} 个 → src/assets/images.ts`,
  );
}

main().catch((error) => {
  console.error(`[assets] 失败：${error.message}`);
  process.exit(1);
});
