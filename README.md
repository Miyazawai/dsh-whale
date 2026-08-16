<p align="center">
  <strong>简体中文</strong> ·
  <a href="./README.en.md">English</a>
</p>

<div align="center">
  <h1>🐳 dsh-whale（鲸鱼包）</h1>
  <p><strong>DSH 傻瓜整合包 —— 开箱即用的 DeepSeek Harness 发行版外壳。</strong></p>
  <p>核心 17 组件开箱即用，三种界面（webui / gui / tui）一个安装包切换，Windows 小白双击即用。</p>
</div>

<p align="center">
  <img alt="Desktop | Web | TUI" src="https://img.shields.io/badge/Desktop%20%7C%20Web%20%7C%20TUI-3b82f6?style=flat-square">
  <img alt="Windows first" src="https://img.shields.io/badge/Windows%20First-111827?style=flat-square">
  <img alt="Everything is a plugin" src="https://img.shields.io/badge/一切皆插件-34a853?style=flat-square">
</p>

<p align="center">
  <a href="https://github.com/Miyazawai/dsh-whale/releases/latest"><strong>下载最新版</strong></a>
  ·
  <a href="./docs/selection.md">选品清单</a>
  ·
  <a href="./docs/adr/0001-distribution-shell-on-oh-dsh.md">架构决策</a>
</p>

---

以 [Oh-DSH](https://github.com/hust-open-atom-club/oh-dsh) 发行层为**基座**（一次性源码级 fork，独立演进）。把社区插件**精选、去重、兼容性修复**后打包成一个发行版，**"核心包"只是默认组合**——遵循 DSH"一切皆插件"哲学，**所有组件都可随时插入与拆除**。

## ✨ 特色

- **三界面一包**：webui（浏览器）/ gui（Electron 桌面壳）/ tui（终端，dsh-TUI），共享同一份会话与配置，启动时自选
- **核心 17 组件开箱即用**：每功能一实现（功能唯一性 > 资源开销 > 包体积）
- **模型↔预设联动**：换 flash 模型自动启用思维路由（Router Standard），换 pro 自动启用锚定式预设（Anchored Standard）——设置页一键开关，想关就关
- **可插拔**：任何插件可用官方 `dsh plugin` 机制移除；可选 17 组件默认关闭、一键开启
- **自带运行时**：无需安装 Node/pnpm，自带固定版本 DSH runtime

## 🚀 快速开始

1. 从 [Releases](https://github.com/Miyazawai/dsh-whale/releases/latest) 下载 **`dsh-whale Setup x.x.x.exe`**（Windows 安装包，约 94MB，自带 Node/DSH runtime，无需预装任何环境）
2. 双击安装 → 桌面出现 **dsh-whale（鲸鱼包）** 快捷方式
3. 启动后三选一：
   - **GUI**：双击桌面图标（Electron 窗口）
   - **Web**：安装目录下运行 `bin\ohdsh web`（或 GUI 内操作）
   - **TUI**：在终端运行 `bin\ohdsh tui`

> 核心 17 组件开箱即用；可选组件在设置页一键开启；模型↔预设联动默认开启（换 flash/pro 自动切换路由/锚定预设），可在设置关闭。

## 🔒 与已有 DSH 共存（完全隔离）

鲸鱼包是**独立的 DSH 实例**，与你已装的 dsh 零冲突，可同时运行：

| 项 | 你现有的 dsh | 鲸鱼包 |
|---|---|---|
| 程序 | 系统安装/npx 的 dsh | 安装目录内置拷贝（自带 Node runtime） |
| 数据目录 | `~/.dsh` | `%APPDATA%\dsh-whale\dsh-home` |
| 端口 | 默认 3080 | 随机空闲端口（永不撞车） |
| 插件/预设 | 你的 profile | 自己的 profile + 内置 4 预设 |
| 卸载 | 不受影响 | 只删自己的目录 |

⚠️ 注意：
- 鲸鱼包**不共享** `~/.dsh` 的 API Key / 会话 / 凭据——首次使用需在鲸鱼包内重新配置一次 DeepSeek API Key（隔离的代价，也是不碰你现有数据的保证）。
- 请通过桌面图标/安装器启动；若在安装目录手动敲 `dsh` 命令，记得设 `DSH_HOME`（否则会回落到 `~/.dsh`）。

## 📦 核心组件（默认启用，17 个）

| 功能 | 插件 | 来源 |
|---|---|---|
| 费用/计费 | dsh-cost-meter | [Han-1413141/dsh-cost-meter](https://github.com/Han-1413141/dsh-cost-meter) |
| 生成式 UI | dsh-genui | [omdsh-dev/dsh-genui](https://github.com/omdsh-dev/dsh-genui) |
| 文件引用 | dsh-at-file | [omdsh-dev/dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) |
| 文件上传 | dsh-file-uploads | [l541402398/dsh-file-uploads](https://github.com/l541402398/dsh-file-uploads) |
| 会话折叠 | dsh-web-archive | [renat3u/dsh-web-archive](https://github.com/renat3u/dsh-web-archive) |
| 导航条 | dsh-navbar | [vlln/dsh-navbar](https://github.com/vlln/dsh-navbar) |
| 路径可点 | dsh-file-mentions | [a903067276-rgb/dsh-file-mentions](https://github.com/a903067276-rgb/dsh-file-mentions) |
| 消息编辑 | dsh-message-edit | [Moeblack/dsh-message-edit](https://github.com/Moeblack/dsh-message-edit) |
| 文档读取 | dsh-plugin-anydoc | [beancookie/dsh-plugin-anydoc](https://github.com/beancookie/dsh-plugin-anydoc) |
| Web 通知 | dsh-session-notification | [dingyi222666/dsh-session-notification](https://github.com/dingyi222666/dsh-session-notification) |
| 主题 | dsh-theme-gallery | [wsxwj123/dsh-plugins](https://github.com/wsxwj123/dsh-plugins)（theme-gallery 子包） |
| CSV 工具 | dsh-tool-csv | [omdsh-dev/dsh-tool-csv](https://github.com/omdsh-dev/dsh-tool-csv) |
| Skill 管理 | dsh-skill-viewer | [Fishquito7/dsh-skill-viewer](https://github.com/Fishquito7/dsh-skill-viewer) |
| 视觉工具 | dsh-vision-toolkit | [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) |
| 插件说明 | dsh-plugin-description | [MysaDC/dsh-plugin-description](https://github.com/MysaDC/dsh-plugin-description) |
| 桌宠 | dsh-dafeiyu | [QCYTSN/dsh-dafeiyu](https://github.com/QCYTSN/dsh-dafeiyu) |
| 运行时注入 | dsh-super-injector | [yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite)（dsh-super-injector） |

## 🎛️ 预设（随包安装，模型联动）

| 预设 | 绑定模型 | 来源 |
|---|---|---|
| Anchored Standard（含 Zero-Anchored / Whoami 变体） | pro | [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard) |
| Router Standard | flash | [yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite)（dsh-router-standard） |

## 🧩 可选组件（默认关闭，一键开启）

| 功能 | 插件 | 来源 |
|---|---|---|
| 多维仪表盘 | dsh-spend | [nonewind/dsh-spend](https://github.com/nonewind/dsh-spend) |
| 自由 HTML 卡片 | dsh-visualize | [Nagi-ovo/dsh-visualize](https://github.com/Nagi-ovo/dsh-visualize) |
| 拖拽真实路径 | dsh-drag-and-drop | [omdsh-dev/dsh-drag-and-drop](https://github.com/omdsh-dev/dsh-drag-and-drop) |
| 摘要 tab | dsh-focus-chat | [dingyi222666/dsh-focus-chat](https://github.com/dingyi222666/dsh-focus-chat) |
| 文档写/MCP | dsh-cowork | [Jesse-njx/dsh-cowork](https://github.com/Jesse-njx/dsh-cowork) |
| 工作区回滚 | dsh-turn-rewind | [Anionex/dsh-turn-rewind](https://github.com/Anionex/dsh-turn-rewind) |
| Windows 通知 | dsh-notify-windows | [SeverusZh/dsh-notify-windows](https://github.com/SeverusZh/dsh-notify-windows) |
| 多引擎搜索 | modsearch | [liustack/modsearch](https://github.com/liustack/modsearch) |
| 便签 | dsh-sticky-note | [Meredith2328/dsh-sticky-note](https://github.com/Meredith2328/dsh-sticky-note) |
| 注意力徽章 | dsh-web-attention-badge | [Luaphes/dsh-web-attention-badge](https://github.com/Luaphes/dsh-web-attention-badge) |
| HUD 状态面板 | dsh-hud | [a903067276-rgb/dsh-hud](https://github.com/a903067276-rgb/dsh-hud) |
| 状态文案 | ui-status-label | [alingalingling/ui-status-label](https://github.com/alingalingling/ui-status-label) |
| 技能导入 | dsh-skillport | [Jesse-njx/dsh-skillport](https://github.com/Jesse-njx/dsh-skillport) |
| 内置开关 | dsh-builtin-toggles | [Starfie1d1272/dsh-builtin-toggles](https://github.com/Starfie1d1272/dsh-builtin-toggles) |
| 批注 | dsh-annotation | [omdsh-dev/dsh-annotation](https://github.com/omdsh-dev/dsh-annotation) |
| 跨会话消息 | dsh-crosstalk | [Jesse-njx/dsh-crosstalk](https://github.com/Jesse-njx/dsh-crosstalk) |
| 浏览器操控 | dsh-browser（Chrome 扩展，独立安装） | [Lum1104/dsh-browser](https://github.com/Lum1104/dsh-browser) |

## 🙏 致谢

本项目是**社区生态的组合产物**，站在以下项目的肩膀上（均为开源）：

- **[hust-open-atom-club/oh-dsh](https://github.com/hust-open-atom-club/oh-dsh)** —— 发行层基座（三形态统一、Pinned runtime、分层分发）
- **[ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI)** —— 终端界面（TUI）
- **[omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)** —— 侧边栏工作台（PTY/文件/Git）
- **[xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard)** —— 锚定式预设（pro 模型绑定）
- **[yjh051108/dsh-routing-suite](https://github.com/yjh051108/dsh-routing-suite)** —— 思维路由预设 + 超级注入器（flash 模型绑定）
- 以及上表中全部核心/可选组件仓库与 [awesome-dsh-plugin](https://awesome-dsh-plugin.com) 生态

## 🔗 相关

- 选品清单：`docs/selection.md` ｜ 架构决策：`docs/adr/0001` ｜ 调研底稿：`docs/overlap-map.md`
- 术语表：`CONTEXT.md` ｜ 补丁簿：`docs/patch-book.md` ｜ 调研档案：`research/`、`research_output/`
