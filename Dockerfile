# ---- 基础层：三阶段共用同一 Node 版本，避免构建机与运行机漂移 ----
# 基础镜像做成 ARG：默认走 Docker Hub；内网或镜像站环境可
# `docker build --build-arg NODE_IMAGE=docker.m.daocloud.io/library/node:22-alpine .`
ARG NODE_IMAGE=node:22-alpine
FROM ${NODE_IMAGE} AS base
WORKDIR /app
# Yarn 4 只有 corepack / yarnpkg.com 两个来源（npm 上的 `yarn` 包停在 1.22）。
# 这里用 Node 自带的 fetch 直接取官方发布的单文件 CLI，和 corepack 拉的是同一个文件：
# 好处是不必 apt/apk 装 curl（精简镜像里常常连包管理器索引都不通），且只下一层，
# 不会像 corepack 那样在多阶段构建里每个 stage 各下载一次。
RUN for i in 1 2 3 4 5; do \
      node -e "const fs=require('fs');fetch('https://repo.yarnpkg.com/4.18.0/packages/yarnpkg-cli/bin/yarn.js').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text()}).then(t=>{fs.writeFileSync('/usr/local/bin/yarn',t);fs.chmodSync('/usr/local/bin/yarn',0o755)})" \
      && break || sleep 5; \
    done \
 && yarn --version
# Next 的 telemetry 在容器内没有意义，且会在构建日志里刷随机 ID
ENV NEXT_TELEMETRY_DISABLED=1

# ---- 依赖层：只装依赖，只在 package.json / yarn.lock 变化时失效 ----
# 单独成层是为了让改业务代码时能命中 Docker 缓存，不用重装依赖
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# ---- 构建层：编译 Next ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# ---- 运行层：只带 standalone 产物，非 root 运行 ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# standalone 里有 server.js 与被裁剪过的 node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# public 里有 SVG 图标源文件（构建期被 SVGR 编译进 JS，同时也可按 /assets/svg/x.svg 直接访问）
# 位图若后续放进 public/assets/images，这一行保证镜像里同样可用
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# 容器自检：/ 返回 2xx 才算健康。用 node 内置 fetch，不额外装 curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# standalone 的启动方式就是这样，不要再 `next start`
CMD ["node", "server.js"]
