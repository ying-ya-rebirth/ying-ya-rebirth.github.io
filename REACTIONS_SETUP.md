# 反应数据永久保存配置

本项目已配置为使用 GitHub API 永久保存表情反应数据。

## 部署步骤

### 1. 创建 GitHub Personal Access Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 输入 token 名称（如 `reactions-api`）
4. 选择 scopes：
   - ✅ `public_repo` （读写公开仓库 - 这个就够了）
   - **其他都不勾选**
5. 生成并复制 token

### 2. 部署到 Vercel

#### 方式 A: 使用 Vercel CLI

```bash
npm i -g vercel
vercel
```

按提示登录 Vercel 并授权。

#### 方式 B: 在 Vercel 网站部署

1. 访问 https://vercel.com/import
2. 导入你的 GitHub 仓库
3. 选择 Hugo 预设
4. 设置环境变量（见下一步）

### 3. 设置环境变量

在 Vercel 项目设置中添加：

- `GITHUB_TOKEN`: 你在第 1 步生成的 token
- `GITHUB_OWNER`: `ying-ya-rebirth`
- `GITHUB_REPO`: `ying-ya-rebirth.github.io`

### 4. 创建 reactions-data 分支

在 GitHub 中创建新分支用于存储反应数据：

```bash
git checkout --orphan reactions-data
git rm -rf .
touch .gitkeep
git add .gitkeep
git commit -m 'Initial reactions data branch'
git push origin reactions-data
```

### 5. 更新博客配置

在 `hugo.toml` 中添加：

```toml
[params]
  reactionsApiUrl = "https://your-vercel-app.vercel.app/api/reactions"
```

## 工作原理

1. **本地存储 (localStorage)**：快速读写，用户在当前设备上的反应立即生效
2. **服务器存储 (GitHub)**：通过 Vercel API 端点将数据保存到 GitHub
3. **缓存机制**：5 分钟重新检查一次服务器数据，避免频繁请求

## 数据格式

反应数据存储为 JSON 格式：

```json
{
  "laugh": { "count": 5, "reacted": false },
  "think": { "count": 3, "reacted": true },
  "kudos": { "count": 12, "reacted": false }
}
```

每篇文章的数据存储在：
`reactions/post_zh_post_adhd-reading-accessibility.md.json`

## 故障排查

### API 返回 401/403 错误
- 检查 `GITHUB_TOKEN` 是否正确设置
- token 是否包含 `repo` scope

### 无法创建 reactions-data 分支
```bash
git push -u origin reactions-data
```

### 本地测试

```bash
# 设置环境变量
export GITHUB_TOKEN="your_token"
export GITHUB_OWNER="ying-ya-rebirth"
export GITHUB_REPO="ying-ya-rebirth.github.io"

# 测试 API
node api/reactions.js
```

## 隐私考虑

- 反应数据存储在公开 GitHub 仓库中
- 如果需要私密性，建议创建私有仓库
- 或改用其他后端服务（Firebase, Supabase 等）

## 替代方案

如果不想使用 GitHub Issues，可以改用：

1. **Firebase Firestore** - 更灵活的数据库
2. **Supabase** - 开源 Firebase 替代
3. **MongoDB Atlas** - 传统数据库
4. **Cloudflare Durable Objects** - 低成本存储
