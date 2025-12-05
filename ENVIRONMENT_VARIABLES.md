# 环境变量配置模板

本文档列出了所有需要配置的环境变量。

## 🚀 快速开始

### 本地开发
创建 `.env.development` 文件并配置以下变量：

```bash
# 基础配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=My App

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# 认证
AUTH_SECRET=your-random-secret-key-here

# Stripe（测试环境）
STRIPE_ENABLED=true
DEFAULT_PAYMENT_PROVIDER=stripe
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### Vercel 部署
在 Vercel Dashboard → Settings → Environment Variables 中配置：

```bash
# 基础配置
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=My App

# 数据库
DATABASE_URL=postgresql://user:password@host:5432/dbname

# 认证
AUTH_SECRET=your-production-secret-key

# Stripe（生产环境）
STRIPE_ENABLED=true
DEFAULT_PAYMENT_PROVIDER=stripe
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_SIGNING_SECRET=whsec_xxxxx
```

## 📋 完整环境变量列表

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | 应用访问 URL | `https://yourdomain.com` |
| `DATABASE_URL` | 数据库连接 URL | `postgresql://...` |
| `AUTH_SECRET` | 认证密钥 | 使用 `openssl rand -base64 32` 生成 |
| `STRIPE_ENABLED` | 启用 Stripe | `true` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe 公钥 | `pk_live_xxxxx` |
| `STRIPE_SECRET_KEY` | Stripe 密钥 | `sk_live_xxxxx` |
| `DEFAULT_PAYMENT_PROVIDER` | 默认支付提供商 | `stripe` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | `ShipAny App` |
| `NEXT_PUBLIC_THEME` | 主题 | `default` |
| `NEXT_PUBLIC_APPEARANCE` | 外观模式 | `dark` |
| `STRIPE_SIGNING_SECRET` | Stripe Webhook 密钥 | - |
| `STRIPE_PAYMENT_METHODS` | 支付方式 | `["card"]` |

## 🔐 获取 Stripe Keys

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 测试环境：
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`
3. 生产环境：
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

## ✅ 验证配置

配置完成后，运行以下命令验证：

```bash
# 本地开发
pnpm dev

# 访问
http://localhost:3000/pricing
```

点击 "Checkout" 按钮，如果能跳转到 Stripe 支付页面，说明配置成功！

