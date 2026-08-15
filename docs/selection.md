# 选品清单（终版）

> 依据：四簇调研（50 仓）+ 设计树决策（Q1~Q17）+ 用户追加必装（anchored-standard、dsh-routing-suite）。许可政策：宽松（侵删兜底），表中不再标注许可。
> 规则：核心包"一功能一实现"；可选包默认关、一键开。来源均为 GitHub 社区 bundle 插件，全部"零核心改动"。
> **总纲（用户指定）：遵循 DSH"一切皆插件"哲学——全部组件可插入可拆除；"核心包"只是默认组合，任何插件（含核心 17）都可用官方插件机制随时移除；模型↔预设联动自身带开关（autoSwitch/toggleable），想关就关。**

## ✅ 核心包（默认启用，17 个）

| # | 功能 | 插件 | 备注 |
|---|---|---|---|
| 1 | 费用/计费 | dsh-cost-meter | 余额/会话/当日/180 天历史/预算条/峰谷/官方价同步/OCGo 额度 |
| 2 | 生成式 UI | dsh-genui | 白名单组件+流式+action 回环+面板 dock |
| 3 | 文件引用 | dsh-at-file | @ 引用路径，纯路径零复制 |
| 4 | 文件上传 | dsh-file-uploads | 任意文件进对话；Node 22+ 已由基座自带 runtime 覆盖 |
| 5 | 会话折叠 | dsh-web-archive | 工具卡+思考块折叠 |
| 6 | 导航条 | dsh-navbar | 零依赖右缘节点跳转 |
| 7 | 路径可点 | dsh-file-mentions | 回复内路径点击打开 |
| 8 | 消息编辑 | dsh-message-edit | 编辑/reroll/重试 |
| 9 | 文档读取 | dsh-plugin-anydoc | 只读转 GFM，格式最全 |
| 10 | Web 通知 | dsh-session-notification | 完成/失败/提问/审批 |
| 11 | 主题 | dsh-theme-gallery | 15 主题；⚠ 与 oh-dsh 皮肤系统共存待验证（进补丁簿） |
| 12 | CSV 工具 | dsh-tool-csv | 零依赖 agent 能力 |
| 13 | Skill 管理 | dsh-skill-viewer | 用户指定：装、打开 |
| 14 | 视觉工具 | dsh-vision-toolkit | 用户指定：装、打开；配置指引推荐智谱免费多模态（glm-4v-flash，OpenAI 兼容端点），见 build 阶段文档 |
| 15 | 插件说明 | dsh-plugin-description | 用户指定：装、打开 |
| 16 | 桌宠 | dsh-dafeiyu | 用户指定：装、打开（alpha，Windows）；构建期冒烟测试：透明置顶窗口与 Electron 桌面壳共存 |
| 17 | 运行时注入 | dsh-super-injector | 用户指定：必装（BepInEx 式运行时注入，dev_* 工具全家桶；来自 dsh-routing-suite，lib/ 以 DSH_CHECKOUT 构建） |

## 🟡 可选包（默认关，17 个）

dsh-spend · dsh-visualize · dsh-drag-and-drop（跟踪 omdsh-dev 仓）· dsh-focus-chat · dsh-cowork · dsh-turn-rewind · dsh-notify-windows（需补丁簿处理手动 patch 步骤）· modsearch · dsh-sticky-note · dsh-web-attention-badge · dsh-hud · ui-status-label · dsh-skillport · dsh-builtin-toggles · dsh-annotation · dsh-crosstalk · dsh-browser（Chrome 扩展，独立安装）

## ❌ 不选（18 个）

- 计费簇其余 6：balance-meter / opencode-go-usage / deepseek-balance×2 / ds-api-usage / dsh-calculator
- 市场 3：dsh-market（oh-dsh 已内置 marketplace）/ zat-dsh-engine / dsh-webui-market-plugin
- dsh-web-ui 大 monorepo 整体（13 子包；个别子包如 task-board / remote-web-ui 后续可单拎进可选）
- 功能克隆：sticky-disclosure / message-preview / turn-navigator / milestone / turn-index / side-panel / web-panel / file-upload(HongMing) / paste-input / AKIRACOD fork
- 独立 TUI 客户端：MashedPotato817/dsh-tui / openma-ai/deepseek-harness-tui

## 🔀 融合与必装预设（自研层）

- **anchored-standard（用户指定必装，随包 vendor）**：`upstream/dsh-anchored-standard/`，三个变体（Anchored Standard / Zero-Anchored / Whoami），安装 = 拷贝进 `$DSH_HOME/.agent-presets/<id>`；**其测试基线（DSH rc.5 commit 47f9438 + Node 24 Windows）与我们的锁定基线完全一致**，零兼容风险。**绑定 pro 模型**。
- **router-standard（用户指定必装，随包 vendor）**：`upstream/dsh-routing-suite/preset/preset`（dsh-router-standard v0.1.1，思维模式路由预设 spec/react/weak，致谢 anchored-standard），安装 = 拷贝进 `$DSH_HOME/.agent-presets/router-standard`。**绑定 flash 模型**（连同注入器 dsh-super-injector 一起，属 routing-suite 栈）。
- **模型↔预设联动（用户指定，自动切换）**：模型切到 flash → 启用 routing-suite 栈（router-standard 预设 + 注入器）、停用 anchored；切到 pro → 启用 anchored-standard、停用 routing-suite 栈。实现为自研插件 `@dsh-whale/model-preset-link`（T6 范畴）：
  - client 半区监听 `ctx.modelDirectories` 的按会话模型选择，按模型 id 模式（flash/pro 可配置正则）判定族；
  - **blank 会话**：自动调 `agentPresets.select({ sessionId, agentPreset })` 切换预设（DSH 原生支持，`agent-preset/selected` 事件确认）；
  - **已开跑的会话**：DSH 原生锁定预设（seat-store 仅 blank 可改）——只能提示用户新建会话或手动改；
  - host 半区：把当前模型对应的预设写入 agent-presets 默认（`defaultId`），新会话默认正确；注入器的启停随模型族切换。
- **自研预设（T6）**：在 anchored-standard / router-standard 之上继续吸收"梁神"preset 思路，产出 dsh-whale 自己的默认预设。
- **补丁簿（构建阶段逐个打补丁）**：
  1. dsh-notify-windows 的手动 cordis.patch.yml 步骤 → 自动化
  2. theme-gallery × @oh-dsh/skins 共存验证
  3. drag-and-drop 双仓迁移（bill9109 → omdsh-dev）确定跟踪目标
  4. file-uploads / 各插件的 Node 版本与 rc.6 契约对齐
  5. dsh-dafeiyu 与 Electron 桌面壳的冒烟测试（窗口层级/托盘/Host 生命周期）

## 🖥️ 三 UI 与基座（Q11/Q13 决策）

- 基座：**oh-dsh 源码级 fork**（copy 仓库删删改改），非构建时 vendoring
- webui = web profile；gui = Electron 壳（oh-dsh 自带）；tui = dsh-TUI（**oh-dsh 以 `upstream/dsh-TUI` vendored 在 workspace 内，代码即 ccch1mneyyy/dsh-TUI 本体**，外面套 @oh-dsh/tui 适配层——无需替换）
- 版本：锁定基线；升级由整合包发版驱动
