# toolsmuban — 工具站模板

用来快速搭工具站的模板仓库。复制一份，替换文案与工具实现，就是一个带登录、
积分计费、支付和后台的完整站点。

模板本体在 [`saas-tanstack/`](./saas-tanstack)，**完整文档见
[saas-tanstack/README.md](./saas-tanstack/README.md)**。

```bash
cd saas-tanstack
nvm use
npm install
cp .env.example .env.local
npm run db:push
npm run dev
```

## 仓库结构

```
saas-tanstack/          模板本体（TanStack Start + Cloudflare Workers）
.github/workflows/      CI：类型检查 / lint / 测试通过后自动部署
```

推送到 `main` 且改动了 `saas-tanstack/**` 时，CI 会跑完校验再部署到
Cloudflare Workers。
