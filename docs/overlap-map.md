# 跨簇功能重叠地图（选品轮底稿）

> 来源：簇 A/C/D 三份调研报告（49 仓中的 39 仓）。簇 B（计费/杂项，17 仓）待补。
> 状态：2026-08-15 快照。本文件只列事实，不做取舍建议。

## 一、重叠簇清单（每簇 = 一个功能，多个实现）

### F1 余额/费用计费 —— ⏳ 簇 B 待补（已知 ≥8 个）
balance-meter / cost-meter / deepseek-balance×2 / ds-api-usage / dsh-spend / dsh-calculator / opencode-go-usage（OpenCode Go 订阅，非 DeepSeek 余额）/ precise-cache（缓存命中，非计费）。
另有两个"半计费"：zhu1090093659/dsh-web-ui（实时 token 统计）、a903067276-rgb/dsh-hud（token 用量）。

### F2 对话内生成式 UI —— 2 个（A 簇）
| | dsh-visualize | dsh-genui |
|---|---|---|
| 产出物 | visualize 工具 → 任意 HTML fragment | `dsh-ui` 围栏 JSON 组件规格 / render_ui |
| 渲染 | 沙箱 iframe + CSP（禁网络/表单） | 白名单组件、无 eval、规格守卫 |
| 流式 | 一次性 | 流式 |
| 交互回环 | 按钮暂不能回传 | action 事件循环回传模型 |
| 附加 | 无 | 输入框上方面板 dock |
| 依赖 | 轻（CDN 静态资源） | react + mermaid/three 按需 |
| 许可/规模 | BSD-3-Clause / 99★ | MIT / 94★ |

### F3 文件进对话 —— 3+ 个（A 簇，语义不同）
- dsh-at-file：`@` 引用工作区路径（v0.3.0 起纯路径，不读内容）
- dsh-drag-and-drop：拖拽解析**真实绝对路径**插输入框（依赖系统索引 Everything/Spotlight/plocate；**双仓并存 bill9109↔omdsh-dev，README 有未解决合并冲突标记，疑似迁 org**）
- dsh-file-uploads：上传副本进 `$DSH_HOME/uploads`，设置页管理（要求 rc.6 + Node 22+）
- 同簇外：HongMing-Huang/dsh-file-upload、dsh-external/dsh-paste-input、AKIRACOD/dsh-drag-and-drop（bill9109 的 fork）
- 间接：DSH-better-sidebar 自带"行尾 @文件"按钮

### F4 精简/折叠会话显示 —— 2+ 个（A 簇）
- dsh-focus-chat：独立摘要 tab（每轮一行摘要，点击展开）；**无 LICENSE**
- dsh-web-archive：原地折叠工具卡+Think 块；**无 LICENSE**
- 同簇外：Han-1413141/dsh-sticky-disclosure（与 web-archive 几乎同功能）

### F5 导航条/回合跳转 —— 6+ 个（A+C 簇）
- dsh-navbar（A，MIT/BSD 声明不一致）
- wsxwj123/dsh-plugins 内 turn-scrubber（C，monorepo 一拖五）
- 同簇外：asukasec/dsh-message-preview、vibeinging/dsh-turn-navigator、SnowCrescenter-tech/dsh-milestone、Simon314620/dsh-turn-index

### F6 状态行/工作状态 —— 3 个（A 簇 + B 簇半计费）
- ui-status-label：Web 状态文案（DOM 注入，零依赖）
- dsh-TUI：终端工作状态行（数据源 dsh-working-activity）
- a903067276-rgb/dsh-hud：悬浮 HUD（Git/MCP/技能/模型/token 用量）——与计费簇交叉

### F7 侧边栏工作台 —— 1+ 个（A 簇）
- DSH-better-sidebar：框架级（文件/编辑器/预览/沙箱浏览器/终端/Git，`ctx.betterSidebar` 服务，**重依赖 node-pty**，⭐1019）
- 同簇外：ccq1/dsh-side-panel、dsh-external/dsh-web-panel

### F8 插件市场 —— 2 个（D 簇）
- dsh-market：官方（⭐205，curated registry，偏好 npm tarball，主题标签页）
- dsh-webui-market-plugin：社区（⭐37，**README 自荐用官方**；多 FIFO 队列/试装验证/热挂载/停用启用）

### F9 文档读取 —— 2 个（C 簇，最直接重叠对）
| | anydoc | cowork |
|---|---|---|
| 能力 | 只读 → GFM Markdown | 读+写（xlsx/ipynb 可写） |
| 格式 | 更广（含宏格式 docm/pptm/xlsm/xlsb…） | 较窄，**拒宏格式** |
| 实现 | Rust 原生 napi-rs（JS 壳 0.05MB + 平台二进制） | 纯 JS（exceljs ~20.8MB + pdfjs-dist + mammoth） |
| 附带 | 无 | MCP server + CLI + 微信网关 |
| 许可 | **无任何声明** | MIT |

### F10 会话"回到过去" —— 2 个（C 簇，互补非重叠）
- dsh-turn-rewind：工作区文件回滚 + fork 新会话（Change Ledger，BSD-3-Clause）
- dsh-message-edit：对话内容分支编辑/reroll/重试（**仓库无 LICENSE 文件**，package.json 声明 MIT）

### F11 会话通知 —— 2 个（D 簇，表面不同）
- dsh-session-notification：web 侧（响铃+系统通知，纯 client，**无 LICENSE**，要求 rc.6+）
- dsh-notify-windows：Windows toast（host，零依赖，**安装需手动 patch 一步**）

### F12 Skill 相关 —— 3 个不同层（A+C 簇）
- dsh-skill-viewer（A）：skill 文件管理 UI（启用/停用/迁移/分组）
- dsh-skillport（C）：跨工具导入（Claude/Codex/Cursor/Gemini）
- xiaobright/dsh-anchored-standard（D）：agent preset（**非插件**，针对 rc.5 commit 测试，⭐1732）

### F13 搜索 —— 1 个增强（D 簇）
- liustack/modsearch：替换/增强内置 web_search（多引擎链 + failover；默认 Antigravity 免费；**不收 PR 单人维护**）

### F14 桌宠/趣味 —— 2 个（C+D 簇）
- dsh-dafeiyu（D）：完整方案（插件+预构建 Windows Helper，alpha，MIT）
- wsxwj123 pet-bridge（C）：仅状态桥，**需外部另装 cc-pet**

### F15 主题 —— 1 个（C 簇 monorepo）
- wsxwj123/dsh-plugins 内 theme-gallery（15 主题家族）+ skin-gallery（9 套皮肤复刻）；monorepo 还含 turn-scrubber / pet-bridge / session-manager / composer-tools 共 6 包

## 二、结构性红线（影响选品的共同事实）

1. **生态年龄**：全部仓库 1~9 天龄（2026-08-06~14 出生），无长期维护记录；"最活跃"标准失效。
2. **许可卫生问题 ≥8 处**：无 LICENSE（focus-chat、web-archive、message-edit、anydoc、dsh-desktop、session-notification）；声明不一致（dsh-navbar）；未声明（anchored-standard API=NOASSERTION）；README 合并冲突标记（bill9109/dsh-drag-and-drop）。
3. **兼容基线**：全部面向 0.1.0-rc.6 线（anchored-standard 例外：rc.5 commit 47f9438）；全部 bundle 层、零核心补丁、无 fork。
4. **三 UI 现状**：webui = 官方 web profile；tui = dsh-TUI（profile 插件，同进程）；gui = Electron 壳套 webui（dsh-desktop 先例；oh-dsh 的 @oh-dsh/desktop 更完整）。
5. **oh-dsh 已实现三形态统一**（Pinned runtime + 分层发布 + 自带 Node），是本项目基座头号候选。
