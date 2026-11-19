# 天气应用 · Weather App

用 Next.js 14 + React 18 + TypeScript + Tailwind CSS 实现的城市天气应用：搜索地点、当前天气、未来 24 小时与未来 7 天预报，加载态 / 错误态 / 空态齐全。

![tech](https://img.shields.io/badge/Next.js-14.2-000) ![tech](https://img.shields.io/badge/React-18.3-61dafb) ![tech](https://img.shields.io/badge/TypeScript-5.5-3178c6) ![tech](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8) ![tech](https://img.shields.io/badge/Zustand-5-764abc)

![深色 · 中文：推荐城市胶囊带温度 + 天气卡与地图并排](docs/preview-current.png)
![浅色 · 英文：同一套布局，底图还原为浅色](docs/preview-light-en.png)

---

## 快速开始

```bash
yarn install
yarn dev            # http://localhost:3000
```

其他命令：`yarn lint` / `yarn format` / `yarn typecheck` / `yarn build` / `yarn start`。

> 无需任何 API Key 或 `.env`，开箱即用。
>
> 包管理器为 Yarn 4（`.yarnrc.yml` 固定 `nodeLinker: node-modules`，即常规 `node_modules` 布局；registry 固定到 npm 官方源，保证本机与容器装到同一批包）。
> 质量门四道：`yarn lint`（ESLint + next/core-web-vitals，零告警）、`yarn format:check`（Prettier）、`yarn typecheck`（tsc）、`yarn build`。

### 用 Docker 起

```bash
docker build -t weather-app .
docker run -p 3123:3000 weather-app
# 或
docker compose up --build
```

镜像为三阶段构建（deps → builder → runner），运行层只带 Next `standalone` 产物 + 非 root 用户，本机实测 **269MB**，自带 `HEALTHCHECK`。

> Docker Hub 元数据在部分网络下会超时，基础镜像已做成 `ARG`：`docker build --build-arg NODE_IMAGE=<你的镜像站>/library/node:22-alpine .`

---

## 目录结构

按「职责」分层，且命名、分层顺序对齐生产级项目的通行做法（config → services → stores → server → types → lib → components）：

```
tailwind.config.ts          # 设计令牌（色板/圆角/字体/动效），组件只消费语义化 token
Dockerfile                  # 三阶段构建，运行层只带 next standalone 产物
docker-compose.yml          # 一条命令起服务（含 healthcheck）
.dockerignore
.eslintrc.json              # next/core-web-vitals + prettier 兼容层 + 少量自定规则
.prettierrc / .prettierignore
commitlint.config.mjs       # Conventional Commits 规范
.lintstagedrc.json          # 提交前只对暂存文件跑 eslint --fix + prettier
.husky/pre-commit           # lint-staged + typecheck
.husky/commit-msg           # commitlint 校验提交信息
.yarnrc.yml                 # node-modules 布局 + 固定 npm 官方源
public/assets/               # 静态资源：svg/（源图标，大驼峰命名）、images/（位图）
├── sprite.svg              # ← 生成的雪碧图，勿手改
scripts/build-assets.mjs     # 资源管线：合成雪碧图 + 生成类型化清单
src/
├── assets/index.ts          # ← 生成的资源总入口（ICONS / IMAGES / IconName…），勿手改
├── app/                    # 路由层：只做装配
│   ├── layout.tsx
│   ├── page.tsx            # 页面编排：store 状态 → 组件
│   ├── globals.css
│   └── api/
│       ├── geocode/route.ts    # GET /api/geocode?q=&lang=   地点搜索代理
│       ├── location/route.ts   # GET /api/location?lat=&lon= 逆地理编码（定位功能）
│       ├── overview/route.ts   # GET /api/overview?cities=  推荐城市批量当前温度
│       └── weather/route.ts    # GET /api/weather?...        天气查询（入参校验 + 10 分钟缓存）
├── config/                 # 配置与常量，环境差异集中在这里
│   ├── api.ts              # API_ENDPOINTS + UPSTREAM（上游地址/超时/UA/结果条数）
│   ├── cities.ts           # 热门城市推荐位 + 默认城市（按语言）
│   ├── map.ts              # 瓦片源 / 缩放级别 / 外部地图深链
│   ├── i18n.ts             # zh/en 词典 + 错误码映射 + 日期 locale 映射
│   └── env.ts              # 环境常量：/api 前缀、请求超时
├── services/               # 客户端数据访问层（只跟自家 /api 打交道）
│   ├── api-client.ts       # 统一请求客户端：拼 query、超时、非 2xx 归一化
│   ├── api-client-error.ts # 带 status 的客户端错误类型
│   ├── api-envelope.ts     # 响应信封解包 + 业务失败判定
│   └── weather-service.ts  # 业务方法：searchLocations / getSnapshot / reverseGeocode
├── stores/                 # 全局状态
│   ├── use-weather-store.ts    # Zustand：状态机 + 单飞 + 客户端缓存
│   └── use-preference-store.ts # Zustand + persist：主题 / 语言偏好
├── server/                 # 仅在 Route Handler 中运行的代码（不会进客户端 bundle）
│   ├── envelope.ts         # 统一响应信封 ok() / fail()
│   ├── weather-error.ts    # 服务端错误类型 + 未知错误归一化
│   └── weather/
│       ├── geocoding.ts    # Open-Meteo Geocoding 适配器（支持 zh/en）
│       ├── reverse.ts      # 逆地理编码适配器（坐标 → 地名）
│       └── metno.ts        # MET Norway 预报适配器（日聚合 + WMO 映射 + 时区）
├── types/
│   └── weather.ts          # 领域模型（UI / 服务端共用）
├── lib/                    # 无状态纯函数工具
│   ├── format.ts           # 时间/风向/坐标/地名/人口格式化
│   ├── time.ts             # UTC → 地点当地时间（Intl，含夏令时）
│   ├── weather-codes.ts    # WMO code → 中英文案/图标
│   └── cn.ts               # 条件 className 拼接（不引 clsx）
├── hooks/
│   ├── use-location-search.ts  # 输入 → ahooks 防抖 → 请求 → 结果（含竞态取消）
│   ├── use-geolocation.ts      # navigator.geolocation + 逆地理编码 + 超时看门狗
│   └── use-i18n.ts             # 取词器 t(key, vars)
└── components/             # 纯展示组件（不取数据），文件名 kebab-case
    ├── search-bar.tsx
    ├── current-weather-card.tsx
    ├── hourly-strip.tsx
    ├── temperature-trend.tsx   # SVG 手绘温度趋势折线
    ├── popular-cities.tsx      # 头部推荐城市胶囊（一次批量拿温度）
    ├── location-map.tsx        # 位置地图：真实瓦片 + 中心标记 + 未来两小时文案
    ├── forecast-list.tsx
    ├── app-controls.tsx        # 主题 / 语言切换
    ├── brand-mark.tsx          # logo 按钮：点击即定位到我的位置
    └── state-views.tsx         # EmptyState / LoadingState / ErrorState
```

**头部信息架构**：标题左侧、右上角是「语言/主题 + logo 定位」，下面是热门城市胶囊（`config/cities.ts`，按语言各一套），点一下直接出结果，省掉「先想关键词再打字」。胶囊上直接显示该城市**当前温度与昼夜图标**（一次 `GET /api/overview` 批量取，不是 6 次请求）。

**依赖方向是单向的**：`app → components → hooks → stores → services → types`，`server` 只被 `app/api` 引用。任何一层都能被单独替换，不存在循环依赖，也不存在"组件里偷偷 fetch 上游"。

**样式约定**：不用 CSS Modules、不写组件级样式文件，全部 Tailwind 类名；色板 / 圆角 / 动效等 token 定义在 `tailwind.config.ts`，组件只写 `bg-surface`、`text-ink-muted` 这类语义类名，换主题只改一处。

**备注约定（注释怎么写）**：每个模块顶部一段块注释，写「这个模块负责什么」+「为什么这么选」；关键分支的备注解释**原因**（为什么不是另一种写法），而不是复述代码在干什么。踩过的坑会直接标注在原处，例如 `overview` 路由的 `no-store`、SVG 折线的数值标注层、状态机里单飞的取消逻辑。

---

## 关键设计

### 0. 为什么 `app/` 里既有页面又有 API

这是 Next.js App Router 的**约定目录**，`app/` 下的每个文件夹就是一个 URL 段，具体渲染成页面还是接口，由文件名决定：

```
src/app/
├── page.tsx              → 渲染 GET /            （页面）
├── layout.tsx            → 所有页面的外壳
└── api/
    ├── geocode/route.ts  → 处理 GET /api/geocode （接口）
    └── weather/route.ts  → 处理 GET /api/weather （接口）
```

- `route.ts` 是 Route Handler 的保留文件名（和 `page.tsx`、`layout.tsx` 同级约定）；写成 `api/weather/page.tsx` 就变成"一个页面"，而不是接口。
- 所以 `/api/*` 放在 `app/` 下**不是放错**，反而是官方推荐位置：路由、接口共用一套 URL 结构，部署时也不需要额外服务。
- 「页面职责」并没有被稀释：`app/page.tsx` 只做编排（store 状态 → 组件，196 行），业务组件在 `components/`，数据访问在 `server/` + `services/`。
- 如果以后服务端逻辑变重（多服务、独立部署、需要复用给别的客户端），才把它抽成独立 Node 服务或 `server/` 独立进程——那属于超出本题范围的取舍。

> 老项目里的 `pages/api/*` 是 Pages Router 的写法，和 App Router 不混用；本项目从头就是 App Router。

### 1. 状态管理：Zustand 单 store + 可辨识联合

```ts
type WeatherState =
  | { status: 'idle' }
  | { status: 'loading'; location: GeoLocation }
  | { status: 'success'; location: GeoLocation; data: WeatherSnapshot }
  | { status: 'error'; location: GeoLocation; errorStatus: number };
```

- **非法状态无法构造**：不会出现 `isLoading` 与 `data` 同时为真、或 `error` 与 `success` 并存。
- **副作用句柄放在 store 外**：`AbortController` 与缓存 Map 是模块级变量，不进入 React 渲染依赖，避免把"请求句柄"也纳入状态。
- **单飞**：每次新请求先 `abort()` 上一笔，慢请求不会覆盖新结果；主动取消的 `AbortError` 静默丢弃，不误报成网络错误。
- **客户端 10 分钟缓存**：同城市来回切换直接命中内存缓存，「刷新」按钮 `force` 绕过。

> 仅一个页面消费状态，理论上不需要状态库；这里用 Zustand 是为了把「天气状态机 + 请求生命周期」从页面组件里拿出来，页面只剩"状态 → 组件"的映射，也便于未来扩展收藏/多城市对比。

### 2. 统一响应信封（客户端与服务端同一契约）

服务端所有 `/api/*` 都返回：

```json
{ "code": 200, "success": true, "message": "ok", "timestamp": 1795082019645, "data": { ... } }
```

- `server/envelope.ts` 的 `ok()/fail()` 统一构造信封，**并用真实 HTTP 状态码**（400/404/429/502），不把错误伪装成 200——否则前端无法用状态码做重试/降级，日志与监控也失真。
- 客户端 `services/api-envelope.ts` 的 `unwrapApiData` 负责解包：HTTP 非 2xx 或 `success=false` 都转成 `ApiClientError(message, status)`，页面只处理一种错误类型。

### 3. 数据层：适配器模式 + 服务端代理

```
组件 → stores → services/weather-service → api-client → /api/* (Route Handler) → server/weather/* → 上游
```

1. **UI 与上游解耦**：`types/weather.ts` 定义领域模型，`server/weather/*` 把上游字段翻译成领域模型；换数据源只改一个适配器。
2. **密钥/合规留在服务端**：将来换 OpenWeatherMap、和风天气，Key 放环境变量即可；MET Norway 要求带可识别的 `User-Agent`（浏览器不允许自定义该头，必须服务端发）。
3. **缓存与降级有落点**：超时、状态码、聚合、缓存全在一处处理。

### 4. 错误处理：分类而非笼统


| 场景                 | 处理方式                     | 用户看到                            |
| -------------------- | ---------------------------- | ----------------------------------- |
| 客户端网络断开/超时  | `api-client` 捕获 fetch 异常 | 「网络连接失败，请检查网络后重试」  |
| 上游连接失败         | `AbortSignal.timeout` 8s     | 「天气服务连接失败，请稍后重试」    |
| 上游 429             | 显式分支                     | 「请求太频繁了，请稍后再试」        |
| 上游 5xx / 非 2xx    | 状态码判定                   | 「天气服务暂时不可用，请稍后重试」  |
| JSON 解析失败        | try/catch                    | 「天气数据解析失败，请重试」        |
| 无数据（远洋坐标等） | 序列为空                     | 「该地点暂无可用天气数据」          |
| 搜索无结果           | 正常业务分支，不抛错         | 「没有找到「xxx」，换个关键词试试」 |
| 用户主动取消         | `AbortError` 静默丢弃        | 无                                  |

### 5. 缓存策略（三层，各司其职）


| 层            | 位置                                   | 作用                                                   |
| ------------- | -------------------------------------- | ------------------------------------------------------ |
| 上游 fetch    | `next: { revalidate: 600 }`            | 同一进程内不反复打公共接口                             |
| Route Handler | 进程内 Map，10 分钟                    | 多用户共享同一坐标的结果（与上游 10 分钟更新频率对齐） |
| 客户端        | `stores/use-weather-store.ts`，10 分钟 | 同城市来回切换不重复请求；刷新可强制绕过               |

**⚠️ 缓存只存「天气数据」，不存「地点身份」**：天气缓存的 key 是 `lat|lon|tz`，而 `name / admin1 / country` 是同坐标可能不同写法（「深圳」vs「深圳市」）的展示信息。因此缓存命中时用本次请求参数重建 `location` 再返回，否则会出现"地名显示成上一次请求的空值"。这个坑在开发中实际踩到过，代码里留了注释。

另外 `/api/weather` 响应头是 `no-store`：**浏览器 HTTP 缓存会绕过服务端缓存、导致身份信息读到旧响应**，而服务端缓存已经承担了降流量职责，浏览器缓存没有必要。

---

### 6. 元件設計：展示與数据彻底分开

- **constraint 1：展示组件不碰数据。** `components/*` 里没有 `fetch`、没有 store 读取（除 `app-controls` 只读偏好开关），所有数据由 `page.tsx` 一次性注入 props；想换数据源、加缓存都不需要动组件。
- **constraint 2：一个组件只解一件事。** 天气卡、24 小时条、7 天列表、温度折线、地图、搜索框、头部胶囊彼此不嵌套，想调整顺序只是 page 里换行。
- **constraint 3：容器逻辑集中在 page + hooks。** 首屏引导、定位、语言重建地名、错误提示都在 `page.tsx`；输入防抖/竞态在 `hooks/use-location-search`，定位看门狗在 `hooks/use-geolocation`。
- **constraint 4：props 都是窄类型。** 传的是 `WeatherSnapshot` / `HourlyPoint[]` / `DailyForecast[]`，不是"整个 store"；组件因此可单独在 Storybook 或测试里喂假数据渲染。
- 命名统一 kebab-case（`current-weather-card.tsx`），与 React 生态默认的 PascalCase 文件不同，是为了对齐自家 Velora-web 的仓库约定；组件导出的仍是 PascalCase 组件名。

### 7. 可維護性：把"将来会变的东西"集中到一处


| 会变的东西            | 收斂在哪                                         | 换掉要改几个文件                      |
| --------------------- | ------------------------------------------------ | ------------------------------------- |
| 天气数据源            | `server/weather/metno.ts`                        | 1 个适配器（领域模型不变）            |
| 地理编码 / 逆地理编码 | `server/weather/geocoding.ts` / `reverse.ts`     | 各 1 个                               |
| 地图瓦片源            | `config/map.ts`                                  | 1 个                                  |
| 推荐城市、默认城市    | `config/cities.ts`                               | 1 个                                  |
| 文案 / 语言           | `config/i18n.ts` + `hooks/use-i18n`              | 1 个词典（`en` 漏 key 直接 tsc 报错） |
| 配色 / 圆角 / 动效    | `tailwind.config.ts` + `globals.css` 的 CSS 变量 | 1 处                                  |
| 接口地址 / 超时       | `config/api.ts` / `config/env.ts`                | 1 处                                  |

配套约束：全量 TypeScript、零 `: any`、`tsc --noEmit` 与 `next build` 每次改动都跑；除框架（next/react）外，第三方运行时依赖只有 `zustand` + `ahooks`（无 UI 库、无图表库、无 axios、无地图库）。

## 四项增强：定位 / 温度趋势 / 换肤 / 中英切换

### 1. 当前定位（Use my location）

入口有两个，都走同一套逻辑：**头部右上角的 logo（点一下即定位）** + 搜索框内的十字准星按钮。

链路：`navigator.geolocation` → `/api/location?lat&lon&tz&lang` → 地名 → 复用同一套天气查询。

- **只在用户点击时请求权限**，不自动弹窗；拒绝、不支持、超时都给出可翻译的明确文案，并保留手动搜索作为兜底。
- **精度选择**：`enableHighAccuracy: false`。天气只需要城市级精度，高精度会明显拖慢首响、增加耗电。
- **时区**：定位场景下浏览器 IANA 时区即为用户真实所在时区，随请求一起传给服务端，比让上游猜更准。
- **看门狗 12s**：某些环境（无头浏览器、系统拦截）既不触发 success 也不触发 error，没有它按钮会永远卡在"定位中"。
- 逆地理编码源：Nominatim / Open-Meteo（无接口）/ api-bigdatacloud.net 在主域名实测均不可达，最终选 `us1.api-bdc.net`，支持 zh/en。

### 2. 温度趋势（折线）

- **纯 SVG 手绘**，不引 recharts / echarts：只需要一条 24 点曲线 + 渐变面积，图表库会带来几十 KB 体积与额外的主题/响应式适配成本。
- 坐标映射是纯函数（min/max 自适应、视野固定 24 点），数据长度变化不需要改布局；每个数据点挂原生 `<title>`，悬停即可看到「时间 · 温度 · 天气」。
- 颜色走 `--chart-from` / `--chart-to` 令牌，深浅色自动切换。
- **数值标注**：每 3 小时一个刻度 + 最高/最低必定标注（极值用强调色描边）。SVG 用了 `preserveAspectRatio="none"`（曲线随宽度拉伸），所以数字不能放进 SVG——会被横向拉变形；改为 HTML 叠层按百分比定位，并对两端做水平内缩、贴顶时翻到点下方，相邻过近且数值重复时自动让位，保证不叠字。

### 3. 换肤（深色 / 浅色）

- 所有颜色改为 **CSS 变量**（`:root` 深色、`[data-theme='light']` 浅色），组件只写 `bg-surface`、`text-ink-muted` 这类语义类名 → **换肤零组件改动**，新增主题只需加一段变量覆盖。
- 偏好存 `localStorage`（Zustand `persist`），并在 `layout` 里内联一段脚本在 React 挂载前把 `data-theme` 写回 `<html>`，避免首屏闪白/闪黑。
- 踩坑：曾给 `body` 加 `transition: background-color/color`，结果浏览器标签页被节流时过渡停在起始帧——整页文字仍是深色主题的白色。移除该过渡后颜色切换变确定性一致。

### 4. 中英切换

- 自建轻量词典（`config/i18n.ts`），不引 next-intl / i18next：只有两种语言、一个页面，引框架会额外带来 locale 路由、中间件、服务端传递一整层复杂度。
- **类型约束兜底**：`en` 必须与 `zh` 同构，漏翻一个 key 直接 `tsc` 报错。
- 语言不只影响按钮文案，还连带：搜索接口的 `language=zh|en`（返回对应语言地名）、日期/星期格式、风向方位（东北 → NE）、人口简写（万人 → M/K）、天气状况文案（阴 → Overcast）、错误提示。
- **错误文案本地化**：store 只存 HTTP 状态码，`resolveErrorKey(status)` 在渲染时翻译，所以切语言后连错误提示都会立刻跟着变。
- 切换语言后，已展示城市的名字会通过逆地理编码按新语言重建（同 id 命中客户端缓存，不会二次拉上游）；失败则保留原名不打断主流程。

---

## 默认城市 / 推荐城市 / 位置地图

这三块是「打开就能用」的部分，目标是让首屏永远不是空状态。

### 1. 默认城市 + 记忆上次城市

- **首次进入**：无任何历史时，直接拉 `DEFAULT_CITY`（中文=深圳、英文=Shenzhen），用户不用先想关键词。
- **二次进入**：`lastLocation`（含 id/经纬度/时区/地名）随偏好一起持久化到 `localStorage`，命中后**直接复用坐标**，不再走地理编码。
- **只引导一次**：用 `bootstrapped` ref 锁定，避免语言/主题等无关重渲染把用户手动清空的状态反复覆盖。
- 默认城市失败（网络不通、上游 5xx）时不阻塞页面，保留空状态 + 搜索/定位入口。

### 2. 推荐城市胶囊（带实时温度）

- 一次 `GET /api/overview?cities=北京,上海,...&lang=zh` 取全部城市，**不是 6 个并发请求**；服务端 `Promise.allSettled` 保证单城失败不影响其它城。
- 服务端做 10 分钟进程内缓存，同一语言同一城市只解析一次地理编码 + 打一次上游；冷启动 6 城约 2.5s，命中后约 1.3s。
- **响应带 `query` 字段**（= 请求时用的城市名）：上游对 `New York` 会返回繁体译名「紐約市」，用 `location.name` 做 key 会导致胶囊永远没有温度——这是踩过的真实坑。
- 该接口必须 `Cache-Control: no-store`：天气数据可变，且响应结构和「请求参数」绑定，浏览器缓存会把旧结构当新数据用。
- 温度未回来时只显示城市名（不闪骨架、不显示假值）；点击时若已有坐标直接选中，没有坐标才回退成一次搜索。

### 3. 位置地图

- **真实栅格瓦片**：OSM（`tile.openstreetmap.org`）、Carto（`basemaps.cartocdn.com`）在本机实测 HTTP 000 不可达；高德 `webrd` 瓦片可达（200，image/png），选它做底图。
- **不引 Leaflet / Mapbox**：需求只是「把城市钉在地图上」，Leaflet 会带来 ~140KB 依赖与整套手势状态机；这里 3×3 瓦片 + 手算 Web Mercator（zoom 11）即可，完全可控。
- **深色主题**：高德没有官方暗色瓦片，用 CSS 滤镜 `invert + hue-rotate + brightness` 反相压暗，浅色主题还原原图。
- 中心点脉冲 + 坐标胶囊 + `底图 高德地图` 署名（上游要求）+「未来两小时」降水结论（由逐小时数据求和得出，不是写死文案）+「打开地图 →」深链（`uri.amap.com`，坐标顺序 lon,lat）。

---

## 範圍控制：做了什麼、刻意沒做什麼

作业明确写了「4–6 小時」且「沒有唯一正確答案」，所以范围是主动收敛的，不是能力上限：


| 做了                                                      | 理由                                                   |
| --------------------------------------------------------- | ------------------------------------------------------ |
| 搜尋 / 當前天氣 / 24h + 7d 預報 / Loading / Error / Empty | 作业的四项硬性需求                                     |
| 定位、推薦城市膠囊、位置地圖、溫度趨勢、換膚、中英切換    | 贴近真实产品首屏（且都复用同一套数据链路，边际成本低） |


| 刻意沒做                                   | 理由                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 独立后端服务                               | 只有 4 个只读代理接口，Next Route Handler 足够；起一个 service 只会增加部署与评审成本                         |
| WebSocket / 实时推送                       | 上游是 10 分钟粒度，推送没有信息增量                                                                          |
| 用户账号 / 收藏 / 多城市对比               | 需求没提，会引入持久化与鉴权，把重心从"架构与取捨"移开                                                        |
| 图庫（recharts）、地圖库（Leaflet）、UI 库 | 各引入几十~上百 KB，收益为负；手写 SVG / 瓦片更可控                                                           |
| 单元测试                                   | 4–6 小时预算下，优先把类型边界（`tsc`）、错误分类、契约一致性做扎实；README 里如实写入「0 测试」这一已知缺口 |

---

## 取舍（Trade-offs）

### 数据源


| 候选                                          | 结论                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Open-Meteo 预报**                           | 字段最全（WMO、日出日落、降水概率、体感温度），但`api.open-meteo.com` 实测不可达（TCP 超时），会让作业在地面试跑时白屏 → 弃用                               |
| **MET Norway `locationforecast/2.0/compact`** | 免费、无需 Key、全球覆盖、逐小时，实测可访问 →**选为预报源**。代价：自建日聚合、符号映射、时区换算；无体感温度/日出日落/降水概率，UI 做"有则显示、无则隐藏" |
| OpenWeatherMap / 和风天气                     | 中文体验更好，但需注册 Key，给评审增加配置成本 → 保留为可替换实现                                                                                           |
| 自建后端 + 数据库                             | 天气是只读公开数据，无用户态、无持久化 → 过度设计，不做                                                                                                     |

地点搜索仍用 **Open-Meteo Geocoding**（子域可达，支持中文地名），结果按人口降序重排，让同名小村镇排在大城市之后。

### 要不要后端？→ 不需要独立后端

Next.js Route Handler 是**同构框架自带的 B 端能力**，不算"另起一个后端服务"：它只做参数校验、上游适配、缓存与错误归一化，不持有业务状态。真正需要独立后端的信号是「用户态、写操作、权限、跨端复用、独立扩缩容」——本作业一个都不满足，所以正确解是薄代理，而不是 Koa/Express 服务 + 部署成本。

### 要不要 WebSocket？→ 不需要

- 上游是 REST，10 分钟粒度更新，推送没有信息增量；
- "实时感"用「点击刷新 + 10 分钟缓存」即可满足，成本几乎为零；
- WebSocket 会引入连接生命周期、重连退避、心跳、多实例广播，属于典型 over-engineering。

若将来要做暴雨预警推送，正确路径是服务端订阅预警源 → Push/WS 下发 + REST 兜底，写进 future work 而不是现在实现。

### 其他


| 决策     | 选择与理由                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| 样式     | Tailwind CSS + token 化配置；不用 CSS Modules、不引 UI 库                                                    |
| 请求库   | 自写`api-client`（类式 `sendRequest`），不引 axios：只需拼 query、超时、错误归一化，axios 的拦截器体系用不上 |
| 状态库   | Zustand，理由见上（把状态机与请求生命周期移出组件）                                                          |
| 搜索防抖 | ahooks`useDebounceFn`（自带 `cancel`）；请求取消仍用 `AbortController`，两者职责分开                         |
| 时间     | 不引 dayjs：`Intl.DateTimeFormat` 按地点时区换算，天然处理夏令时                                             |
| 命名     | 组件/文件 kebab-case，导出用 PascalCase；与服务端交互的函数收敛在`services/*`                                |
| 定位     | 不做自动定位：会触发权限弹窗 + 需要逆地理编码，收益低；改为空状态 + 5 个快捷城市                             |
| 动效     | 入场动画只动`transform`、不动 `opacity`：动画被打断（后台标签页/低端设备）时内容依然可见，不会出现空白卡片   |

---

## 可访问性与细节

- 搜索框完整键盘操作（↑↓ 高亮、Enter 选中、Esc 关闭、点击外部收起），下拉 `role="listbox"/role="option"` + `aria-selected`；
- 加载态 `role="status" aria-live="polite"`，错误态 `role="alert"`；
- 移动端：指标网格 2 列、7 天列表隐藏次要列、24 小时横向滚动；
- 尊重 `prefers-reduced-motion`；
- 全部图标走本地 SVG 雪碧图（含天气现象图标），零第三方请求；图标颜色跟随 `currentColor`，深浅色主题共用一套。

---

## 静态资源：`public/assets` + 生成式清单

资源统一收在 `public/assets`，图标名用**大驼峰**（PascalCase）：

```
public/assets/
├── svg/                    # 源 SVG，文件名即导出名：IconMoon.svg → IconMoon
│   ├── IconMoon.svg
│   ├── IconSun.svg
│   ├── IconLocate.svg
│   └── IconArrowUpRight.svg
├── images/                 # 位图：png / jpg / webp / avif / gif
└── sprite.svg              # ← 由脚本生成（勿手改）

src/assets/                 # ← 全部由脚本生成（勿手改）
├── index.ts                # 统一出口：export * from manifest / icons
├── manifest.ts             # ICONS / IMAGES / IconName / iconHref
└── icons.tsx               # 每个图标一个 React 组件
scripts/build-assets.mjs    # 管线脚本
```

`yarn assets`（`dev` / `build` 前会自动跑）做三件事：

1. **合成雪碧图**：把所有 `svg/*.svg` 的图形内容塞进 `sprite.svg` 的 `<symbol>` 里，id = 大驼峰文件名。这样 N 个图标只发 1 个请求，且靠浏览器缓存复用。
2. **生成组件与清单**：每个图标在 `src/assets/icons.tsx` 里生成一个组件，`src/assets/manifest.ts` 提供 `ICONS`、`IconName`、`IMAGES`、`iconHref()`，`index.ts` 统一出口。
3. **保护性校验**：`Icon-Moon.svg` 与 `icon-moon.svg` 归一后撞名会直接报错退出，不静默覆盖；SVG 缺 `viewBox` 也报错。

用法：直接引入生成好的组件，不再包一层手写壳子。

```tsx
// 1. 固定图标：一个图标一个组件
import { IconMoon, IconLocate, WeatherRain } from '@/assets';
<IconMoon size={17} className="text-ink" />
<WeatherRain size={21} />

// 2. 动态图标（数据里带图标名时，如 WMO 天气码）
import { Icon } from '@/assets';
<Icon name={condition.icon} size={48} />

// 3. 位图：路径与原始尺寸都来自清单
import { IMAGES } from '@/assets';
<Image src={IMAGES.HeroBanner.src} width={IMAGES.HeroBanner.width} ... />
```

天气现象也在这套体系里：`lib/weather-codes.ts` 把 WMO code 映射成 `IconName`（`WeatherClearDay` / `WeatherRain` / `WeatherSnow` / `WeatherThunder`…），昼夜用两个不同图标而不是同一个图标换色。

几个刻意的决定：

- **不逐个 `import` SVG 文件**：逐个 import 会被打包进 JS（图标多时体积线性增长），雪碧图则是静态资源、可缓存；且 `<symbol>` 支持 `currentColor`，换主题不用另出一套图标。
- **清单生成而不是手写**：手写 `'/assets/svg/IconMoon.svg'` 这类字符串，改文件名不会报错，只能等线上 404。生成清单后 `IconName` 是字面量联合类型，`name="IconMooon"` 编译期就挂。
- **位图带原始像素尺寸**：PNG 读 IHDR、JPEG 读 SOF 段，写进清单；渲染时可先占好宽高比，避免图片加载前布局抖动。
- **SVG 的呈现属性会被继承**：脚本把外层 `<svg stroke="currentColor" fill="none">` 上的 `stroke/fill/stroke-width…` 搬到 `<symbol>` 上——否则 symbol 里只剩裸路径，图标会渲染成黑色实心块（这是实际踩过的坑）。
- **颜色必须显式给**：图标靠 `currentColor` 继承，按钮本身没有 `color` 时会继承到近白色，浅色主题下等于隐形。所以 `AppControls` 里显式写了 `text-ink`。
- **不手写 `SvgIcon` 壳子**：组件由脚本按图标清单生成，新增图标 = 丢一个 SVG + `yarn assets`，不需要再动任何组件代码，也不会出现「图标漏登记」。
- **`IconProps` 必须 `Omit<..., 'name'>`**：`SVGProps` 自带 `name?: string`（SVG 的 name 属性），不排除的话和 `IconName` 求交集会退化成 `string`，类型保护就失效了——这是生成组件时实际踩到的坑。

---

## 工程化：代码规范与提交约束

四道质量门，全部零配置即可跑：

| 命令               | 作用                                      | 覆盖范围                         |
| ------------------ | ----------------------------------------- | -------------------------------- |
| `yarn lint`        | ESLint：`next/core-web-vitals` + 少量自定 | `src/**`                         |
| `yarn format:check`| Prettier 校验（含 Tailwind class 排序）   | 全仓（`.md`/`docs` 不参与）      |
| `yarn typecheck`   | `tsc --noEmit`                            | 全仓                             |
| `yarn build`       | 生产构建（前置自动跑 `yarn assets`）      | 全仓                             |
| `yarn assets`      | 生成雪碧图 + 资源清单                     | `public/assets/`、`src/assets/`  |

- **ESLint 规则取舍**：只加能真正影响可维护性的几条（`prefer-const`、`no-var`、`eqeqeq`、`react/self-closing-comp`），`react-hooks/exhaustive-deps` 降为 `warn`——它不是错误，但值得在评审时被看见。`next/no-img-element` 关掉，因为本项目根本不用 `<img>` 渲染照片。
- **Prettier 与 Tailwind**：`prettier-plugin-tailwindcss` 按 Tailwind 官方顺序重排 class，避免同一组属性在文件间写法不一致；`.prettierignore` 排除 `docs/` 与 `*.md`，避免把中文表格重排得难读。

### Git 钩子（Husky 9 + lint-staged + commitlint）

```
git commit
  └─ pre-commit  → lint-staged：只对本次 git add 的文件跑 eslint --fix + prettier
                 → typecheck：全量类型检查（类型错误跨文件，无法只看单个文件）
  └─ commit-msg  → commitlint：校验 Conventional Commits（type(scope): subject）
```

- **为什么用 lint-staged 而不是每次全量 lint**：提交要快。只处理暂存文件可以把 pre-commit 控制在 1~3 秒；类型检查则仍然全量，因为它无法只做增量。
- **提交信息规范**：`feat / fix / refactor / style / perf / test / docs / build / ci / chore / revert`，subject 不超过 72 字符。评审用 `git log --oneline` 就能读出功能演进顺序。
- 钩子由 `yarn prepare`（即 `husky`）在 `yarn install` 后自动安装，`/.husky/_` 已进 `.gitignore`（husky 自动生成的分发目录）。

### Docker

三阶段构建，思路是「让每一层只包含它该有的东西」：

| 阶段 | 内容 | 为什么要独立成层 |
| --- | --- | --- |
| `deps` | 只装 node_modules | 改业务代码时命中缓存，不必重装依赖（本项目装依赖约 4 分钟） |
| `builder` | `yarn build` 产物 | 编译期需要源码 + devDeps，运行期完全不需要 |
| `runner` | `.next/standalone` + `.next/static` | `output: 'standalone'` 已把运行所需的最小 node_modules 打进产物，运行层不再搬整棵依赖树 |

运行层细节：非 root（`nextjs:nodejs`）、`HEALTHCHECK` 用 Node 内置 `fetch` 自检（不额外装 curl）、`NEXT_TELEMETRY_DISABLED=1`、端口 3000 由 compose 映射到 3123。实测镜像 **269MB**，启动到 healthy 约 5 秒。

两个环境适配点（不是花活，是踩出来的）：

1. **基础镜像做成 `ARG`**：Docker Hub 元数据在部分网络会 `DeadlineExceeded`，可用 `--build-arg NODE_IMAGE=<镜像站>/library/node:22-alpine` 切换。
2. **Yarn 4 CLI 用 Node 的 `fetch` 下载，而不是 corepack/apk**：corepack 会在每个 stage 各下载一次 CLI，网络一抖整层失败；精简镜像里 `apk` 的索引域常常也解析不到，装不了 curl。用 Node 自带 fetch 落地成 `/usr/local/bin/yarn`，只下一层。

---

## 后续可以怎么扩展

1. **测试**：`lib/time.ts`、`server/weather/metno.ts` 的聚合是纯函数，最适用 Vitest；store 的状态迁移用 Testing Library + MSW。
2. **多源降级**：适配器已按同形状预留，可加 `openMeteo.ts` 并按可达性 fallback。
3. **收藏 / 多城市对比**：届时加持久化（localStorage）即可，store 结构已支持。
4. **预警推送**：见上文。
5. **定位**：`navigator.geolocation` + 逆地理编码按钮。

---

## 数据来源

- 预报：MET Norway — [api.met.no](https://api.met.no)（`locationforecast/2.0`，CC BY 4.0）
- 地点搜索：Open-Meteo Geocoding — [open-meteo.com](https://open-meteo.com)
- 天气代码：WMO Weather interpretation codes

---

## 已知限制

1. **简繁差异**：Open-Meteo 对部分海外城市只收录繁体（如「東京」），简体「东京」会命中江苏/浙江同名小镇；已按人口重排缓解，彻底解决需别名词典。
2. **今日最高/低温只覆盖剩余时段**：上游序列从当前时刻起算。
3. **缺字段**：compact 端点不提供体感温度/日出日落/降水概率，UI 已条件渲染。
4. **缓存是进程内**：多实例部署应换 Redis 或依赖 CDN。
5. **定位依赖浏览器授权**：HTTP（非 localhost）环境下浏览器会禁用定位；被拒后只能手动搜索。
6. **逆地理编码源单一**：`us1.api-bdc.net` 是当前网络下唯一可达的免费反向接口，若更换需要改 `server/weather/reverse.ts` 一个文件。
7. **i18n 不含复数/性别规则**：文案用 `{var}` 占位拼接，够用于当前页面；若要做复杂语法（俄语变格、阿拉伯语 RTL）应换成 ICU MessageFormat。
8. **地图是静态的**：只做「定位可视化」，不支持拖拽/缩放/雷达成图；需要交互式地图时应换成带手势地图库（同时要接受 ~140KB 体积）。
9. **底图依赖第三方可达性**：高德瓦片非官方公开 API，若被限流/变更需替换 `config/map.ts` 一个文件；OSM/Carto 在当前网络不可达。
10. **推荐城市冷启动有 1~3s 温度空缺**：胶囊先显示城市名，温度异步补上（服务端已缓存 10 分钟，后续命中很快）。
11. **底图只覆盖中国境内**：高德瓦片在境外返回纯白图（已实测 New York 坐标 stddev=0）。因此 `config/map.ts` 用 `BASEMAP_BOUNDS` 做覆盖判定，境外城市不再请求瓦片，改为网格占位 + 「该地区暂无底图预览，可点『打开地图』」文案——宁可明确告知，也不显示一张白图。天气数据本身不受影响。

---

## 工程备注（给评审的说明）

### 数据真实性


| 结论                                  | 依据                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 没有 mock / fixture / hardcode 假数据 | `grep -rnE "mock|fixture|faker|stub" src` 零命中；所有温度、湿度、风、降水都来自 MET Norway 实时响应 |
| 允许的"非上游原值"只有两类            | ① 图标与中英文文案是本地 WMO 映射；② 时间是 UTC → 地点时区的换算结果                              |
| 缺字段不补假值                        | 体感温度 / 日出日落 / 降水概率上游没有，UI 直接不渲染，而不是填 0 或占位符                           |
| 缓存带来的滞后是可见的                | 服务端最多缓存 10 分钟，页脚「更新时间」始终显示上游`updated_at`，用户能自己判断新鲜度               |
| 今日高低温只覆盖剩余时段              | 上游序列从当前时刻起算，卡片写「今日 17° ~ 18°」而非"全天极值"，避免过度承诺                       |

### 踩坑备注（保持现状，不要"优化"回去）

1. `/api/weather` 的缓存**只存天气数据**，`location` 每次按请求重建——否则同坐标第二次请求会复用旧地名。
2. `/api/weather`、`/api/overview` 响应头必须是 `no-store`——浏览器 HTTP 缓存会直接绕过服务端缓存，改完代码页面仍显示旧数据。
3. 入场动画只动 `transform`，不动 `opacity`——标签页被节流时过渡停在起始帧，整块卡片会变透明。
4. 移除 `body` 上的主题 `transition`——同样因为节流停在起始帧，浅色主题下白字压浅底。
5. `/api/overview` 必须回传 `query`——上游把 `New York` 译成「紐約市」，按 `location.name` 建索引会导致胶囊永远缺温度。
6. 温度折线的数值不能写进 SVG——卡片用了 `preserveAspectRatio="none"`，文字会被横向拉变形，改用 HTML 叠层按百分比定位。
7. 地图瓦片深色是 CSS 滤镜反相，不是另一套底图源——高德没有官方暗色瓦片；境外城市必须走覆盖判定分支，不要"顺手"换成 Esri：其海外 z11 返回「Map data not yet available」灰图。
8. ESLint 只有在 `nodeLinker: node-modules` 下才可用：同一套 `eslint-config-next` 在 Yarn PnP 下会因虚拟包路径 + `import-fresh` 在加载配置阶段崩掉（表现为 `Cannot read properties of undefined`）。所以「ESLint 能不能跑」是本仓库依赖形态的探针，不是独立问题。
9. `.yarnrc.yml` 必须保留 `nodeLinker: node-modules`：Yarn PnP 模式下 Next 14 的 telemetry（`conf` 依赖）在 Node 22 会直接抛 `Cannot convert undefined or null to object`，`next build` 完全无法启动。

### 本次清理记录


| 处理         | 内容                                                                                     | 理由                                                    |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 删除死代码   | `config/env.ts` 的 `getAppEnv()` 与 `AppEnv` 类型、`config/api.ts` 的 `ApiEndpoint` 类型 | 全仓零引用，tsc 与 grep 双向确认                        |
| 删除构建缓存 | 根目录`tsconfig.tsbuildinfo`                                                             | 本地产物，不应进仓库；`.gitignore` 已补 `*.tsbuildinfo` |
| 删除孤儿资源 | `docs/preview-forecast.png`                                                              | README 未引用，且与现有截图同为深色主题，重复           |
| 移除 ESLint（后又装回） | 先删 `.eslintrc.json`、`lint` script、`eslint` 依赖，切回 node-modules 后重新装回并跑通 | 见踩坑备注 8：命令跑不通就不该留在仓库里；修好前置条件再装回来 |
| 固定链接方式 | 新增 `.yarnrc.yml`（`nodeLinker: node-modules`、固定 npm 官方源）                       | 见踩坑备注 9：PnP 下 `next build` 无法启动              |
| 取消跟踪     | `.yarn/install-state.gz`                                                                | 本地安装状态，可重新生成；已进 `.gitignore`             |
| 保留         | `.next/`（85MB）、`node_modules/`                                                        | 已在`.gitignore` 中，属于本地运行产物，非"无用文件"     |

---

## 需求对照（评审自查）


| 作业要求             | 实现位置                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------- |
| 搜索地点             | `components/search-bar.tsx` + `hooks/use-location-search.ts` + `app/api/geocode`          |
| 当前天气             | `components/current-weather-card.tsx`                                                     |
| 天气预报             | `components/hourly-strip.tsx`（24h）、`components/forecast-list.tsx`（7d）                |
| Loading              | `stores/use-weather-store.ts` 的 `loading` 分支 + `components/state-views.tsx`            |
| Error                | `server/weather-error.ts` + `services/api-client-error.ts` + `ErrorState` 重试            |
| 应用架构             | 见「目录结构」，单向依赖 + 服务端/客户端代码物理隔离                                      |
| 组件设计             | 展示组件零数据请求、单一职责、kebab-case                                                  |
| 状态管理             | Zustand 状态机（可辨识联合）                                                              |
| API 整合             | `services/*` → `app/api/*` → `server/weather/*` 三层                                    |
| 代码组织             | config / services / stores / server / types / lib / hooks / components                    |
| 错误处理             | 分类表 + 统一信封 + 真实 HTTP 状态码                                                      |
| 可维护性             | 全量类型、零`: any`、适配器可替换；除 next/react 外仅 ahooks + zustand                    |
| 注释与可读性         | 模块级「职责 + 选型」块注释、关键分支写原因；踩坑点就地标注                               |
| 默认城市（首屏不空） | `config/cities.ts` 的 `DEFAULT_CITY` + `stores/use-preference-store.ts` 的 `lastLocation` |
| 推荐城市（带温度）   | `components/popular-cities.tsx` + `app/api/overview` + `server/weather/overview.ts`       |
| 位置地图             | `components/location-map.tsx` + `config/map.ts`                                           |
| 代码规范             | `.eslintrc.json`（next/core-web-vitals）+ `.prettierrc`（含 Tailwind 排序）                |
| 提交约束             | `.husky/pre-commit`（lint-staged + typecheck）+ `.husky/commit-msg`（commitlint）          |
| 容器化部署           | `Dockerfile`（三阶段、standalone、非 root、healthcheck）+ `docker-compose.yml`              |
