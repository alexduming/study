# 支付配置指南（Payment Setup Guide）

本文档详细说明如何配置支付功能（Stripe/PayPal/Creem），解决 "checkout failed: no payment provider configured" 错误。

---

## 🚨 问题诊断

### 错误信息
```
checkout failed: no payment provider configured
```

### 原因分析
1. **Stripe 未启用**：`stripe_enabled` 必须设置为 `'true'`（字符串）
2. **配置未加载**：数据库配置未正确加载到 Vercel
3. **环境变量缺失**：Vercel 环境变量中没有配置 Stripe

---

## ✅ 解决方案

### 方案 1：Vercel 环境变量配置（推荐 ⭐）

这是最可靠的方式，即使数据库连接失败也能正常工作。

#### 步骤 1：登录 Vercel Dashboard
1. 打开 [Vercel Dashboard](https://vercel.com)
2. 选择你的项目
3. 点击 **Settings** → **Environment Variables**

#### 步骤 2：添加环境变量

**基础配置（必需）：**
```bash
# 启用 Stripe（必须设置为字符串 "true"）
STRIPE_ENABLED=true

# 默认支付提供商
DEFAULT_PAYMENT_PROVIDER=stripe

# Stripe API Keys（从 Stripe Dashboard 获取）
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
```

**高级配置（可选）：**
```bash
# Stripe Webhook 签名密钥（用于验证 webhook 通知）
STRIPE_SIGNING_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# 支持的支付方式（JSON 数组字符串）
STRIPE_PAYMENT_METHODS=["card","wechat_pay","alipay"]
```

#### 步骤 3：获取 Stripe Keys

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 开发环境：
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`
3. 生产环境：
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

#### 步骤 4：设置环境变量作用域

在 Vercel 中设置环境变量时，选择：
- ✅ **Production** （生产环境）
- ✅ **Preview**（预览环境，可选）
- ⚠️ **Development**（开发环境，可选）

#### 步骤 5：重新部署

方法 1：自动部署（推荐）
```bash
# Vercel 检测到环境变量变化会自动触发重新部署
# 等待 1-2 分钟即可
```

方法 2：手动部署
```bash
# 在 Vercel Dashboard 中点击 "Redeploy" 按钮
# 或者推送新的 commit
git commit --allow-empty -m "Trigger redeploy for payment config"
git push
```

---

### 方案 2：Admin 面板配置（数据库方式）

如果你希望通过 Admin 面板管理配置（而不是环境变量）：

#### 步骤 1：访问 Admin Settings
```
https://你的域名/admin/settings/payment
```

#### 步骤 2：配置 Stripe

**必需字段：**
1. **Stripe Enabled** → 打开开关（✅ 必须打开！）
2. **Stripe Publishable Key** → `pk_live_xxxxx`
3. **Stripe Secret Key** → `sk_live_xxxxx`
4. **Default Payment Provider** → 选择 `stripe`

**可选字段：**
5. **Stripe Signing Secret** → `whsec_xxxxx`（用于 webhook 验证）
6. **Stripe Payment Methods** → 选择支持的支付方式（卡、微信、支付宝）

#### 步骤 3：保存并测试
1. 点击 **Save** 保存配置
2. 访问 pricing 页面测试支付功能
3. 检查是否能正常创建 checkout session

---

### 方案 3：本地开发配置

在本地开发时，可以使用 `.env.development` 或 `.env` 文件：

#### 创建 `.env.development` 文件

```bash
# 基础配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=My App

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Stripe 配置（测试环境）
STRIPE_ENABLED=true
DEFAULT_PAYMENT_PROVIDER=stripe
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SIGNING_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PAYMENT_METHODS=["card"]

# 认证配置
AUTH_SECRET=your-random-secret-key-here
```

#### 重启开发服务器
```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
pnpm dev
```

---

## 🧪 测试配置是否生效

### 方法 1：检查日志

在 checkout 时查看控制台日志：
```bash
# Vercel 部署日志
vercel logs

# 本地开发日志
# 查看终端输出
```

### 方法 2：测试支付流程

1. 访问 pricing 页面
2. 点击 "Checkout" 按钮
3. 如果能跳转到 Stripe checkout 页面，说明配置成功
4. 如果仍然报错，查看错误信息：
   - `no payment provider configured` → Stripe 未启用或配置未加载
   - `Invalid API Key` → Stripe Secret Key 错误
   - `Invalid publishable key` → Stripe Publishable Key 错误

### 方法 3：API 测试

使用浏览器开发者工具测试 checkout API：

```javascript
// 打开浏览器控制台（F12）
fetch('/api/payment/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_id: 'test-product',
    currency: 'usd',
    locale: 'en',
    payment_provider: 'stripe'
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

预期结果：
- ✅ 成功：返回 `{ code: 0, data: { checkoutUrl: '...' } }`
- ❌ 失败：返回 `{ code: -1, message: 'no payment provider configured' }`

---

## 🔧 常见问题排查

### 问题 1：配置了环境变量但仍然报错

**原因：** 环境变量未生效或格式错误

**解决方案：**
1. 确认环境变量名称完全一致（区分大小写）
2. 确认 `STRIPE_ENABLED` 的值是字符串 `"true"`（不是布尔值）
3. 检查是否选择了正确的环境（Production/Preview）
4. 重新部署项目

### 问题 2：Admin 配置保存后不生效

**原因：** 数据库连接失败或配置未正确保存

**解决方案：**
1. 检查 Vercel 环境变量中的 `DATABASE_URL` 是否正确
2. 确认数据库服务是否正常运行
3. 查看 Vercel 日志，检查是否有数据库连接错误
4. 推荐使用 **方案 1（环境变量）** 作为备用方案

### 问题 3：测试环境正常，生产环境报错

**原因：** 生产环境使用了不同的 Stripe keys

**解决方案：**
1. 确认 Vercel Production 环境变量中使用的是 `pk_live_...` 和 `sk_live_...`
2. 确认 Stripe 账户已激活（不是测试模式）
3. 确认 Stripe keys 对应的账户有权限创建 checkout session

### 问题 4：Webhook 签名验证失败

**原因：** `STRIPE_SIGNING_SECRET` 配置错误或缺失

**解决方案：**
1. 登录 Stripe Dashboard
2. 进入 **Developers** → **Webhooks**
3. 添加 webhook endpoint: `https://你的域名/api/payment/webhook/stripe`
4. 复制 **Signing secret**（以 `whsec_` 开头）
5. 添加到 Vercel 环境变量：`STRIPE_SIGNING_SECRET=whsec_xxxxx`

---

## 📊 配置优先级

系统会按以下优先级加载配置：

1. **数据库配置**（Admin 面板） - 最高优先级
2. **环境变量配置**（`.env` 或 Vercel） - 备用方案
3. **默认配置**（代码中的默认值） - 最低优先级

**推荐策略：**
- 🏢 **生产环境**：使用 **Vercel 环境变量**（方案 1）
- 🧪 **测试环境**：使用 **Admin 面板**（方案 2）或本地 `.env` 文件
- 💻 **本地开发**：使用 `.env.development` 文件

---

## 📝 环境变量完整清单

### Stripe 配置
```bash
STRIPE_ENABLED=true                          # 启用 Stripe（必需）
DEFAULT_PAYMENT_PROVIDER=stripe              # 默认支付提供商（必需）
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx        # Stripe 公钥（必需）
STRIPE_SECRET_KEY=sk_live_xxxxx             # Stripe 密钥（必需）
STRIPE_SIGNING_SECRET=whsec_xxxxx           # Webhook 签名密钥（推荐）
STRIPE_PAYMENT_METHODS=["card"]             # 支付方式（可选）
```

### PayPal 配置（可选）
```bash
PAYPAL_ENABLED=true
DEFAULT_PAYMENT_PROVIDER=paypal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_ENVIRONMENT=production               # sandbox 或 production
```

### Creem 配置（可选）
```bash
CREEM_ENABLED=true
DEFAULT_PAYMENT_PROVIDER=creem
CREEM_API_KEY=your-creem-api-key
CREEM_ENVIRONMENT=production                # sandbox 或 production
CREEM_SIGNING_SECRET=your-creem-signing-secret
CREEM_PRODUCT_IDS={"product1":"creem_id1"}  # JSON 字符串
```

---

## 🎯 快速检查清单

在部署前，确认以下项目：

### Vercel 环境变量
- [ ] `STRIPE_ENABLED` 设置为 `true`
- [ ] `DEFAULT_PAYMENT_PROVIDER` 设置为 `stripe`
- [ ] `STRIPE_PUBLISHABLE_KEY` 已配置（以 `pk_` 开头）
- [ ] `STRIPE_SECRET_KEY` 已配置（以 `sk_` 开头）
- [ ] 环境变量作用域选择了 **Production**
- [ ] 重新部署项目

### Stripe Dashboard
- [ ] Stripe 账户已激活
- [ ] API keys 已生成（Development 或 Live）
- [ ] Webhook endpoint 已配置（如果需要）
- [ ] Signing secret 已复制（如果配置了 webhook）

### 代码配置
- [ ] `src/config/index.ts` 已更新（包含支付配置）
- [ ] 没有 TypeScript 错误
- [ ] 本地测试通过

---

## 💡 最佳实践建议

### 安全性
1. **不要在代码中硬编码** Stripe keys
2. **不要提交** `.env` 文件到 Git
3. **使用不同的 keys** 用于开发和生产环境
4. **定期轮换** API keys（每 3-6 个月）

### 可靠性
1. **同时配置环境变量和数据库**（双重保障）
2. **监控支付日志**（Vercel Analytics + Stripe Dashboard）
3. **设置 webhook 通知**（及时处理支付事件）
4. **测试所有支付场景**（成功、失败、取消）

### 可维护性
1. **使用清晰的命名**（遵循 `PROVIDER_KEY_TYPE` 格式）
2. **记录配置变更**（在团队文档中）
3. **使用环境变量管理工具**（如 Vercel 或 Doppler）
4. **保持配置同步**（开发、测试、生产环境）

---

## 🆘 仍然无法解决？

如果以上方案都无法解决问题，请提供以下信息：

1. **错误日志**（Vercel 日志或浏览器控制台）
2. **Vercel 环境变量截图**（隐藏敏感信息）
3. **Admin 配置截图**
4. **Stripe Dashboard 配置**（API 模式：测试/生产）
5. **测试步骤**（重现问题的详细步骤）

---

## 📚 相关文档

- [Stripe API 文档](https://stripe.com/docs/api)
- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)

---

**最后更新：** 2025-12-05
**版本：** 1.0.0

