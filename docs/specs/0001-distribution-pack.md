# Spec 0001 — dsh-whale：开箱即用的 DSH 傻瓜整合包

> 状态：ready-for-agent。由 grill-with-docs 设计树（Q1~Q16）+ 四簇调研（50 仓）+ ADR-0001 合成。

## Problem Statement

社区 DSH 插件生态在一周内爆发（2026-08-06~14），49+ 仓库功能重叠严重：余额/计费类 8 个、插件市场 3 个、导航条 6+ 个、文档读取 2 个、侧边栏 3 个。用户拿到这些插件要自己：装 Node、逐仓安装、处理相互冲突、解决兼容性问题——对小白毫无"开箱即用"可言。而 webui / gui / tui 三种界面分散在 oh-dsh、dsh-desktop、dsh-TUI 等多个项目里，没有统一体验。

## Solution

**dsh-whale（鲸鱼包）**——一个"傻瓜整合包"发行版外壳：以 oh-dsh 发行层为**基座**（一次性源码级 fork，独立演进），内置 **16 个核心插件**（每功能一实现）、**17 个可选插件**（默认关、一键开）、**补丁簿**承载兼容性修复、**锚定式两阶段预设**、三界面（webui/gui/tui）共享同一份数据与配置，Windows 小白装一个包即可开箱即用。

## User Stories

1. 作为小白用户，我想双击一个安装包完成安装，以便不碰命令行就能用上 DSH。
2. 作为小白用户，我想安装后从启动器选择 webui/gui/tui 三种界面，以便按场景切换。
3. 作为小白用户，我想用 GUI（Electron 桌面壳）使用 DSH，以便像普通桌面软件一样操作。
4. 作为小白用户，我想在终端里启动 TUI，以便在纯终端/SSH 环境使用。
5. 作为小白用户，我想三个界面共享同一份会话与配置，以便切换界面不丢上下文。
6. 作为小白用户，我想看到余额、会话花费与预算条，以便知道花了多少钱。
7. 作为小白用户，我想模型在对话里生成卡片/图表/表单等交互 UI，以便用更直观的方式交互。
8. 作为小白用户，我想用 @ 引用工作区文件，以便把文件路径带进对话。
9. 作为小白用户，我想上传任意本地文件，以便让模型读取工作区外的文件。
10. 作为小白用户，我想把工具卡和思考块折叠成小卡片，以便阅读对话不被刷屏。
11. 作为小白用户，我想编辑/重掷/重试消息，以便纠正对话方向。
12. 作为小白用户，我想直接把 PDF/Word/Excel/PPT 丢给模型读，以便分析文档。
13. 作为小白用户，我想会话完成或需要我时收到通知，以便不错过。
14. 作为小白用户，我想在 15 款主题间切换，以便界面合口味。
15. 作为小白用户，我想在 Web 界面里管理技能（启用/停用/迁移），以便控制模型能力。
16. 作为小白用户，我想按指引配置视觉工具（推荐智谱免费多模态），以便让模型"看图"。
17. 作为小白用户，我想看到插件卡片的中文/英文说明，以便知道每个插件是干什么的。
18. 作为小白用户，我想桌面上有大肥鱼桌宠跟随工作状态变化，以便有陪伴感。
19. 作为老手用户，我想在可选包里按需开启更多插件（拖拽真实路径/文档写/会话回滚/系统通知/多引擎搜索等），以便扩展能力而不污染默认体验。
20. 作为小白用户，我想整合包自带运行时且自动更新，以便永远不用自己升级 DSH/Node。
21. 作为维护者，我想在装完 16 个核心插件后冒烟测试保证三种 UI 都能干净启动，以便放心发版。
22. 作为维护者，我想补丁簿逐项记录兼容性修复，以便每处改动可追溯。
23. 作为模型，我想按锚定式两阶段预设工作（首轮精简工具锚点、随后暴露完整工具目录），以便首轮轨迹更准确。
24. 作为小白用户，我想许可风险由整合包兜底（宽松政策、侵删处理），以便无心理负担地使用。

## Implementation Decisions

- **基座与演进**（ADR-0001）：基座 = oh-dsh 发行层（三形态统一、Pinned DSH runtime、分层分发），实现为一次性源码级 fork（copy 后删删改改），**不合上游**；上游历史保留在 `upstream` remote 供溯源。
- **版本策略**：锁定基线（当前基线 oh-dsh `@4a183a3`，对应 DSH 0.1.0-rc.6 线）；升级完全由整合包发版驱动。
- **三界面**：webui = web profile；gui = Electron 壳（oh-dsh 自带 `@oh-dsh/desktop`）；tui = dsh-TUI（已 vendored 于 `upstream/dsh-TUI` + `@oh-dsh/tui` 适配层）——三端共享 `~/.ohdsh` 数据目录，独立 Profile 隔离组合。
- **插件集成**：核心 16 + 可选 17，全部以 bundle 层挂载（`dsh.bundle` / `cordis.patch.yml` 单行 insert），保持"零核心改动"。清单见 `docs/selection.md`。
- **补丁簿**（5 项，构建期逐个处理）：① dsh-notify-windows 手动 patch 步骤自动化；② theme-gallery × `@oh-dsh/skins` 共存验证；③ drag-and-drop 双仓（bill9109 → omdsh-dev）确定跟踪源；④ 各插件 Node 版本与 rc.6 契约对齐；⑤ dsh-dafeiyu 透明置顶窗口与 Electron 桌面壳的冒烟验证。
- **预设**：锚定式两阶段预设（吸收 xiaobright/anchored-standard 与"梁神"preset 的思路），作为默认会话预设。
- **视觉指引**：vision-toolkit 配置指引文档，推荐智谱免费多模态（glm-4v-flash，OpenAI 兼容端点）作为远程视觉 API。
- **许可政策**（ADR-0001）：宽松——许可状态不作为选品门槛；出现侵权投诉按"侵删"处理。
- **品牌**：dsh-whale / 鲸鱼包；仓库 `Miyazawai/dsh-whale`。

## Testing Decisions

- **单一主缝**：扩展 oh-dsh 现有冒烟脚本（`scripts/smoke-runtime.mjs` / `smoke-web.mjs`，即 `smoke:*` 命令）为"整合包冒烟"——断言：① 16 个核心插件全部加载成功、无 slot 重复占用、无 patch 冲突；② web profile 启动就绪；③ tui profile 启动就绪；④ desktop 壳（Electron）启动就绪。
- **只测外部行为**：冒烟验证"启动干净"，不验证插件内部功能（上游各自负责）。
- **不新建第二道缝**：预设设计用 DSH 官方组合行做构建产物检查；补丁簿项 ②③④⑤ 的验证都汇入主缝。
- **先例**：oh-dsh 自带 `check:plugins` / `smoke:runtime` / `smoke:web` / `smoke:app` 脚本可直接扩展复用。

## Out of Scope

- 不合并上游更新（硬 fork 冻结，ADR-0001）。
- 不维护各插件上游功能缺陷（补丁簿按需处理，不重写上游）。
- 不集成独立 TUI 客户端（MashedPotato817/dsh-tui、openma-ai/deepseek-harness-tui）。
- 不整体集成 dsh-web-ui monorepo（13 子包，与去重哲学冲突）。
- 不把 macOS/Linux 作为一等公民（Windows 小白为主，其余二等支持）。
- 不做插件市场（oh-dsh 已内置 marketplace，dsh-market 已从选品移除）。

## Further Notes

- 生态风险：全部插件诞生于 2026-08 一周内，质量以 copy 时点为准，自担修复。
- 调研档案：`research/`、`research_output/`（四簇报告 + 原始 README）。
- 选品依据：`docs/overlap-map.md`（15 功能簇重叠地图）、`docs/selection.md`（终版清单）。
- 领域术语：`CONTEXT.md`；架构决策：`docs/adr/0001`。
