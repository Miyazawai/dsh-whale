# DSH DeepSeek Balance Plugin

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

[English](#english) | [简体中文](#简体中文)

---

## English

A DeepSeek Harness Web client plugin that adds a **DeepSeek Balance** tab to the Web settings plugin area. It shows the live DeepSeek API balance from the official `/user/balance` endpoint, a local balance trend, and daily cost / token usage charts powered by ECharts.

**API reference:** <https://api-docs.deepseek.com/zh-cn/api/get-user-balance>

### Features

- Live balance: calls `GET https://api.deepseek.com/user/balance` with `Authorization: Bearer <API key>`, shows `is_available` and every `balance_infos` entry (`currency`, `total_balance`, `granted_balance`, `topped_up_balance`). Refreshes on demand and every 60 seconds.
- Balance trend: every successful balance read records one point per day in `localStorage`; a line chart appears once two points exist.
- Collapsible sections: live balance, trend, and daily usage blocks can be collapsed/expanded; the state is remembered per browser.
- Floating window: a draggable, always-on-top mini window shows the latest balance, availability, and a sparkline. Toggle it from the tab header; position and visibility persist.
- Daily usage (optional): paste your DeepSeek **Platform** `userToken` (from `platform.deepseek.com` DevTools → Local Storage) and pick a range (7 days / 30 days / this month / last month). The plugin fetches the private Platform usage endpoints through a same-origin host proxy and renders:
  - a bar + line chart of daily cost and daily tokens (ECharts, loaded from CDN),
  - summary stats: total cost, request count, input/output/cached tokens, cache hit rate.
- Keys: the API key and the Platform `userToken` are both stored in the browser's `localStorage` (keys `dsh-plugin-deepseek-balance.apiKey` / `...platformToken`) so they survive reloads; a "Clear token" button removes the Platform token.

### Security

- The API key is stored in the current browser's `localStorage` and is sent only to `https://api.deepseek.com`.
- The Platform `userToken` is a full session credential. It is persisted in the browser's `localStorage` (same trust domain as the API key) and is only POSTed to the plugin's same-origin host endpoint (`POST /api/dsh-deepseek-balance/usage`), which forwards it to `platform.deepseek.com` with browser-like headers and returns only the normalized usage data. Nothing is written to disk on the host side.
- The daily-usage feature relies on undocumented private Platform endpoints and the WAF may rate-limit or block requests; failures surface as clear error messages.

### Build

```sh
npm ci
npm run bundle
```

`bundle` runs tsdown and then `scripts/wrap-client.mjs`, which converts the ESM client output into the DSH Web client-loader format (`window.__ModuleLoader__.load({ id, factory })`) required by the browser-side module system. The host entry (`lib/index.js`) stays plain ESM and registers the usage proxy through `ctx.webServer`.

The package metadata declares the DSH Web client entry at `./client`. Enable the built package through the Harness plugin loader or composition, following the same mechanism as other DSH Web client plugins.

### Project Files

- `src/index.ts`: Host half — same-origin usage proxy via `ctx.webServer` (no token persistence).
- `src/client.tsx`: Settings tab: balance, balance trend, daily usage, ECharts rendering.
- `scripts/wrap-client.mjs`: Post-build wrap into the DSH client-loader format.
- `package.json`: DSH client plugin metadata.
- `.github/workflows/ci.yml`: GitHub Actions build verification.

---

## 简体中文

这是一个 DeepSeek Harness Web 客户端插件。它会在 Web 设置的插件区域新增 **DeepSeek 余额** 标签页：显示官方 `/user/balance` 接口的实时余额、本地余额趋势，以及基于 ECharts 的每日消耗 / Token 用量图表。

**API 文档：** <https://api-docs.deepseek.com/zh-cn/api/get-user-balance>

### 功能

- 实时余额：使用 `Authorization: Bearer <API Key>` 调用 `GET https://api.deepseek.com/user/balance`，展示 `is_available` 与全部 `balance_infos` 条目（`currency`、`total_balance`、`granted_balance`、`topped_up_balance`）。支持手动刷新与每 60 秒自动刷新。
- 余额趋势：每次成功读取余额后在 `localStorage` 记录一个数据点（每天一个）；积累两个点后显示折线图。
- 可折叠区块：实时余额、余额趋势、每日用量三块均可展开 / 折叠，状态按浏览器记忆。
- 悬浮窗：可拖拽、置顶的迷你窗口，显示最新余额、账户可用状态与余额走势（SVG 迷你图）。可在标签页头部切换显示；位置与可见性会持久化。
- 每日用量（可选）：粘贴 DeepSeek **开放平台** 的 `userToken`（登录 `platform.deepseek.com` 后 F12 → Application → Local Storage 复制），选择范围（近 7 天 / 近 30 天 / 本月 / 上月）。插件通过同源 host 代理调用平台私有用量接口并渲染：
  - 每日消耗柱状图 + 每日 Token 折线图（ECharts，从 CDN 加载）；
  - 汇总统计：总消耗、请求数、输入 / 输出 / 缓存 Token、缓存命中率。
- 密钥处理：API Key 与 Platform `userToken` 都保存在浏览器 `localStorage`（键 `dsh-plugin-deepseek-balance.apiKey` / `...platformToken`），刷新页面后仍在；提供「清除 Token」按钮。

### 安全说明

- API Key 保存在当前浏览器 `localStorage`，仅发送到 `https://api.deepseek.com`。
- Platform `userToken` 是完整会话凭据。它持久化在浏览器 `localStorage`（与 API Key 同一信任域），只 POST 到插件的同源 host 端点（`POST /api/dsh-deepseek-balance/usage`），由 host 带浏览器特征头转发到 `platform.deepseek.com`，仅返回规范化后的用量数据；host 侧不写入磁盘。
- 每日用量依赖未公开的平台私有接口，WAF 可能限流或拦截；失败时会显示明确错误信息。

### 构建

```sh
npm ci
npm run bundle
```

`bundle` 先执行 tsdown，再运行 `scripts/wrap-client.mjs`，将 ESM 客户端产物转换为 DSH Web 客户端加载器格式（`window.__ModuleLoader__.load({ id, factory })`），这是浏览器端模块系统要求的格式。host 入口（`lib/index.js`）保持普通 ESM，并通过 `ctx.webServer` 注册用量代理。

包元数据已声明 DSH Web 客户端入口 `./client`。构建完成后，请按 DSH 其他 Web 客户端插件相同的方式，通过 Harness 插件 loader 或 composition 启用此包。

### 项目文件

- `src/index.ts`：Host 半侧 — 基于 `ctx.webServer` 的同源用量代理（不持久化 token）。
- `src/client.tsx`：设置页标签：余额、余额趋势、每日用量、ECharts 渲染。
- `scripts/wrap-client.mjs`：构建后转换为 DSH 客户端加载器格式。
- `package.json`：DSH 客户端插件元数据。
- `.github/workflows/ci.yml`：GitHub Actions 构建校验。

