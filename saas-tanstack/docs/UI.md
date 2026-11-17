# UI 设计规范 —— "Studio for Tools" · v1

> 实现在 `app/styles/globals.css`（token 与工具类）与 `app/components/**`。
> 这份文档是**可执行的那一半**：token、版式、组件、每种页型的骨架、无障碍与验收清单。
>
> 换肤只改 `globals.css`。组件里禁止硬编码 Tailwind 调色板色，
> `eslint.config.js` 的 `no-restricted-syntax` 会直接报错。

---

## 1. 四条不破的规矩

1. **标题不用粗体。** 400–600 配负字距，比 700/800 更精确、更贵气。
   模板原来满屏 `font-bold` 是它显廉价的头号原因。
2. **发丝边框代替阴影。** 1px 边框 + `gap: 1px` 的网格缝隙定义层次，不用 `box-shadow`。
3. **技术性数值走等宽字体**（`tabular` 工具类）：积分、价格、日期、用量、时长、ID。
   工具站上这些是**数据**不是文案。
4. **一套系统，每页一个强调色。** `data-accent` 覆盖 `--color-brand`，其余 token 全共用。

**推论**：一屏只有一个主按钮；卡片悬停只动边框与底色，**不做位移**（位移会让整页抖）。

---

## 2. Token

### 2.1 表面

| Token | 浅色 | 深色 | 用途 |
|---|---|---|---|
| `background` | `#FAFAF9` | `#0B0B0C` | 页面底。暖白不是纯白；深色是近黑，纯黑会让边框无处安放 |
| `card` | `#FFFFFF` | `#141415` | 卡片、表格体 |
| `subtle` | `#F4F4F2` | `#111112` | 分区交替底、表头、代码块 |
| `border` | `#E4E2DF` | `#26262A` | 唯一的层次工具 |
| `foreground` | `#0C0A09` | `#F5F5F4` | 正文 |
| `muted-foreground` | `#57534E` | `#A1A1AA` | 次级正文 |

语义色 `success` / `warning` / `destructive` / `info` 各自带 `-foreground`。
浅色统一取 700 档（白字压上去 ≥4.5:1），深色取 400 档。

### 2.2 强调色

`--color-brand` / `--color-brand-foreground` / `--color-brand-subtle` 三件套。
`--color-primary` 指向 `--color-brand`，所以既有的 `bg-primary` 组件零改动跟随换色。

七个可选身份：`orange`（默认）· `teal` · `green` · `blue` · `amber` · `violet` · `pink`。
用法 `<section data-accent="teal">`，那一整棵子树换色。

**导航与页脚不跟随页面变色** —— 全站不变的锚点跟着内容变色，会让人以为跳站了。

> ⚠️ CSS 坑：每个 `[data-accent]` 块必须**重复写一遍** `--color-primary` 与 `--color-ring`。
> `:root` 上的 `--color-primary: var(--color-brand)` 在**声明处**完成替换，
> 拿不到子树里的覆盖，用 `bg-primary` 的组件会永远是默认色。

### 2.3 深色模式

两块必须各写一份完整的：

- `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` —— 跟随系统
- `:root[data-theme="dark"] { … }` —— 手动选择

`__root.tsx` 在首屏绘制**之前**注入一段内联脚本（`THEME_INIT_SCRIPT`）读 localStorage
打在 `<html data-theme>` 上，否则选了深色的用户每次进站都要先闪一下白。

### 2.4 字体与圆角

- 正文与标题：Inter；数值：JetBrains Mono（`tabular` 带 `font-variant-numeric: tabular-nums`）
- 字体走 `__root.tsx` 的 `<link>` + `preconnect`，**不用 CSS `@import`** —— 后者串行阻塞首屏
- 圆角只留两档：`--radius` 0.5rem、`--radius-xl` 0.75rem。**不做胶囊化**，
  `rounded-full` 只给头像和状态芯片

---

## 3. 版式

### 3.1 两个容器

| 工具类 | 作用 | 值 |
|---|---|---|
| `shell` | 整页外框 | 最大 1440，≥1536px 屏放开到 1760；padding 随屏幕 1rem → 4rem |
| `measure` | 正文行长 | `68ch`，**永远不随屏幕变宽** |

宽度不是一个 max-width 就完事：小屏靠 padding 不贴边，中屏靠行长可读，
大屏必须放开否则 27 寸上两侧全是空白。**全站不再出现 `container mx-auto px-4`。**

### 3.2 流体字号

| 工具类 | 用在哪 |
|---|---|
| `display-1` | 首屏 H1 |
| `display-2` | 内页 H1、区块 H2 |
| `display-3` | 三级标题、应用内页 H1、文章 H2 |
| `lede` | 首屏与区块引导语 |
| `eyebrow` | 标题上方的等宽大写分类标签 |

### 3.3 纵向节奏

| 场景 | 值 |
|---|---|
| 营销区块 | `py-20 sm:py-28`（`<Section>` 默认） |
| 内容页（blog / about / legal / contact） | `py-14 sm:py-20`（`<Section tight>`） |
| 应用内与后台 | `py-10`（`AppShell` 统一给） |

相邻区块用 `tone="subtle"` 交替 + `border-y` 换气，比一路白到底有节奏。
区块头 → 内容固定 `mt-12`；标题 → 副标题固定 `mt-4`；卡片内边距固定 `p-6 sm:p-7`。

### 3.4 网格对齐

卡片网格一律 `grid-hairline`：外层 `gap: 1px` + `background: border`，
每个格子 `bg-card`，缝隙就是外层露出来的边框色。
**不要给卡片网格加 `gap-8` + 每张卡自己的边框** —— 那样缝隙宽度和边框粗细会互相打架。

⚠️ 这个做法有一个陷阱：**空格子会露出容器底色，变成一块灰矩形**。
只要卡片数量不是列数的整数倍，最后一行就会露馅。数量由使用者决定的网格
（工具矩阵、文章列表、档位卡、引用墙）必须在末尾放 `<GridFill count={n} />`
（`ui/grid-fill.tsx`）补上 card 色的空格子。

列数一律取 **4**（`sm:grid-cols-2 lg:grid-cols-4`）：4 能被 2 和 1 整除，
所以补到 4 的整数倍之后，1 列 / 2 列 / 4 列三个断点都不会留洞。
补出来的空格子是一块留白，这是刻意的取舍 —— 留白远好过一块灰矩形。

---

## 4. 组件清单

| 组件 | 位置 | 规则 |
|---|---|---|
| 按钮 | `ui/button.tsx` | 4 variant × 3 size。链接形态用 `buttonClass()` 交给 `<Link>`，**不要另写一套** |
| 卡片 | `ui/card.tsx` | `Card` / `StatCard`。`surface` 无阴影，`surface-interactive` 悬停只动边框与底色 |
| 区块 | `ui/section.tsx` | 统一区块头版式、容器与纵向节奏。营销页所有区块都从它出发 |
| 表单 | `ui/field.tsx` | `Field` + `Input` / `Textarea`，label 与控件间距固定 |
| 状态芯片 | `ui/badge.tsx` | `statusTone()` 是全站唯一一份状态 → 语义色映射 |
| 表格 | `ui/table.tsx` | 表格**自己**横向滚动（`overflow-x-auto`），绝不让 body 横滚；用真 `<thead>/<th>` |
| 主题切换 | `ui/theme-toggle.tsx` | 浅 / 深 / 跟随系统三态；SSR 时先渲染同尺寸占位，挂载后再显示状态 |
| 导航 | `layout/navbar.tsx` | 固定顶、`bg-background/85` + 模糊 + 1px 下边框。**不跟随 data-accent** |
| 页脚 | `layout/footer.tsx` | 4 列，每一项必须指向真实存在的路由 |
| 公开页页框 | `routes/{-$locale}/route.tsx` | Navbar + `<main id="main" class="pt-16">` + Footer。**叶子路由不再自己写页框** |
| 登录后外壳 | `layout/app-shell.tsx` | 前台与后台**同一个**外壳，只换导航配置。正常 flex 布局，没有 margin 补偿 |
| 认证/结账外壳 | `layout/auth-shell.tsx` | 认证 4 页 + 结账 2 页共用，同一个流程里的相邻两屏不能长得像两个网站 |

图标一律 `lucide-react`，不手写 SVG path。

---

## 5. 每种页型的骨架

页面之间**必须不同**的东西：首屏构成、独有的那一块内容、H2 措辞与顺序。
共用的：导航、页脚、区块骨架、卡片、按钮、表格、FAQ 折叠件。

| 页面 | 骨架 | 这一页独有的是 |
|---|---|---|
| `/` | Hero → 事实条 → How it works → 工具矩阵 → 能力网格 → 引用墙 → 定价 → FAQ → CTA | 左文右**工具运行演示卡** |
| `/features` | H1 → 能力网格 → **不做什么** → CTA | 诚实的边界一栏 |
| `/pricing` | H1 → 档位卡 → **每个工具多少积分的表** → FAQ | 从 registry 读的积分表 |
| `/about` | H1 → **左侧固定事实栏 + 右侧 `measure` 长文** | 全站唯一这种两栏排版 |
| `/contact` | H1 → 邮箱 callout → **四个分流卡（各自带响应时效）** | 说清楚多久有人回 |
| `/blog` | H1 → **头条一篇宽卡** → 缝隙卡片网格 | 有主次，不是平铺 |
| `/blog/:slug` | 标题区 → `measure` 单栏正文 → 相关文章 | 单栏长文 + 出口 |
| 法务页 | H1 + 最后更新 → callout → `measure` 单栏 | 一路单栏到底 |
| 认证 / 结账 | `AuthShell` 居中卡 | 图标 + 一句话 + 一个动作 |
| dashboard / tools / settings | `AppShell` + `StatCard` / `Card` / `Table` | 用量条、运行区、表单 |
| admin | `AdminPageShell`（= `AppShell variant="admin"`）+ `AdminTable` | 统计卡与表格 |

**首屏事实条只写这一页独有的、可核对的数字**（3 个支付渠道 / 2 种语言 / 2 套数据库驱动），
而且尽量从代码里读出来。写「快速、简单、免费」是让所有用这套模板的站
看起来像同一个站的最快方式。

**首页不出厂编造的社会证明**：`siteConfig.testimonials` 默认是空数组，
为空时引用墙整块不渲染。拿到真实引用再往 `site-config.ts` 里填。

---

## 6. 交互与状态

工具页必须处理的状态，一个都不能省：
空闲 · 运行中 · 成功 · 失败（带错误文案）· 额度不足（带去向）。

动效只留 `rise`（8px 位移 + 淡入，0.4s）。
`prefers-reduced-motion: reduce` 时全站动画降到 0.01ms —— 已在 `globals.css` 全局处理。

---

## 7. 无障碍

| 项 | 要求 |
|---|---|
| 触摸目标 | 按钮 / 导航 / 页脚链接 ≥ 44px（`Button` 的 `md`/`lg` 已满足；`sm` 仅用于表格行内） |
| 对比度 | 正文 ≥ 7:1，任何文字 ≥ 4.5:1，**两种主题都要过** |
| 焦点 | `:focus-visible` 2px 强调色描边 + 2px offset，全站统一，不许 `outline: none` |
| 跳过导航 | 每页第一个可聚焦元素是 "Skip to main content"，指向 `#main` |
| 折叠件 | `aria-expanded` + `aria-controls`，标题用真实的 `<h3>` 包 `<button>` |
| 图片 | 装饰性一律 `aria-hidden`，内容性必须有 alt |
| 语言 | `<html lang>` 由 URL 决定，不由请求头决定 |
| 表格 | `<thead>` + `<th scope>`，不用 div 假装表格 |
| 抽屉 | 打开时锁背景滚动、Esc 可关、路由变化自动收起 |

---

## 8. 验收清单（每次改 UI 都过一遍）

```
[ ] 没有新增 box-shadow，层次靠边框
[ ] 没有 font-bold / font-extrabold
[ ] 数值、日期、ID 用了 tabular
[ ] 没有硬编码调色板色（npm run lint 会挡）
[ ] 没有新写 container mx-auto px-4，容器用 shell / measure
[ ] 深色模式下看过一遍（不是只在浅色下开发）
[ ] 375px 宽下没有横向滚动；宽表在自己的容器里滚
[ ] 键盘 Tab 一遍：焦点可见、顺序合理、跳过导航可用
[ ] 用户可见文案全部走 i18n，en.json 与 zh.json 键对齐
[ ] npm run lint && npm run type-check && npm test 全绿
```
