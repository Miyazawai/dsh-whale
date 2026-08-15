# DSH 傻瓜整合包 · 社区插件簇调研报告（余额/费用类等 17 仓库）

> 调研时间：2026-08-15（本环境时钟）。数据来源：`raw.githubusercontent.com` 抓取的各仓库 README（**17/17 全部抓到，无"仅凭搜索摘要"条目**）+ `api.github.com` 元数据（10 个仓库成功，7 个遇限流）+ GitHub HTML 页面/commits Atom 抓取的 star、最近提交、license。全部数据为抓取事实，未做推荐性结论。
>
> 说明：GitHub 返回的日期均在 2026-08 区间（与本沙箱时钟一致），下表按原样报告。

## 0. 总览表

| # | 仓库 | 类型 | star | 最近 push | license | 健康度 |
|---|---|---|---|---|---|---|
| 1 | Ghost011118/dsh-balance-meter | host+client 插件 | 13 | 2026-08-14 | BSD-3-Clause | 活跃 |
| 2 | v587d/dsh-opencode-go-usage | host+client 插件 | 2 | 2026-08-14 | MIT | 活跃 |
| 3 | Han-1413141/dsh-cost-meter | host+client 插件 | 29 | 2026-08-15 | MIT | 活跃（簇内 star 最高） |
| 4 | fishxcode/dsh-plugin-deepseek-balance | host+client 插件 | 0 | 2026-08-14 | **无 LICENSE 文件** | 新、活跃 |
| 5 | Sev7een/ds-api-usage | host+client 插件 | 6 | 2026-08-13 | MIT | 活跃 |
| 6 | nonewind/dsh-spend | host+client 插件 | 5 | 2026-08-15 | MIT | 活跃 |
| 7 | lancecheney/dsh-deepseek-balance | host+client 插件（monorepo） | 0（1 fork） | 2026-08-15 | MIT | 活跃 |
| 8 | bobcat848/dsh-calculator | host+client 插件 | 4 | 2026-08-14 | MIT | 活跃 |
| 9 | Townrain/dsh-precise-cache | client UI 插件 | 2 | 2026-08-14 | MIT | 活跃 |
| 10 | Meredith2328/dsh-sticky-note | host+client 插件 | 7 | 2026-08-14 | MIT | 活跃 |
| 11 | Luaphes/dsh-web-attention-badge | client UI 插件（纯浏览器） | 4 | 2026-08-13 | MIT | 活跃 |
| 12 | zhu1090093659/dsh-web-ui | **插件+皮肤合集（monorepo，13 子包）** | ~2444 | 2026-08-15 | Apache-2.0（子包声明） | 活跃，全列表 star 最高 |
| 13 | Starfie1d1272/dsh-builtin-toggles | host+client 插件 | 5 | 2026-08-15 | MIT | 活跃 |
| 14 | mishibeikejie/zat-dsh-engine | host+client 插件 | 26 | 2026-08-15 | MIT | 活跃（v0.4.1） |
| 15 | a903067276-rgb/dsh-hud | host+client 插件 | 3 | 2026-08-15 | MIT | 活跃 |
| 16 | a903067276-rgb/dsh-file-mentions | host+client 插件 | 2 | 2026-08-15 | MIT | 活跃 |
| 17 | MysaDC/dsh-plugin-description | host+client 插件 | 2 | 2026-08-14 | MIT | 活跃（v1.2.1） |

> 全部 17 个仓库都是可安装的 DSH 插件/bundle（或插件合集），**没有一个是 DeepSeek-Harness 的 fork**，也没有文档站/纯归档仓库；唯一"名不副实"的是 #14（见第 3 节）。

---

## 1. 逐仓库详细

### Ghost011118/dsh-balance-meter
- 一句话用途：在 Web 输入框上方的 composer dock 显示"账户余额 + 本会话预估花费"的芯片，点击展开分币种余额与分桶（输入/缓存读/输出）费用拆分。
- 类型：host + client 插件（host 查余额/抓定价页，client 渲染 dock 芯片）。
- 改动面：输入框 dock（composer dock，内置会话统计行旁边）。
- 数据来源：官方 `GET /user/balance`（30s 轮询）；会话花费来自 DSH 持久化 `tokenUsage` 投影（与内置统计同源）；价格来自自动抓取官方定价页（每 6h）+ 内置回退价。
- 依赖：需要 DSH ≥ 0.1.0-rc.6、`DEEPSEEK_API_KEY`（走 DSH 凭证 seam `~/.dsh/.credentials.yaml`）；构建用 tsdown；零配置。
- 健康度：13⭐，push 2026-08-14，BSD-3-Clause，活跃（2 open issues）。
- DSH 兼容性：声称支持 0.1.0-rc.6+（web profile）；非 fork、不补丁 DSH。
- 同簇重叠：与 3、4、5、6、7、8 高度重叠（余额+会话花费+峰谷计价）。

### v587d/dsh-opencode-go-usage
- 一句话用途：在输入框上方 dock 显示 OpenCode Go 订阅的三个用量窗口（5h 滚动/每周/每月）百分比与重置倒计时，按阈值变色预警。
- 类型：host + client 插件（bundle，npm 发布名 `dsh-ocgo-usage`——仓库同名 npm 包被他人抢先占用，README 有说明）。
- 改动面：输入框上方 dock（`conversation.composer.dock`，与内置 token 统计同位置）。
- 数据来源：**不是 DeepSeek 余额**——host 携带 OpenCode Go 会话 cookie 抓取 opencode.ai 的 workspace 用量页（`GET /workspace/<wrk>/go`，解析 SSR 的 `usage-item` 块），浏览器只访问同源 `/api/ocgo-usage`。
- 依赖：需要 OpenCode Go 的 `auth` cookie + workspace id（完整用户会话凭据；界面内置 Set 面板/环境变量/配置文件三途径）；host 300s 缓存（TTL 可配）+ 60s 失败冷却；构建 tsdown/vitest；构建配置改编自 dsh-balance-meter（BSD-3-Clause 注明）。
- 健康度：2⭐，push 2026-08-14，MIT，活跃。
- DSH 兼容性：DSH ≥ 0.1.0-rc.6；非 fork。
- 同簇重叠：OpenCode Go 额度显示与 3（dsh-cost-meter 的 OCGo 额度三档显示）、6（dsh-spend 的 OCGo Code 计划识别）重叠；其余与余额/费用簇不重叠。

### Han-1413141/dsh-cost-meter
- 一句话用途：最全的会话费用统计插件——本会话费用、当日费用、预算进度条、官方余额、历史记录、峰谷计价、官方价格一键同步、OpenCode Go 额度，中英双语界面。
- 类型：host + client 插件（version 1.2.0）。
- 改动面：输入区下方/会话标题栏（可配）+ 侧边栏（余额、预算图框、当日费用）+ 设置页（汇总卡片/今日会话/历史/预算/价格表/同步）。
- 数据来源：官方 `GET {baseURL}/user/balance`（进程内缓存）；会话费用来自每次模型调用的 usage 块（`llm/stream` 计费包裹 + `costUsage` 会话投影，含子代理/压缩/标题调用）；官方定价页 HTML 解析（一键同步）；OpenCode Go 额度走 opencode.ai 官方端点。
- 依赖：Node ≥ 20；运行时仅 zod、dsh-home-paths、dsh-credentials 纯函数（README 声称不导入 cordis/dsh 运行时类）；账本持久化 `$DSH_HOME/storages/cost-meter/ledger.json`（原子写入+防抖）；一键安装脚本 `irm ... install.ps1 | iex` 固定 tag。
- 健康度：29⭐（本簇最高），push 2026-08-15，MIT，活跃，v1.2.0。
- DSH 兼容性：未声明具体版本，要求带 `dsh plugin` 命令的 DSH（`npm i -g @deepseek-ai/dsh`）；经 `cordis.patch.yml` bundle 补丁挂载；非 fork。
- 同簇重叠：与 1、4、5、7、8 全重叠（余额/会话/当日/峰谷）；OpenCode Go 部分与 2 重叠；预算/历史看板能力在本簇最全（唯一"180 天历史 + 预算条 + 峰谷档位门控"完整组合）。

### fishxcode/dsh-plugin-deepseek-balance
- 一句话用途：在 Web 设置页新增"DeepSeek 余额"标签页——实时余额、本地余额趋势折线图、每日消耗/Token 图表（ECharts），外加可拖拽悬浮窗。
- 类型：host + client 插件（host 仅做同源代理，client 是设置页 tab + 悬浮窗）。
- 改动面：设置页（插件区域新 tab）+ 可拖拽置顶悬浮窗。
- 数据来源：官方 `GET /user/balance`（60s 自动刷新，Bearer API Key）；**每日用量走 DeepSeek 开放平台未公开私有接口**（需用户手动从 platform.deepseek.com DevTools 复制 `userToken`，经 host 同源代理转发，WAF 可能限流）；ECharts 从 CDN 加载。
- 依赖：TypeScript + tsdown 构建；ECharts CDN（运行时外部资源）；API Key 与 platformToken 存浏览器 localStorage；host 侧不落盘。
- 健康度：0⭐，push 2026-08-14，**无 LICENSE 文件（GitHub 未检出）**，活跃（新仓库）。
- DSH 兼容性：未声明版本；client 产物走 `window.__ModuleLoader__.load` 格式；host 用 `ctx.webServer`；非 fork。
- 同簇重叠：余额显示与 1、3、5、7、8 重叠；每日用量图表与 5（24h 图表）、6（历史看板）部分重叠；是簇内唯一依赖"平台私有接口+userToken"的。

### Sev7een/ds-api-usage
- 一句话用途：在"设置 → API 用量"页显示账户余额卡片 + 近 24 小时估计花费/Token/请求数 + 逐小时柱状图（仿官方平台页）。
- 类型：host + client 插件（host 半记账+余额，client 是设置页 `settings.section`）。
- 改动面：设置页（"API用量" section）。
- 数据来源：官方 `GET /user/balance`（host 用 **curl 子进程**调用——README 说明 `web.fetch` 不能带 Authorization 头）；花费来自 `llm/stream` waterfall 折叠每次真实调用的 TokenUsage（input/output/cache-hit/cache-miss）；价格是**硬编码 PRICING 常量（带快照日期，需手动更新）**，CNY 计价。
- 依赖：需要 host 上 `curl`；**纯内存、无持久化**（小时桶 48h/天桶 14d，重启即清零，README 称刻意为之）；三种形态：静态 bundle / 动态插件（cordis_define）/ 组合行。
- 健康度：6⭐，push 2026-08-13，MIT，活跃。
- DSH 兼容性：未声明版本；host-plane 插件（应放 host 组合）；非 fork。
- 同簇重叠：余额+24h 花费与 1、3、6、8 重叠；"无历史 UI/无持久化"是本簇最简实现之一。

### nonewind/dsh-spend
- 一句话用途：右下角悬浮用量仪表盘——token 调用量、按模型/供应商/时间多维统计、时间序列图、52 周热力图、自动识别订阅制（Code）与按量（Token）计费计划、预计费用。
- 类型：host + client 插件（host 是 Typert Remote 服务 `usageStats`；client 是自挂 React root 的悬浮窗，不走 DSH 槽位）。
- 改动面：右下角悬浮胶囊/窗口（`position: fixed`），可开独立窗口，CSV/JSON 导出。
- 数据来源：**回放 `$DSH_HOME/sessions` 下所有会话持久化日志**（zstd 分帧解码，按 token-meter 语义去重合并）+ 内存活动会话；计价用内置"供应商知识库"（17 供应商/131 模型，2026-08-14 官方文档核实，含别名归一化）；DeepSeek 峰谷价内置 schedule（每条调用按发生时刻计价）；**官方余额接口不自动查询**（余额仅作可选 `plans.balance` 配置）。
- 依赖：运行时无外部服务；zstd 解码会话日志；`refreshSeconds` 服务端下发；签名缓存（会话文件大小+mtime）。
- 健康度：5⭐，push 2026-08-15，MIT，活跃。
- DSH 兼容性：未声明版本；直接读取 DSH 内部会话日志格式（属"深度读内部数据"，但非 fork/补丁源码）；非 fork。
- 同簇重叠：与 1、3、5、7、8 重叠（费用）；历史看板/多维统计/性能指标（TTFT、tokens/s）为簇内独有；OpenCode Go/Codex/Copilot/Claude Code 订阅识别与 2、3 的 OCGo 部分重叠。

### lancecheney/dsh-deepseek-balance
- 一句话用途：在"Session log"按钮左侧显示紧凑计费徽章（`Spent ¥0.12 | Balance ¥47.17 | Peak | ¥27.0⁺/M output`），点击展开右侧用量统计抽屉。
- 类型：host + client 插件（**仓库实为 monorepo**——见第 3 节特别核查 2）。
- 改动面：会话页头部（`conversation.session.header.utilities` 槽）+ 右侧抽屉。
- 数据来源：官方 `GET /user/balance`（host 侧代理，浏览器不见 API Key，徽章只显示掩码）；花费 = 会话 `tokenUsage` 投影 × 当期价格；价格由 host **每日 01:00（北京）抓取官方定价页中英文两版**解析 + 内置回退表。
- 依赖：npm 包 `@lancecheney/dsh-deepseek-balance`；需要 `DEEPSEEK_API_KEY` 凭证/环境变量；轻量。
- 健康度：0⭐（1 fork），push 2026-08-15，MIT，活跃。
- DSH 兼容性：未声明版本；bundle patch；非 fork。
- 同簇重叠：与 1、3、5、8 重叠（余额+会话花费+峰谷）；多币种（账户币种 ¥/$）与 4 的多币种余额展示重叠；官方价每日同步与 1、3 重叠。

### bobcat848/dsh-calculator
- 一句话用途：右上角浮层卡片显示当前会话费用（按模型）、当天全部会话累计（本地时区）、官方账户余额，可折叠成胶囊。
- 类型：host + client 插件（v1.2.0）。
- 改动面：右上角浮层卡片（`shell.overlay` 槽——v1.2.0 适配说明：DSH 0.1.0-rc.6 移除了 `aside` 槽，故从右侧栏迁到 overlay）。
- 数据来源：host 订阅 `assistant/message` 的 usage + `message.source`（按 provider/model 记账，fork 子会话按 message.id 全局去重）；官方 `GET /user/balance`（30s 缓存）；**价格硬编码官方价（CNY/1M），峰谷规则内置（2026-08-17 起生效）**。
- 依赖：install.ps1/install.sh 一键安装（免克隆）；无重依赖。
- 健康度：4⭐，push 2026-08-14，MIT，活跃。
- DSH 兼容性：明确适配 0.1.0-rc.6（v1.2.0）；非 fork。
- 同簇重叠：与 1、3、5、7 重叠（余额+会话+当日）；无历史看板/预算/价格同步。

### Townrain/dsh-precise-cache
- 一句话用途：在输入框下方统计栏旁多显示一行精确到小数点后五位的缓存命中率（`精确命中 99.87654%`），因为内置统计栏把命中率四舍五入到整数。
- 类型：client UI 插件（host 半是空实现，纯浏览器呈现；**无任何自建 RPC/请求**）。
- 改动面：输入框下方统计栏（`conversation.composer.dock`，排在内置 stats 行之后）。
- 数据来源：直接读 DSH `tokenUsage` 投影（`useProjection`，分母与内置一致：uncached+cacheRead+cacheWrite）。
- 依赖：零运行时依赖；PowerShell/Node 一键安装脚本；无构建步骤（手写 ModuleLoader bundle）。
- 健康度：2⭐，push 2026-08-14，MIT，活跃。
- DSH 兼容性：`dsh.client.platform = "web"`；未声明版本；非 fork。
- 同簇重叠：与 12 的 dsh-live-stats（实时令牌统计含缓存命中率）、15（dsh-hud 官方信息含 cache-hit rate）在"缓存命中率显示"上轻微重叠；与余额/费用簇无关。

### Meredith2328/dsh-sticky-note
- 一句话用途：左下角便签——编辑框工具栏按钮弹出便签面板，随手记点子/感想/TODO，实时保存到本地归档目录，清单+悬浮归档。
- 类型：host + client 插件（文件持久化 + 浏览器面板）。
- 改动面：编辑框工具栏（便签按钮）+ 左下角面板 + 设置页（存储路径/保存间隔/清除周期）。
- 数据来源：本地文件（默认 `~/.dsh/sticky-notes/` 下 点子/感想/TODO/归档 分类目录，时间戳 .md 文件）；无外部服务。
- 依赖：轻量；`dsh plugin --profile web add dsh-sticky-note` 安装。
- 健康度：7⭐，push 2026-08-14，MIT，活跃（2 open issues）。
- DSH 兼容性：未声明版本；非 fork。
- 同簇重叠：无（工具类，与任何余额/费用/UI 插件不重叠）。

### Luaphes/dsh-web-attention-badge
- 一句话用途：会话需要你时三处同时亮起提醒——框架左上角 `(1)` 徽章、浏览器 tab 标题 `(N)` 计数、鲸鱼 favicon 变色（琥珀=等你输入，绿=离开期间完成的会话）。
- 类型：client UI 插件（**无 host 代码**，纯浏览器）。
- 改动面：框架左上角徽章 + 浏览器 tab 标题 + favicon（三个表面同一计数）。
- 数据来源：内置 sessions store（无 host、无额外传输）。
- 依赖：零依赖；`lib/client.js` 顶部常量可调（开关/颜色/位置）。
- 健康度：4⭐，push 2026-08-13，MIT，活跃（v0.3.1）。
- DSH 兼容性：未声明版本；非 fork。
- 同簇重叠：无。

### zhu1090093659/dsh-web-ui
- 一句话用途：DSH Web UI 的插件与皮肤**合集**（npm scope `@linxin666`，monorepo 13 个子包 + 聚合包 `dsh-web-ui-all`），可整包装或单包装。
- 类型：插件合集（monorepo）。子功能清单见第 3 节特别核查 1。
- 改动面：侧边栏/输入框/会话区/设置页/移动端等多表面，见子包清单。
- 数据来源：各子包独立（git CLI、SSH、SSE/cloudflared、本地文件、模型视觉端点等），无统一数据源。
- 依赖：pnpm workspace（Node ≥ 22 构建）；聚合包有原生依赖 `cloudflared`/`cpu-features`/`ssh2`（pnpm 需 `allowBuilds`）；pnpm 11 有 `minimumReleaseAge` 门禁坑（README 有专门排障章节）。
- 健康度：**~2444⭐（全列表最高，两次抓取 2442/2444）**，push 2026-08-15，Apache-2.0（README 来源表与子包 package.json 均声明），活跃。
- DSH 兼容性：未声明单一版本；经 `cordis.patch.yml` + profile node_modules 符号链接挂载（README 承认 npm 滞后会导致"宿主已挂载但 UI 不显示"）；非 fork。移植包 dsh-tool-describe-image 来自 whitelonng/dsh-plugin-describe-image（原 deepseek-harness `packages/vision/tool-describe-image`），Apache-2.0 署名保留。
- 同簇重叠：dsh-live-stats 与 9（缓存命中率）、15（hud token 统计）重叠；右侧面板（文件树/SCM）与 15 部分重叠；社区插件索引卡与 14（zat 市场）、17（插件描述）都在设置页插件区；其余（任务看板/Git 图谱/宠物/移动端/SSH）为本仓库独有。

### Starfie1d1272/dsh-builtin-toggles
- 一句话用途：证据支撑的"内置能力检查器"——在设置页显示当前 Web Loader 全部 capability 的审查状态/profile override/兼容性/mutation eligibility，另附 9 个经审查的纯 UI 开关（fail-closed）。
- 类型：host + client 插件（inspection 由 host 计算，client 渲染设置页）。
- 改动面：设置 → 插件 → "内置开关"。
- 数据来源：Host 能力检查（inventory/审阅基线/配置三态/eligibility）；稳定机器接口 `GET /api/builtin-toggles/v1/inspection`。
- 依赖：轻量；npm `dsh-builtin-toggles`；9 个可控 UI 条目白名单 `MANAGEABLE_IDS`（ui-deliverables/ui-jobs/ui-goal/ui-message-feedback/ui-model-selection/ui-agent-preset/ui-skill/ui-subagent/ui-trajectory）；mutation 仅 loopback。
- 健康度：5⭐，push 2026-08-15，MIT，活跃。
- DSH 兼容性：**reviewed baseline 精确钉在 `@deepseek-ai/dsh-base@0.1.0-rc.6` + `@deepseek-ai/dsh-web-app@0.1.0-rc.6`**，不做版本范围承诺；不改 DSH 源码，但可强制改写 profile 的 `disabled` override（有自保护与"恢复继承"卸载要求）。
- 同簇重叠：与 14（zat 市场）、17（插件描述）同处"设置→插件"增强区但功能不同；是簇内唯一能开关内置 UI 条目的插件。

### mishibeikejie/zat-dsh-engine
- 一句话用途：**"插件市场"（marketplace），Wallpaper Engine 风格**——在设置→插件页加一个"Plugin Market"标签，浏览/搜索/一键安装/更新/卸载整个 dsh-plugin 社区的插件。名字里的"engine"指市场引擎，不是 LLM 引擎。
- 类型：host + client 插件（安装操作走官方 `dsh plugin` profile 机制，client 是市场 UI）。
- 改动面：设置 → 插件 → Plugin Market 标签（v0.4.1 另加"会话管理"小节，位于设置里的 Agent Presets 下方）。
- 数据来源：GitHub `dsh-plugin` topic 搜索（1700+ 仓库，单查询上限 1000 条）；内置 999 条预翻译中文简介，新插件由当前模型即时翻译；网络自动降级：系统代理→直连→`gh-proxy.com` 镜像→内置回退。
- 依赖：需要 pnpm + curl（+git 用于一键 star）；monorepo 感知安装（单插件仓库静默装、多插件仓库给选择器）；冲突门禁（禁止同时装两个市场/管理器、防官方包劫持、重复 patch 行检测）+ 上次可用状态备份一键恢复。
- 健康度：26⭐，push 2026-08-15，MIT，活跃（v0.4.1，有 Sponsor 链接）。
- DSH 兼容性：未声明版本；要求已初始化的 profile；非 fork。
- 同簇重叠：与 13（builtin-toggles）同在设置插件区但功能互补（装 vs 检）；与 17（插件描述）、12 的设置中心"社区插件"索引在"社区插件目录"维度重叠。

### a903067276-rgb/dsh-hud
- 一句话用途：输入工具栏一个"📊 HUD"按钮打开右侧悬浮状态面板——Git 状态/最近提交、MCP 连接、Skills、当前模型与 token 用量/会话统计；按钮自带未提交文件数实时徽章。
- 类型：host + client 插件（host 提供数据路由，client 是按钮+面板）。
- 改动面：输入工具栏（`input.left` seat 按钮）+ `shell.overlay` 右侧面板（默认 240px，可拖宽 200–480px）。
- 数据来源：git CLI（host 用单个 `bash -c` 带段标记批量跑命令）；MCP 由工具名 `mcp__<server>__<tool>` 推导；skills 列表；官方 projections（model/token/cache-hit/会话统计）。
- 依赖：**零运行时依赖、无构建步骤**（手写 ModuleLoader bundle）；需要 PATH 上的 git CLI。
- 健康度：3⭐，push 2026-08-15，MIT，活跃；README 自称独立社区项目、不与任何 DSH 插件共享代码。
- DSH 兼容性：未声明版本；`dsh plugin --profile web add "github:a903067276-rgb/dsh-hud#main"`；非 fork。
- 同簇重叠：Git 状态与 12 的 dsh-git-graph（分支切换/提交历史）部分重叠（hud 只读、不写）；token 统计与 9、12 的 dsh-live-stats 部分重叠；右侧面板与 12 的 dsh-aionui-panel（文件树/预览/SCM）部分重叠（hud 刻意保持只读极简）。

### a903067276-rgb/dsh-file-mentions
- 一句话用途：把 AI 回复里反引号包裹的文件路径变成可点击（点击用默认应用打开、📂 在文件管理器中显示、消息尾部出现"📎 mentioned files"芯片可预览内容）——Codex 风格。
- 类型：host + client 插件（host 两个路由做存在性检查/系统打开，client 收集渲染）。
- 改动面：会话消息流（行内路径点击 + 尾部芯片列表）。
- 数据来源：本地文件系统（存在性检查 + 系统 open/reveal，`execFile` 防注入）；支持 `~/`、相对（按会话 cwd）、绝对路径与中文路径。
- 依赖：零运行时依赖（纯 Node stdlib）。
- 健康度：2⭐，push 2026-08-15，MIT，活跃。
- DSH 兼容性：未声明版本；与官方"deliverables 列表"共存（官方有输出时官方优先）；非 fork。
- 同簇重叠：无直接重叠（唯一做"回复内路径交互"的插件）。

### MysaDC/dsh-plugin-description
- 一句话用途：给 DSH 设置页的每一张插件卡片补上中英文功能说明（内置覆盖出厂组合全部 134 个模块名的字典），并发布 `pluginDescriptions` 服务让其他插件注册自己的说明，支持页面直接编辑并持久化到用户字典。
- 类型：host + client 插件（持久化组合插件，双面 npm 包，v1.2.1）。
- 改动面：设置 → 插件 → 插件列表页（卡片说明、搜索升级、编辑说明）。
- 数据来源：内置字典 `descriptions/plugin-descriptions.json`（从 DSH 各官方包 README 首段提取+人工校对）+ 运行时 `pluginDescriptions.register` + 用户字典 `$DSH_HOME/plugin-descriptions.json`（优先级：用户字典 > 运行时注册 > 内置特殊条目 > 内置字典）。
- 依赖：轻量；无构建步骤安装（仓库提交 lib/ 产物）；Release tgz 安装。
- 健康度：2⭐，push 2026-08-14，MIT，活跃（v1.2.1）。
- DSH 兼容性：未声明版本；`cordis.patch.yml` bundle 补丁；只做可选服务读取（`ctx.get` 判空），不阻塞引导；非 fork。
- 同簇重叠：与 13、14、12（设置中心）同在"设置→插件"体验面，但功能正交（描述 vs 开关 vs 市场 vs 配置中心）。

---

## 2. 余额/费用簇能力对照表（#1,2,3,4,5,6,7,8）

图例：✓ = 明确具备；△ = 部分/间接（括号注明）；✗ = 无。

| 能力 \ 仓库 | 1 balance-meter | 2 opencode-go-usage | 3 cost-meter | 4 deepseek-balance(fishxcode) | 5 ds-api-usage | 6 dsh-spend | 7 deepseek-balance(lancecheney) | 8 dsh-calculator |
|---|---|---|---|---|---|---|---|---|
| 官方余额显示（/user/balance） | ✓ | ✗（OCGo 配额%，非余额） | ✓ | ✓ | ✓ | △（仅可选 plans.balance 配置，非自动查） | ✓（host 代理） | ✓（30s 缓存） |
| 会话花费 | ✓ | ✗ | ✓（位置可配） | ✗ | ✗（只有 24h 聚合） | ✓ | ✓（当前会话窗口） | ✓（按模型） |
| 当日花费 | ✗ | ✗ | ✓（侧边栏+悬停明细） | △（平台每日消耗图，需 userToken） | ✓（24h 卡片+逐小时图） | ✓（今日 tab+逐小时） | ✗ | ✓（本地时区，午夜重置） |
| 历史看板 | ✗ | ✗ | ✓（180 天按天+今日会话明细+汇总卡片） | △（余额趋势 localStorage+7/30 天用量图） | ✗（仅 24h；内存桶 48h/14d 无历史 UI） | ✓（72h 曲线/31 天趋势/52 周热力图/按天） | △（抽屉内每日分布/消耗/思考强度排行） | ✗ |
| 峰谷计价 | ✓（8/17 后自动，北京 09-12/14-18） | ✗ | ✓（时间门控+当前档位显示） | ✗ | ✗ | ✓（内置 schedule，每条调用按发生时刻计价） | ✓（Flat/Peak/Off-peak 指示） | ✓（8/17 后自动） |
| 官方价同步 | ✓（每 6h 自动抓定价页） | ✗ | ✓（一键抓取解析+AI 价格同步提示词） | ✗ | ✗（硬编码 PRICING，手动更新） | △（内置知识库 17 供应商/131 模型，非在线同步） | ✓（每日 01:00 抓中英文定价页） | ✗（硬编码） |
| 多模型 | ✓（flash/pro 从请求头自动检测） | ✗（provider 感知显示） | ✓（每模型 基础/谷/峰 三档价格表） | ✗ | △（PRICING 按模型） | ✓（131 模型+别名归一化） | ✓（V4-Pro/Flash） | ✓（flash/pro） |
| 多货币 | △（余额分币种 granted/top-up 展示；计价内置 CNY） | ✗ | △（USD 存储、CNY 显示，汇率可改） | ✓（balance_infos 每币种条目） | ✗（仅 CNY） | △（USD/CNY 切换） | ✓（按账户币种 ¥/$ 自动） | ✗（仅 CNY） |
| 预算条 | ✗ | △（三窗口百分比+阈值变色，可视为用量条） | ✓（进度条+≥80% 预警/≥100% 超支） | ✗ | ✗ | ✓（月预算，80%/100% 变色） | ✗ | ✗ |
| 通知/告警 | ✗ | △（80%/90% 变色阈值） | △（预警/超支提示，仅提醒不阻止） | ✗ | ✗ | △（胶囊变色） | ✗ | ✗ |
| OpenCode Go 额度 | ✗ | ✓（核心功能） | ✓（侧边栏/设置/dock 三档） | ✗ | ✗ | ✓（Code 计划自动识别，$10/月额度） | ✗ | ✗ |
| 会话×模型明细/导出 | △（分桶 input/cache/output 汇总） | ✗ | ✓（今日每会话明细+按天历史） | ✗ | ✗ | ✓（调用明细 CSV/JSON 导出+异常调用标红） | △（消耗排行，非逐会话） | △（per-model 拆分） |
| 数据来源（简） | 官方余额 API + tokenUsage 投影 + 定价页抓取 | opencode.ai 会话 cookie 抓取 | 官方余额 API + usage 块计费 + 定价页抓取 + OCGo 端点 | 官方余额 API + 平台私有用量接口（userToken） | 官方余额 API(curl) + llm/stream 折叠 + 硬编码价 | 回放 $DSH_HOME/sessions 日志(zstd) + 内置知识库 | 官方余额 API(代理) + tokenUsage + 定价页每日抓取 | assistant/message usage + 官方余额 API + 硬编码价 |
| 持久化 | 无（实时查询） | 配置/缓存文件 | ledger.json 账本 | localStorage | 无（纯内存） | 无（回放日志，本身持久） | 无（每日重抓价格） | 无 |

**簇内关键事实**：
- 全部 8 个都是"host 记账/查余额 + client 展示"的双面插件，无一是纯静态皮肤。
- 余额查询全部走官方 `GET /user/balance`；费用全部是**估算**（官方定价 × token 桶），README 均声明"非账单"。
- 价格获取分三派：自动抓定价页（1、3、7）、硬编码/内置知识库（5、8、6）、平台私有接口（4）。
- 峰谷计价五处已内置（1、3、6、7、8），统一以 2026-08-17 为生效时点（3 用 UTC 16:00 门控，其余用北京时段），档位窗口略有差异（1/8 为 09-12/14-18 北京；6 另带 01-04/06-10 UTC 说明；7 仅做指示）。
- OpenCode Go 额度只有 2（专精）、3（附赠）、6（计划识别）三处涉及，且 2 与 3 的 OCGo 数据源同为 opencode.ai 官方端点。
- 会话花费口径差异：1/7/8 读 DSH `tokenUsage` 投影或 usage 事件（与内置统计同源）；3 用 `llm/stream` 包裹计费并含子代理等辅助调用；6 直接回放会话日志文件（唯一不依赖宿主事件钩子的）。

---

## 3. 特别核查

### 1）zhu1090093659/dsh-web-ui 子功能/子包清单（monorepo，`packages/` 目录实测 13 项）
| 子包 | 功能 | 说明 |
|---|---|---|
| dsh-task-board | 任务看板 | 五列状态（待规划/待办/进行中/已完成/已失败），卡片可派给真实 DSH 智能体会话执行并自动回写，支持 cron 定时执行 |
| dsh-git-graph | Git 图谱 | 输入框上方分支选择器 + 分支泳道/提交历史可视化 |
| dsh-aionui-panel | 右侧面板 | 文件树 + 多标签预览（md/html/代码/diff/CSV/PDF/Office/图片）+ SCM stage/unstage/discard，宽度可拖 |
| dsh-pet | 鲸鱼娘宠物 | 常驻界面、随 agent 状态切换动画、摸头互动、投喂鱼干涨亲密度 |
| dsh-live-stats | 实时令牌统计 | 输入框下方 TPS/LLM 耗时/上下文占用/缓存命中率/输入输出 token |
| dsh-remote-web-ui | 移动端远程 | 扫码配对独立移动端界面，SSE 实时推送（隧道不支持时降级轮询），cloudflared 隧道可选 |
| dsh-ssh | 远程连接 | xterm.js Web 终端 + SFTP 传输 + 端口转发（仅 127.0.0.1）+ 集群并发执行 + Agent 直连（共享 ~/.dsh/dsh-ssh.json） |
| dsh-tool-describe-image | 图像理解工具 | 为纯文本模型加 `describe_image` 工具，转发 OpenAI 兼容视觉端点（Qwen-VL/GLM-4V/GPT-4o/Ollama），图片不进会话记录；**移植自 whitelonng/dsh-plugin-describe-image** |
| dsh-web-ui-settings | 设置中心 | 全部插件开关与参数统一收纳"设置>插件配置"+ 社区插件索引卡片 |
| dsh-skins + skins | 皮肤中心/皮肤资源 | 10 款皮肤，先试穿再应用；README 列出 Windows XP(Luna)/Blue Fantasy/鲸吟/夕港 等 |
| dsh-liangshen | "梁神"agent preset | **不是 UI 插件**：两阶段锚定式 agent preset（先 Minimal 双工具面→门控提升→Code Mode PTC 单工具），启动时同步进 ~/.dsh/.agent-presets |
| dsh-web-ui-all | 聚合包 | 包装齐全部功能插件与皮肤（npm `@linxin666/dsh-web-ui-all`）；另有独立 `dsh-skins` 包 |

安装注意（README 实测坑）：pnpm 严格布局需 `nodeLinker: hoisted`；`cloudflared`/`cpu-features`/`ssh2` 需 `allowBuilds`；pnpm 11 `minimumReleaseAge` 门禁可能静默装回旧版导致启动崩溃（需 `minimumReleaseAgeExclude`）。

### 2）名字与用途不符项
- **14 mishibeikejie/zat-dsh-engine**：README 明确是"视觉化插件市场"（Wallpaper Engine 风格），名字里的 engine 是市场引擎，与"引擎/内核"无关。
- **2 v587d/dsh-opencode-go-usage**：名字看不出，实际是 **OpenCode Go 订阅额度**（非 DeepSeek 余额），数据源为 opencode.ai 会话 cookie 抓取。
- **9 Townrain/dsh-precise-cache**：名字看不出，实际是"把缓存命中率显示到 5 位小数"，与费用无关。
- **7 lancecheney/dsh-deepseek-balance**：仓库现名 `dsh-deepseek-balance`，但访问 `github.com/lancecheney/dsh-deepseek-balance` 会 302 到 **`lancecheney/dsh-plugins`**（页面标题为 "lancecheney/dsh-plugins"）；内容是一个 monorepo（`packages/dsh-deepseek-balance` 为唯一子包）。

### 3）非插件/结构异常项
- 17 个仓库全部是可安装插件/bundle；**无文档站、无纯归档仓库**。
- #7 是 monorepo（内含唯一子包）；#12 是 monorepo（13 子包+聚合包）；其余为单包仓库。
- #4 fishxcode 无 LICENSE 文件（GitHub license 检测为空，HTML 侧栏亦无 LICENSE 链接）——license 状态不明。
- #5 Sev7een 同时提供静态 bundle / 动态插件（cordis_define）/ 组合行三种形态；#14 明确禁止与第二个市场/管理器插件共存（冲突门禁）。

### 4）同簇重叠总结（只列事实，不含选型建议）
- **余额/费用簇（1、3、4、5、6、7、8）**：功能重叠严重；能力差异集中在"历史看板（3、6）""预算条（3、6）""官方价自动同步（1、3、7）""多币种（4、7）""明细导出（6）"。
- **OpenCode Go 子簇（2、3、6）**：三处都读 opencode.ai 端点。
- **设置页插件区子簇（12 设置中心、13、14、17）**：都改动"设置→插件"面，功能正交（配置中心/能力检查+开关/市场/描述字典）。
- **缓存命中率显示子簇（9、12 的 live-stats、15）**：轻量重叠。
- **右侧面板/Git 子簇（12 的 aionui-panel/git-graph、15）**：部分重叠，15 刻意只读极简。
- **无重叠独立品**：10（便签）、11（注意力徽章）、16（文件提及）、12 独有的任务看板/宠物/移动端/SSH。

---

*本报告仅收录抓取到的事实；未对任何仓库做"该选哪个"的推荐。*
