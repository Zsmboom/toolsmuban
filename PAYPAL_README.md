# PayPal Integration - Quick Start

✅ PayPal 支付集成已完成！这是一个完整的 PayPal 支付对接方案。

## 🎯 已完成的功能

### 1. **核心支付功能**
- ✅ PayPal 客户端配置 (Sandbox/Live 环境)
- ✅ 创建订单 API (`/api/paypal/create-order`)
- ✅ 捕获订单 API (`/api/paypal/capture`)
- ✅ Webhook 处理 (`/api/paypal/webhooks`)

### 2. **用户界面**
- ✅ PayPal 支付按钮组件
- ✅ 定价页面集成 (Stripe + PayPal 双支付方式)
- ✅ 登录后自动显示支付选项
- ✅ Tab 切换选择支付方式

### 3. **数据库集成**
- ✅ 支付记录保存
- ✅ 订阅状态管理
- ✅ 自动更新用户订阅信息

### 4. **Webhook 事件处理**
- ✅ 支付完成
- ✅ 支付退款
- ✅ 订阅创建/激活
- ✅ 订阅更新/取消
- ✅ 订阅暂停
- ✅ 支付失败

## 📁 文件结构

```
├── app/
│   └── api/
│       └── paypal/
│           ├── create-order/
│           │   └── route.ts          # 创建 PayPal 订单
│           ├── capture/
│           │   └── route.ts          # 捕获支付并创建订阅
│           └── webhooks/
│               └── route.ts          # 处理 PayPal Webhook 事件
│
├── components/
│   ├── marketing/
│   │   └── pricing-cards.tsx        # 定价卡片 (已集成 PayPal)
│   └── payments/
│       ├── paypal-checkout-button.tsx  # PayPal 支付按钮
│       └── stripe-checkout-button.tsx  # Stripe 支付按钮
│
├── lib/
│   └── payments/
│       └── paypal.ts                # PayPal 核心逻辑
│
├── .env.example                     # 环境变量模板 (已更新)
└── PAYPAL_SETUP.md                  # 详细设置指南
```

## 🚀 快速开始

### 1. 配置环境变量

复制并编辑 `.env.local`:

```bash
cp .env.example .env.local
```

在 `.env.local` 中添加你的 PayPal 凭证:

```bash
# PayPal Sandbox 凭证 (从 https://developer.paypal.com/ 获取)
NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-sandbox-client-id"
PAYPAL_CLIENT_SECRET="your-sandbox-secret"
NEXT_PUBLIC_PAYPAL_MODE="sandbox"

# Plan IDs (当前使用简单标识符)
NEXT_PUBLIC_PAYPAL_PLAN_BASIC="basic"
NEXT_PUBLIC_PAYPAL_PLAN_PRO="pro"
NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE="enterprise"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. 安装依赖并启动

```bash
npm install
npm run dev
```

### 3. 测试支付流程

1. 打开 `http://localhost:3000/pricing`
2. 登录或注册账号
3. 选择一个计划
4. 切换到 "PayPal" 标签
5. 点击 "Pay with PayPal"
6. 使用 PayPal 沙箱账号测试支付

### 4. PayPal 沙箱测试账号

在 [PayPal Developer Dashboard](https://developer.paypal.com/) 中创建测试账号:

- **Business Account** (商家账号 - 接收付款)
- **Personal Account** (买家账号 - 进行付款)

## 📚 详细文档

查看 [PAYPAL_SETUP.md](./PAYPAL_SETUP.md) 获取:

- ✅ 详细的 PayPal 账号设置步骤
- ✅ 环境配置说明
- ✅ Webhook 配置指南
- ✅ 测试流程
- ✅ 生产环境部署
- ✅ 故障排除

## 🔄 支付流程

```
用户选择计划
    ↓
点击 "Pay with PayPal"
    ↓
创建 PayPal 订单 (/api/paypal/create-order)
    ↓
重定向到 PayPal
    ↓
用户在 PayPal 完成支付
    ↓
PayPal 重定向回应用 (/api/paypal/capture?token=xxx)
    ↓
捕获支付 & 创建订阅
    ↓
重定向到 Dashboard (显示成功消息)
```

## 💳 当前实现

### 支付模式
- **一次性支付** (使用 PayPal Orders API)
- 每个计划对应一个固定金额
- 支付成功后创建 30 天订阅

### 价格配置
在 `lib/payments/paypal.ts` 中配置:

```typescript
function getPriceForPlan(planId: string): string {
  if (planId === 'basic') return '29.00';
  if (planId === 'pro') return '99.00';
  if (planId === 'enterprise') return '299.00';
  return '0.00';
}
```

## 🔐 安全性

- ✅ 用户认证检查
- ✅ PayPal Client Secret 保存在服务端
- ✅ Webhook 签名验证 (生产环境启用)
- ✅ 用户 ID 验证
- ✅ 支付状态检查

## 🎨 UI/UX 特性

- ✅ Stripe 和 PayPal 双支付选项
- ✅ Tab 切换支付方式
- ✅ 加载状态显示
- ✅ 错误处理和提示
- ✅ 支付成功/失败重定向
- ✅ PayPal 官方图标

## 📊 数据库架构

### Payments 表
```sql
- userId: 用户 ID
- amount: 金额 (分)
- currency: 货币代码
- status: 支付状态 (succeeded/failed/refunded)
- provider: 支付提供商 (paypal/stripe)
- providerId: PayPal 订单 ID
- description: 描述
```

### Subscriptions 表
```sql
- userId: 用户 ID
- plan: 订阅计划 (basic/pro/enterprise)
- status: 状态 (active/canceled/paused/past_due)
- provider: 支付提供商 (paypal/stripe)
- providerId: PayPal 订阅/订单 ID
- currentPeriodStart: 当前周期开始
- currentPeriodEnd: 当前周期结束
- cancelAtPeriodEnd: 是否在周期结束时取消
```

## 🚀 生产部署检查清单

- [ ] 获取 PayPal Live 凭证
- [ ] 更新 `NEXT_PUBLIC_PAYPAL_MODE` 为 `"live"`
- [ ] 配置生产环境的 Webhook URL
- [ ] 启用 Webhook 签名验证
- [ ] 更新 `NEXT_PUBLIC_APP_URL` 为生产域名
- [ ] 测试完整支付流程
- [ ] 测试 Webhook 事件
- [ ] 设置监控和日志
- [ ] 测试错误处理和边缘情况

## 🔧 升级到订阅 API (可选)

如果需要使用 PayPal 的订阅 API (支持自动续费):

1. 在 PayPal Dashboard 创建订阅计划
2. 获取 Plan IDs (格式: `P-XXXXXXXXXXXXX`)
3. 修改 `lib/payments/paypal.ts` 使用 Subscriptions API
4. 更新 `create-order` 路由使用订阅创建
5. 更新 Webhook 处理订阅事件

## 📞 需要帮助?

- 查看 [PAYPAL_SETUP.md](./PAYPAL_SETUP.md) 详细指南
- 查看 PayPal 官方文档: https://developer.paypal.com/docs/
- 检查服务器日志中的错误信息
- 在 PayPal Developer Dashboard 查看交易详情

---

**准备就绪！开始接受 PayPal 支付吧！** 🎉
