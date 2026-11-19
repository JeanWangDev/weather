/**
 * 让 TypeScript 认识「import X from './x.svg'」：
 * 经 next.config.mjs 里的 SVGR 规则后，默认导出是一个 React 组件，
 * 可接受的 props 就是普通 SVG 属性（width / height / className / style…）。
 */
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';

  const SvgComponent: FC<SVGProps<SVGSVGElement>>;
  export default SvgComponent;
}
