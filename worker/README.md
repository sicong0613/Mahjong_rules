# 番型统计后端（Cloudflare Worker）

给静态站点（GitHub Pages，`majiang.sicongwang.com`）补上一个轻量后端，
接管 `/api/*` 路径，用来收集并统计计番器上报的番型频率。

- 前端上报：首页计番器的「上传」按钮 → `POST /api/fan-stats`
- 展示：`instruction.html` 拉取 `GET /api/fan-stats`，按频次重排「常见和牌」
  并显示每个番型的出现占比

站点本体仍由 GitHub Pages 提供，Worker **只**接管 `/api/*`。

---

## 架构

```
浏览器 ──/api/*──►  Cloudflare Worker (index.js)
                      ├── D1  (mahjong-stats)   持久化：fan_counts + upload_log
                      └── KV  (mahjong-rl)      限流：每 IP 每小时上报次数

浏览器 ──其余路径──► GitHub Pages（静态站点）
```

| 存储 | 绑定名 | 用途 |
|------|--------|------|
| D1   | `DB`   | `fan_counts`（实时番型计数）、`upload_log`（审计日志，含时间/IP/番型） |
| KV   | `KV`   | `rl:<ip>` 限流计数器，TTL 1 小时 |
| Secret | `ADMIN_TOKEN` | 审计接口 `/api/fan-logs` 的访问口令 |

---

## 接口

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| `GET`    | `/api/fan-stats` | 公开 | 返回 `{ fans: [{name, count}], total }` |
| `POST`   | `/api/fan-stats` | 限流 | body `{ fans: ["立直", ...] }`，记录一次和牌 |
| `GET`    | `/api/fan-logs?token=&limit=&offset=&ip=` | 管理员 | 审计日志 |
| `DELETE` | `/api/fan-logs?token=&ip=` | 管理员 | 删除某 IP 的记录并重算计数 |

校验/限流参数（在 `index.js` 顶部可调）：

- `MAX_FANS_PER_UPLOAD = 25` 单次最多番种数
- `MAX_FAN_NAME_LEN = 12` 番种名最大字符数
- `RATE_LIMIT_PER_HOUR = 20` 同一 IP 每小时最多上报次数

> IP 由 Cloudflare 的 `CF-Connecting-IP` 头在服务端记录，前端不发送 IP。

---

## 前置条件

1. 安装并登录 wrangler：

   ```bash
   npm install -g wrangler   # 或 npx wrangler ...
   wrangler login
   ```

2. **域名必须走 Cloudflare 代理。** `majiang.sicongwang.com` 这条 DNS 记录
   在 Cloudflare 控制台里要是**橙色云朵（Proxied）**状态。GitHub Pages 默认
   给的是 `CNAME` 到 `<user>.github.io`——把它设为 Proxied 即可，Worker 的
   route 才能拦截 `/api/*`，其余路径仍回源到 GitHub Pages。

---

## 部署步骤

在 `worker/` 目录下执行：

```bash
# 1. 创建 D1 数据库，把输出里的 database_id 填进 wrangler.toml
wrangler d1 create mahjong-stats

# 2. 创建 KV 命名空间，把输出里的 id 填进 wrangler.toml
wrangler kv namespace create mahjong-rl

# 3. 建表（远端库）
wrangler d1 execute mahjong-stats --remote --file=schema.sql

# 4. 设置管理员口令（审计接口用），执行后按提示粘贴一个随机长口令
wrangler secret put ADMIN_TOKEN

# 5. 部署
wrangler deploy
```

`wrangler.toml` 里有两处 `FILL_IN_AFTER_CREATE` 占位符，分别对应步骤 1、2
的输出，部署前必须替换。

---

## 验证

```bash
# 应返回 {"fans":[],"total":0}（刚建库时为空）
curl https://majiang.sicongwang.com/api/fan-stats

# 模拟一次上报
curl -X POST https://majiang.sicongwang.com/api/fan-stats \
  -H 'Content-Type: application/json' \
  -d '{"fans":["立直","平和"]}'

# 再查一次，total 应为 1，两个番型 count 各为 1
curl https://majiang.sicongwang.com/api/fan-stats
```

然后打开 `instruction.html` 的「常见和牌」一节，卡片应按频次重排、右上角出现占比。

审计（需要步骤 4 设置的口令）：

```bash
curl "https://majiang.sicongwang.com/api/fan-logs?token=YOUR_ADMIN_TOKEN&limit=50"
```

---

## 本地开发

```bash
# 本地起 Worker + 本地 D1/KV
wrangler d1 execute mahjong-stats --local --file=schema.sql
wrangler dev
```

`wrangler dev` 会在本地端口起服务；前端里 `/api/*` 是相对路径，本地调试时
可把请求代理到该端口，或直接用 `curl http://localhost:8787/api/fan-stats` 测接口。

---

## 运维备忘

- **清理刷量 IP**：`DELETE /api/fan-logs?token=...&ip=1.2.3.4`，会删掉该 IP 的
  所有日志并从剩余日志**重算** `fan_counts`，计数保持一致。
- **调限流/上限**：改 `index.js` 顶部三个常量后重新 `wrangler deploy`。
- **备份**：`wrangler d1 export mahjong-stats --remote --output=backup.sql`
