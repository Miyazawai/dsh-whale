# DSH 插件簇调查报告（13 仓库）

> 调查时间：2026-08-15（数据截至各仓库最近一次 push，均在此日期前后）
> 数据来源：13 个仓库的 README 全部直接从 `raw.githubusercontent.com` 抓取成功（无一个仓库依赖搜索摘要）；star / push 时间 / license / 是否 fork / 是否归档来自 GitHub API（经已认证的 `gh` CLI 查询）；另抓取了社区 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 与 [beancookie/awesome-dsh-plugin](https://github.com/beancookie/awesome-dsh-plugin) 两份插件清单交叉核对；dsh-TUI 的架构细节以仓库内 `docs/architecture.md` 为准。

## 总体概况

这批仓库构成一个围绕 **DeepSeek Harness Web GUI 与 CLI 的 UI 增强插件簇**，全部诞生于 2026-08-06 至 08-14 这一周内（DSH 插件生态处于爆发初期）。13 个仓库中**没有一个是 DSH 的 fork，也没有一个声称修改 DSH 源码**；安装方式清一色是官方 `dsh plugin --profile web add <包>`，通过 `dsh.bundle` + `cordis.patch.yml` 以 bundle 层挂载。所有仓库截至调查时**均未归档、均在最近 1–2 天内活跃 push**。

按形态分：1 个终端界面插件（dsh-TUI，挂在 CLI profile 上）；其余 12 个均为 Web profile 的 host/client 双半（或纯 client）bundle 插件。没有发现文档站、monorepo 或纯独立应用。

---

## 1. ccch1mneyyy/dsh-TUI

- **一句话用途**：给 DSH 补一个 Claude Code 风格的**全屏终端界面**（TUI）——像素鲸鱼顶栏、实时工作状态行、思考流式展开、双击 Esc 时间回溯、上下文进度条 + TPS 仪表，被 DSH 官方公众号收录为"内测用户精选插件"。
- **类型**：**其他（终端界面插件）**——不是 client UI 插件，也不是独立应用；是运行在 `dsh` CLI 进程内的 Cordis profile 插件（`dsh --profile dsh-tui`），npm 包 `@deepseek-harness-tui/dsh-tui` 同时提供 `dsh-tui` 直达命令。
- **改动面**：挂载在 **CLI profile（新 profile `dsh-tui`，与 `web` profile 平级）**，整机替换 Web UI 成为终端交互面；在 TUI 内覆盖输入框（`@` 文件补全、命令补全）、会话流（流式 Markdown、工具卡、消息选择）、工具栏（全套 CC 式 slash 命令）、问卷（`ask_user_question` 的终端应答 UI）。
- **依赖**：官方 `dsh` CLI + npm 包 + `pnpm` 10+（首次运行自动初始化 profile）；运行模型需 `DEEPSEEK_API_KEY`；MCP 经 `@deepseek-ai/dsh-mcp-client`；状态行消费 [dsh-working-activity](https://github.com/ccch1mneyyy/dsh-working-activity) 的 `activity/status` 事件（与 Web UI 同数据源）；渲染依赖为**移植的 Ink renderer + Yoga 纯 JS 布局实现**（自研重件）。无外部进程/服务。
- **健康度**：⭐ 1136（本簇最高）；最近 push 2026-08-15；MIT；活跃（38 个 open issues，CI 绿）。公开 beta 状态。
- **DSH 兼容性**：声明"零核心改动，纯插件挂载，卸载不留核心补丁"；Node `^22.19 || >=24`；非 Windows 默认 `workspace-write` + 审批，Windows 回退 `danger-full-access`（无本地沙箱链）。
- **同簇重叠**：`@` 文件引用与 dsh-at-file 重叠（但分别在 TUI 与 Web 两个表面）；工作状态行与 ui-status-label 功能同类（不同表面）；与同簇外的 MashedPotato817/dsh-tui、openma-ai/deepseek-harness-tui（独立的 HTTP/JSON-RPC 终端客户端）**不是同一类东西**，见下方专项。

### 专项：dsh-TUI 如何与 DSH 通信？

- **进程关系：同一进程，无网络协议**。运行链路为 `Cordis profile → dsh-base → dsh-TUI 的 cordis.patch.yml 补丁层 → DSH Agent/session/tool services → session/event 事件流 → Channel 投影 → React 组件 → 移植 Ink/Yoga 渲染器 → ANSI 终端`。
- **通信机制：直接进程内服务调用 + 事件订阅**。`src/channel.ts` 把 DSH 持久化的 `session/event` 日志投影为 transcript（会话日志是真源，不持有本地数组真相），并提供 submit / steer / resume / rewind / model / preset 等动作；审批走 `ctx.approval` seam（`approval/request` waterfall，TUI 作 answerer）。会话持久化落在 profile 的 SQLite（`~/.dsh-cc/sessions.sqlite`）。
- **结论**：**不是独立应用**，也不是"TUI 客户端连 DSH 服务端"的架构；它就是一个以终端为渲染表面的 DSH 插件。同簇外的 `MashedPotato817/dsh-tui`（"over the one DSH HTTP contract"）和 `openma-ai/deepseek-harness-tui`（"DSH SDK JSON-RPC 协议"）才是走网络协议的独立客户端，与本仓库机制不同。

---

## 2. omdsh-dev/dsh-at-file

- **一句话用途**：Codex 风格的 `@file` 文件引用——在 Web 输入框打 `@` 搜索工作区文件，选中后把文件**路径引用**（而非内容）带进对话，模型用现有工具去读。
- **类型**：client UI 插件（host/client 双半 bundle）。
- **改动面**：**输入框**（`@` 路径选择器 + 引用条）+ **设置页**（Settings → File mentions 的 Exact/Regex 过滤规则）+ host 侧工作区索引与 `host.openPath` 打开引用。
- **依赖**：运行时依赖很轻（构建产物 `lib/` 已提交，无需构建脚本）；无外部服务、无 API key。v0.3.0 起改为纯路径引用（早期版本会在提交时读文件内容并限大小，现版本不再读内容）。
- **健康度**：⭐ 194；最近 push 2026-08-14；MIT；活跃。当前版本 v0.6.0。
- **DSH 兼容性**：面向 `web` profile；声明不修改 DSH 源码；用官方 profile/bundle 安装模型。
- **同簇重叠**：与 dsh-TUI 的 `@` 文件补全功能重叠（不同表面）；DSH-better-sidebar 的文件工作台自带"悬浮行尾 `@文件` 按钮"引用文件，功能交叉；与 dsh-file-uploads / dsh-drag-and-drop 都属于"把本地文件带进对话"簇，但它是引用路径而非上传/复制。

---

## 3. alingalingling/ui-status-label

- **一句话用途**：把 Web 聊天视图里智能体思考时的状态文案（官方硬编码的 `Deep diving...`）替换成任意自定义文字（默认"小难梁在0721"）。
- **类型**：client UI 插件（host/client 双半，host 半主要管 schema）。
- **改动面**：**消息渲染区的运行状态行**（轮次运行期间的状态文案）+ **设置页**（General 区一行文本输入）；设置持久化在 `$DSH_HOME/settings.yaml`，按用户而非会话。
- **依赖**：直接依赖 `@deepseek-ai/dsh-settings` + `schemastery`（npm）；peer 依赖 `@deepseek-ai/cordis`、`dsh-client-*`（由 dsh 提供）；无外部服务、无 API key、不触任何模型请求。
- **健康度**：⭐ 31；最近 push 2026-08-15；MIT；活跃（3 open issues）。dsh-suite 收录。
- **DSH 兼容性**：声明官方正式版（含 0.1.0-rc.6）即可直接生效，走**两条路径**：默认 DOM 注入（监听官方 `role="status"` 元素替换文本，零依赖上游）；可选 `conversationStatus` 服务（随仓库维护的 `UPSTREAM-EXTENSION.patch` 合入官方后自动让位）。**不是 fork**，但维护了一份提交给上游的扩展点补丁。
- **同簇重叠**：与 dsh-TUI 的"实时工作状态行"功能同类（TUI 走 dsh-working-activity 事件，本插件走 Web DOM/服务，表面不同）。

---

## 4. Nagi-ovo/dsh-visualize

- **一句话用途**：让模型在对话里直接生成**可交互的可视化卡片**（模拟器、图表、对比面板、UI mockup）——模型调用 `visualize` 工具，Web UI 把 HTML fragment 渲染成对话内卡片。
- **类型**：client UI 插件 + 工具 Tool（`visualize(path, title?, mode?)`）。
- **改动面**：**会话流内消息渲染**（工具结果渲染为卡片，支持 `wide` 模式；会话重放从持久化工具结果恢复）；TUI / headless 客户端只显示普通工具结果。
- **依赖**：运行时依赖轻（卡片渲染 = 沙箱 iframe + 固定 CDN 静态资源，无重 npm 依赖）；无外部服务；`maxFragmentBytes` 默认 1,000,000 字节。
- **健康度**：⭐ 99；最近 push 2026-08-14；BSD-3-Clause；活跃（2 open issues）。
- **DSH 兼容性**：面向 `web` profile，`dsh plugin --profile web add github:Nagi-ovo/dsh-visualize` 安装；未声明修改 DSH 源码。灵感来自 Codex 桌面的 `/visualize`，skill 分层参考了 himself65/finance-skills 的 generative-ui。
- **安全模型**：卡片运行在不透明来源 sandboxed iframe，CSP 禁止网络请求/嵌套页面/表单提交；卡片内按钮**暂不能**向主对话发 follow-up。
- **同簇重叠**：与 dsh-genui 构成"对话内生成式 UI"双雄，见下方专项。

---

## 5. omdsh-dev/DSH-better-sidebar

- **一句话用途**：一个**侧边栏完整工作台**（右侧栏 + 底部面板双工作台）——文件管理、CodeMirror 编辑与 Office/PDF/HTML 预览、内嵌沙箱浏览器、xterm.js + node-pty 真实终端、Git 面板、后台任务视图，并把 `ctx.betterSidebar` 服务开放给第三方插件注册 tab / 文件预览器。
- **类型**：client UI 插件（host/client 双半，服务化框架）。
- **改动面**：**侧边栏 + 底部面板**（portal 挂载，布局按会话持久化到 localStorage）；宿主新增路由 `/sidebar/api/*`（JSON API）、`/sidebar/file`（媒体）、`/sidebar/html`（预览）、`/sidebar/ws/terminal`（WebSocket：fs/git/pty）；**设置页**（侧边卡片逐项开关）；通过 `ctx.betterSidebar` 服务成为**其他插件的宿主**（`registerTab` / `registerFileViewer`）。
- **依赖**：**重依赖**——node-pty（原生二进制，需 `pnpm approve-builds` 放行）、CodeMirror、xterm.js、protobufjs；按需加载（启动只拉约 325KB 核心）；无外部 API；发布为 npm 包 `dsh-better-sidebar@0.12.2`。
- **健康度**：⭐ 1019（本簇第二高）；最近 push 2026-08-15；MIT；活跃（53 open issues）。v0.12.2。
- **DSH 兼容性**：需要 `dsh web` 可用 + Node ≥ 20 + pnpm ≥ 10；经 `dsh.bundle.patch` 由官方 CLI 自动挂载，README 明确"**不修改 DSH 源码**"；也支持经 [plugin-registry](https://github.com/dsh-external/plugin-registry) 安装。
- **同簇重叠**：文件工作台的"引用文件到输入框"与 dsh-at-file 交叉；文件/终端/工作台能力与同簇外 ccq1/dsh-side-panel、dsh-external/dsh-web-panel 重叠；是"文件带进对话"簇（at-file / file-uploads / drag-and-drop）的间接竞争者。

---

## 6. dingyi222666/dsh-focus-chat

- **一句话用途**：给 Web GUI 增加一个**"聚焦会话"精简视图 tab**——把智能体的每一轮压缩成一行摘要（`Thought for 36s, ran 2 shell commands, edited 8 files…`），点击展开完整细节，适合"只关心结果"的阅读。
- **类型**：client UI 插件（含空 host 半作为 bundle 载体；npm `@dingyi222666/dsh-focus-chat`）。
- **改动面**：**会话视图**——通过 `conversation.view` 列表 slot 挂载独立视图（作者明确说明 chat 视图内部 slot 是"被占有的"，第三方无法插入会话流，只能提供整视图）；不触碰聊天视图本身。
- **依赖**：纯 client 派生逻辑，无模型请求；无外部服务；npm 包发布。
- **健康度**：⭐ 16；最近 push 2026-08-14；**仓库无 LICENSE 文件**（GitHub API license=null）；活跃。
- **DSH 兼容性**：要求 dsh ≥ 0.1.0-rc.6；README 强调"deliberately never touches dsh's own source"。
- **同簇重叠**：与 dsh-web-archive 同属"精简会话显示"簇（focus-chat 是新 tab 摘要折叠，web-archive 是原地折叠工具/思考卡）；dsh-annotation 声明与其兼容（批注在 focus 视图同样工作）。

---

## 7. omdsh-dev/dsh-genui

- **一句话用途**：模型在回复里写 `dsh-ui` 围栏（JSON 组件规格），浏览器端把它渲染成**内联交互 UI**——统计卡、表格、图表、表单、测验、mermaid、3D 场景，按钮点击经 action 事件循环回传给模型（模型真的会响应）。
- **类型**：client UI 插件 + 工具 Tool（`render_ui`）+ skill（`genui`）。
- **改动面**：**会话流内消息渲染**（`dsh-ui` fence 流式渲染，组件边写边出现）+ **输入框上方会话面板 dock**（`/panel` 指令、`render_ui` / `panel:true` fence 原地更新）+ 工具行卡片通道。
- **依赖**：核心渲染包约 110KB min / 28KB gzip；**mermaid 与 three.js 作为按需资源**首次使用时经插件自注册 HTTP 路由加载；依赖 react；需 pnpm；无外部 API。安装走 git URL（README 明确 npm 包 `@omdsh-dev/dsh-genui` 尚未发布）。
- **健康度**：⭐ 94；最近 push 2026-08-14；MIT；活跃（4 open issues）。v0.8.x（fence 发现多表面）。
- **DSH 兼容性**：**双通道渲染**——host 有 `fence-registry` 扩展点时走官方流式渲染管线；否则（含原版 DSH 与旧版）退化为 DOM 观察通道自挂渲染树（0.7.2 起支持流式渲染）；因此声明"任何开源构建可用，不依赖特定 host 版本"。
- **安全模型**：组件白名单（模型不能夹带 HTML/脚本），函数表达式走独立解析器**不用 eval**；secrets 禁令（密码输入始终掩码不入库）；每 fence 规格守卫（节点上限 200 / 层级 8）；mermaid 失败自动修复。
- **同簇重叠**：与 dsh-visualize 构成"对话内生成式 UI"双雄，见下方专项。

---

## 8. omdsh-dev/dsh-annotation

- **一句话用途**：DSH Web 的**选中批注**插件——选中回复文字→写批注（可留空）→回车随消息一起发给模型，模型按 `Annotation 1: …` 逐条对应回复，回复里的 Annotation 标签是可悬浮查看原文的芯片。
- **类型**：client UI 插件（官方 bundle，Node 半为空实现；**纯浏览器端手写 CJS bundle，无构建步骤**）。
- **改动面**：**消息渲染**（批注标记高亮 + 回复 Annotation 芯片）+ **输入框**（Annotations ×N 芯片、Enter 拦截组装批注块、自己气泡内隐藏批注块零闪烁）+ **工具栏**（选中文本后的 Annotate）。
- **依赖**：零运行时依赖，bundle 自包含；无外部服务、无模型侧改动（批注块作为文本协议拼进消息）。协议块格式为固定中文模板（以"提问："为分隔符）。
- **健康度**：⭐ 49；最近 push 2026-08-15；MIT；活跃。v1.3.x。
- **DSH 兼容性**：官方 bundle 插件（`dsh.bundle` + `dsh.client` 声明），README 明确"**零核心改动**，cordis.patch.yml 只插入自身一行"；与 dsh-focus-chat 的 focus 视图兼容。
- **同簇重叠**：功能独特，无直接重叠；与 focus-chat 是互补集成关系。

---

## 9. vlln/dsh-navbar

- **一句话用途**：对话区右缘的**节点导航条**——每条 user 消息一个圆点节点，跟随阅读位置高亮，悬停预览（6 行截断）、点击平滑滚动跳转，实现 dsh-external/issues#144 规格。
- **类型**：client UI 插件（官方 bundle，Node 半为空；**自渲染 DOM，无 React 依赖**）。
- **改动面**：**会话视图右缘**导航条；**零数据通道依赖**——只靠官方锚点属性 `data-time-hover-root`（0806 起 user 行）驱动，无轮询、无路由、无工具。
- **依赖**：零运行时依赖；构建用 tsdown；无外部服务。
- **健康度**：⭐ 23；最近 push 2026-08-13；**license 不一致**：GitHub LICENSE 文件为 MIT（API 报告 MIT），README 正文写 BSD-3-Clause（badge 显示 MIT）；活跃。
- **DSH 兼容性**：`web` profile，bundle 安装；"0 patch"。
- **同簇重叠**：与同簇外 asukasec/dsh-message-preview、vibeinging/dsh-turn-navigator、SnowCrescenter-tech/dsh-milestone、wsxwj123 turn-scrubber、Simon314620/dsh-turn-index 等一大批"消息/轮次导航条"直接重叠；与 dsh-TUI 的会话导航无直接关系（不同表面）。

---

## 10. renat3u/dsh-web-archive

- **一句话用途**：把会话里正文之外的所有 display——工具卡片（read / bash / web_search / grep / edit…）和 **Think 推理块**——折叠成内联小卡片 `Deep Sleeping... (N)`，点击展开，正文消息结构完全不动。
- **类型**：client UI 插件（纯浏览器端，Node 半为空 apply）。
- **改动面**：**会话流渲染**——基于官方 ChatView 的稳定 data 属性（`data-chat-flow` / `data-chat-call-id` / `data-chat-anchor-key` / `data-variant="think"` / `data-subcalls`）做 DOM 折叠；MutationObserver + rAF 重放折叠状态（流式新卡/切换会话自愈，卸载还原）。
- **依赖**：**零运行时依赖**，bundle 完全自包含（esbuild 构建为 devDependency）；不注册 slot key，不与内置工具卡注册冲突。
- **健康度**：⭐ 7；最近 push 2026-08-13；**仓库无 LICENSE 文件**（API license=null）；活跃。
- **DSH 兼容性**：`web` profile bundle；依赖官方 ChatView 的 data 属性契约（若官方改动属性需更新选择器），不修改源码。
- **同簇重叠**：与 dsh-focus-chat 同属"精简会话显示"（一个原地折叠、一个独立摘要视图）；与同簇外 Han-1413141/dsh-sticky-disclosure（一键收起全部 Think/工具卡）直接重叠。

---

## 11. bill9109/dsh-drag-and-drop

- **一句话用途**：把本地文件/文件夹**拖进 DSH Web 页面任意位置**，插件解析出文件的**真实绝对路径**并插入当前输入框——不上传、不移动、不复制文件（浏览器通常不向网页暴露真实路径，插件用工作区 + 系统索引 + 有界目录搜索反解）。
- **类型**：client UI 插件（host/client 双半 bundle；host 半做路径解析与 file-locate HTTP 路由）。
- **改动面**：**整页拖放**（拖拽时全页遮罩提示）+ **输入框**（经 DSH 的 input-state 服务写草稿，不碰输入 DOM）+ toast 通知。
- **依赖**：无 API key；**依赖外部进程作为可选加速**——系统索引：macOS Spotlight、Linux `plocate`/`locate`、Windows Everything CLI/PowerShell（外部命令 3s 超时、最多 100 候选、每根 20,000 条目录上限）；npm 依赖不重。
- **健康度**：⭐ 7；最近 push 2026-08-14；BSD-3-Clause；活跃；**README 中含未解决的 git 合并冲突标记**（`<<<<<<< HEAD … >>>>>>> 4bab506`，v0.1.5 附近）。**注意**：该仓库存在双份——用户所问的 `bill9109/dsh-drag-and-drop`（2026-08-06 创建，个人仓）之外，`omdsh-dev/dsh-drag-and-drop`（2026-08-14 创建，org 仓）同时存在且互非 fork；README 的徽章/安装命令/issue 链接全部指向 `omdsh-dev/dsh-drag-and-drop`，疑似开发重心已迁至 omdsh-dev org。
- **DSH 兼容性**：`web` profile bundle（`dsh.bundle` + `dsh.client` 声明），README 明确"无 DSH 源码改动、无需 config.yaml"。
- **同簇重叠**：与 dsh-file-uploads 同属"把本地文件带进对话"簇（本插件插真实路径不复制；file-uploads 上传副本）；与 dsh-at-file 间接相关（都是文件进对话，机制不同）；同簇外 AKIRACOD/dsh-drag-and-drop 是它的 fork（改为"文件芯片挂输入框上方"交互）、dsh-external/dsh-paste-input 是 Ctrl+V 粘贴文件路线。

---

## 12. l541402398/dsh-file-uploads

- **一句话用途**：从 Web 输入框上传**任意本地文件**（不限于图片），文件存入 host 的 `$DSH_HOME/uploads`（默认），提交时把容器内路径序列化进消息（如 `上传文件：/path/to/.dsh/uploads/report.pdf`），并在设置页管理已存文件。
- **类型**：client UI 插件（host/client 双半 Cordis bundle）。
- **改动面**：**输入框工具栏**（Files 按钮 + 待发文件卡 + 提交失败恢复）+ **设置页**（Settings → Uploaded files：目录、配额、下载/删除）+ **host 存储目录**与上传 HTTP 路由。
- **依赖**：无外部服务、无 API key；环境变量 `DSH_UPLOAD_DIR` / `DSH_UPLOAD_MAX_BYTES`（默认 100MiB/文件）/ `DSH_UPLOAD_TOTAL_MAX_BYTES`（默认 1GiB）可配；npm 依赖不重。
- **健康度**：⭐ 0（本簇最低、最新）；最近 push 2026-08-14；MIT；活跃（v1.0.0）。
- **DSH 兼容性**：明确声明 DeepSeek Harness `0.1.0-rc.6`、web profile、**Node 22+**；说明"Harness 原生附件只支持位图，本插件走任意文件路径通道"，上传路由复用内置 Web API 的 loopback/trusted-host 与 Origin 检查。
- **同簇重叠**：与 dsh-drag-and-drop 同属"把本地文件带进对话"簇（上传副本 vs 插真实路径）；与 dsh-at-file 都是"文件进对话"（上传 vs 引用）；同簇外 HongMing-Huang/dsh-file-upload 是同类（Claude 式上传 + MarkItDown 转 Markdown + read_document 工具）。

---

## 13. Fishquito7/dsh-skill-viewer

- **一句话用途**：在 Web 界面直接**管理 skill 状态**——卡片列表、热启用/停用/删除、单文件或目录束添加、作用域分栏（全局 vs 工作区）、批量迁移、自定义分组；同时附带终端 `dsh-skill` 命令。
- **类型**：client UI 插件 + 工具/CLI（随包附带 `dsh-skill` 命令）。
- **改动面**：**设置页**（"技能"管理区）+ **磁盘技能文件**（`~/.dsh/skills` 全局、`<工作区>/.dsh/skills` 限定工作区）+ **终端 CLI**（`dsh-skill list/add/scope/migrate/disable/enable/delete`）。
- **依赖**：无重依赖；插件不自解析技能，只做文件管理（停用 = 把 `SKILL.md` 改名 `.disabled`，作用域迁移 = 真实移动/复制文件，DSH 自带文件监听器使其热生效）；无外部服务。
- **健康度**：⭐ 33；最近 push 2026-08-15；MIT；活跃。v0.4.0。
- **DSH 兼容性**：`web` profile；tarball 安装（推荐，避开 pnpm v11 构建脚本限制）；不修改技能目录（分组只写插件自己的配置 `~/.dsh/skills/.system/skill-viewer/groups.json`）。
- **同簇重叠**：本簇内无直接重叠（唯一做 skill 管理的）；与 DSH 内置 skill 机制及 dsh-TUI 的 `/audit` `/bug` 等技能命令间接相关（dsh-TUI 走官方注册表，本插件直接操作文件）。

---

## 专项：dsh-visualize vs dsh-genui（对话内生成式 UI 双雄）

两者目标一致（模型在对话里生成交互 UI），但**机制完全不同**：

| 维度 | Nagi-ovo/dsh-visualize | omdsh-dev/dsh-genui |
|---|---|---|
| 模型产出物 | 调用 `visualize(path, title?, mode?)` 工具，产出**任意 HTML fragment 文件** | 在回复正文写 `dsh-ui` 围栏（**JSON 组件规格**），或用 `render_ui` 工具 |
| 渲染方式 | fragment 放进**不透明来源 sandboxed iframe**（CSP 禁网络/嵌套/表单提交，仅放行固定 CDN 静态资源） | **白名单组件**渲染器（30+ 组件类型，函数表达式走独立解析器，**无 eval**、不能夹带 HTML/脚本） |
| 流式 | 工具结果一次性渲染（模型写完整 fragment 才显示） | **流式渲染**（0.7.2+：组件边写边出现，首个完成的组件立即显示） |
| 交互回环 | 卡片内按钮**暂不能**向主对话发送 follow-up | **action 事件循环**：按钮/表单带 `action` 点击回传模型，模型更新 UI；300ms 防抖合并 |
| 附加表面 | 无 | 输入框上方**会话面板 dock**（`/panel` 指令、panel 原地更新、append 增量合并） |
| 状态持久化 | 会话重放从**持久化工具结果**恢复卡片 | 用户状态（答案/输入/锁）按 session+内容指纹持久化（LRU 上限 200 块）；跨会话重放默认重置 |
| 安全护栏 | iframe 沙箱 + CSP + `maxFragmentBytes`（默认 1MB） | 组件白名单 + 规格守卫（200 节点/8 层）+ secrets 禁令 + 本地优先交互 |
| 依赖 | 轻（CDN 静态资源） | react + mermaid/three.js（按需加载，自注册 HTTP 路由） |
| 安装 | `github:Nagi-ovo/dsh-visualize` | `git+https://github.com/omdsh-dev/dsh-genui.git`（npm 未发布） |
| License / 规模 | BSD-3-Clause，⭐ 99 | MIT，⭐ 94 |

一句话概括：**visualize = 自由 HTML 的沙箱 iframe 渲染（能力大、受限网络、无回环）；genui = 白名单 JSON 组件的原生渲染（安全、流式、带 action 回环与面板 dock）**。

---

## 簇内重叠矩阵总结

把 13 个仓库按"解决同一类问题"归并，重复实现集中在 5 个功能点：

1. **对话内生成式 UI（2 个 + 同簇外）**：dsh-visualize、dsh-genui —— 机制迥异但目标完全一致，是本簇最显著的一对重复。
2. **把本地文件带进对话（3 个 + 同簇外）**：dsh-at-file（`@` 引用路径）、dsh-drag-and-drop（拖拽插真实路径）、dsh-file-uploads（上传副本进容器路径）；外加同簇外的 HongMing-Huang/dsh-file-upload、dsh-external/dsh-paste-input、AKIRACOD/dsh-drag-and-drop（fork）。三者都落点在"输入框"，但语义不同（引用/定位/上传）。
3. **精简/折叠会话显示（2 个 + 同簇外）**：dsh-focus-chat（独立摘要 tab）、dsh-web-archive（原地折叠工具/思考卡）；同簇外 Han-1413141/dsh-sticky-disclosure 与 web-archive 几乎同功能。
4. **消息/轮次导航条（1 个 + 大批同簇外）**：dsh-navbar；同簇外 asukasec/dsh-message-preview、vibeinging/dsh-turn-navigator、SnowCrescenter-tech/dsh-milestone、wsxwj123 turn-scrubber、Simon314620/dsh-turn-index 全部在做同一件事。
5. **状态行/工作状态（2 个，表面不同）**：ui-status-label（Web 状态文案）、dsh-TUI（终端工作状态行，数据源 dsh-working-activity）。

**独立无重复的**：DSH-better-sidebar（侧边栏工作台，本簇唯一框架级）、dsh-annotation（批注）、dsh-skill-viewer（skill 管理）。

**结构性事实**：13 个仓库全部是 bundle 层插件、全部声明"零核心改动"、全部未 fork DSH；生态集中在 2026-08 一周内爆发；两个仓库无 LICENSE 文件（dsh-focus-chat、dsh-web-archive），一个 license 声明不一致（dsh-navbar），一个 README 带未解决合并冲突标记（bill9109/dsh-drag-and-drop），一个仓库疑似已迁往 org（bill9109 → omdsh-dev 双仓并存）。
