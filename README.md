# MyTV

<div align="center">
  <img src="public/logo.svg" alt="MyTV Logo" width="120">
</div>

> 一个自部署的点播聚合播放器底座。当前版本基于 **Next.js 16 + React 19 + Tailwind CSS 4 + PostgreSQL**，适合做个人使用的影视搜索、在线播放、收藏与播放记录同步站点。

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Docker Ready](https://img.shields.io/badge/Docker-ready-blue?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

## 项目定位

- 空壳项目：默认不内置任何资源站，部署后需要你自行在后台配置。
- 仅建议个人自部署使用，不建议做公开服务。

## 当前技术栈

- `Next.js 16`
- `React 19`
- `Tailwind CSS 4`
- `TypeScript 5`
- `PostgreSQL`
- `ArtPlayer + Hls.js`
- `Vercel` / `Docker`

## 核心能力

- 多资源站聚合搜索，兼容苹果 CMS V10 风格接口。
- PostgreSQL 持久化收藏、播放记录和后台配置。
- ArtPlayer + HLS.js 在线播放，保留播放速度与基础 m3u8 去广告过滤。
- 支持 Docker 本地开发，也支持 Vercel + 外部 PostgreSQL 部署。
- Git tag 驱动版本与生产发布。

## 环境要求

- `Node.js 24`
- `pnpm 10`
- `PostgreSQL 16+`

## 快速开始

### 本地开发

```bash
pnpm install
pnpm dev
```

默认开发脚本会在启动前自动执行：

- `pnpm sync:version`

### Docker 本地调试

项目内置了开发用 `deploy/docker-compose.dev.yml` 和辅助脚本：

```bash
./scripts/dev-docker.sh up
```

常用命令：

```bash
./scripts/dev-docker.sh up
./scripts/dev-docker.sh logs
./scripts/dev-docker.sh down
./scripts/dev-docker.sh rebuild
```

默认开发容器地址：

- 应用：`http://localhost:3000`
- PostgreSQL：`localhost:5432`
- 默认账号：`admin / admin123`

## 环境变量

### 必填

| 变量 | 说明 |
| --- | --- |
| `USERNAME` | 站长用户名 |
| `PASSWORD` | 站长密码 |
| `DATABASE_URL` | PostgreSQL 连接串 |

项目启动时会自动执行 PostgreSQL schema 初始化和内置 migration。

### 推荐

| 变量 | 说明 |
| --- | --- |
| `DATABASE_SSL` | 是否启用 SSL，云数据库通常填 `true` |
| `DATABASE_POOL_MAX` | 连接池大小，Vercel 建议从 `1-4` 开始 |
| `DATABASE_IDLE_TIMEOUT_MS` | 空闲连接超时 |
| `DATABASE_CONNECT_TIMEOUT_MS` | 建连超时 |
| `NEXT_PUBLIC_SITE_NAME` | 站点名，默认 `MyTV` |
| `SITE_BASE` | 完整站点地址，建议在生产环境填写 |

示例：

```env
USERNAME=admin
PASSWORD=your_secure_password
DATABASE_URL=postgresql://mytv:mytv_password@postgres:5432/mytv?sslmode=require
DATABASE_SSL=false
NEXT_PUBLIC_SITE_NAME=MyTV
```


## 部署方式

### Docker

适合 VPS / NAS / 本地长期运行。

```bash
docker compose -f deploy/docker-compose.dev.yml up -d --build
```

运行时镜像会通过 [start-standalone.js](deploy/start-standalone.js) 启动 Next standalone 服务，并定时请求 `/api/cron`。

### Vercel

适合快速上线，但需要自备外部 PostgreSQL。

基本流程：

1. Fork 当前仓库。
2. 导入 Vercel 项目。
3. 配置 `USERNAME`、`PASSWORD`、`DATABASE_URL`，云数据库通常再加 `DATABASE_SSL=true`。
4. 如果需要自定义域名，建议同步设置 `SITE_BASE`。

当前仓库已关闭 Vercel 的 Git 自动部署，改为由 GitHub Actions 在 tag 时触发生产部署。

## 发布流程

### CI

- 工作流文件：`.github/workflows/ci.yml`
- 触发时机：普通 `push`
- 行为：启动临时 PostgreSQL 后执行
  - `pnpm typecheck`
  - `pnpm build`

### Vercel 生产发布

- 工作流文件：`.github/workflows/vercel.yml`
- 触发时机：`push` 一个形如 `v*` 的 tag
- 行为：由 Vercel 自己拉取生产环境并执行部署

发布示例：

```bash
git tag -a v100.1.3 -m "Release v100.1.3"
git push origin v100.1.3
```

GitHub 仓库需要配置这 3 个 Secrets：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发，自动同步版本 |
| `pnpm build` | 生产构建，自动同步版本 |
| `pnpm typecheck` | TypeScript 检查 |
| `pnpm lint` | ESLint 检查 |
| `pnpm format` | Prettier 格式化 |
| `pnpm sync:version` | 根据 tag / 环境变量同步 `src/lib/version.ts` |

## 资源站配置

部署后登录 `/admin`，在“配置文件”中填写资源站 JSON。当前最小可用示例：

```json
{
  "cache_time": 7200,
  "api_site": {
    "demo_site": {
      "api": "http://example.com/api.php/provide/vod",
      "name": "示例资源站"
    }
  }
}
```

## 致谢

- 播放器与流媒体支持：
  [ArtPlayer](https://github.com/zhw2590582/ArtPlayer)
  [HLS.js](https://github.com/video-dev/hls.js)
- 豆瓣代理与 CDN 支持：
  [CMLiussss](https://github.com/cmliu)
- 灵感来源：
  [LunaTV](https://github.com/MoonTechLab/LunaTV)

## License

[MIT](LICENSE)
