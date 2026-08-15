# 补丁簿（兼容性修复清单）

> 原则（ADR-0001 / Q6）：小问题打补丁、大改动才 fork；每处改动可追溯。
> 状态图例：🔲 待处理 / 🔧 处理中 / ✅ 已解决 / ⚠️ 阻塞中

## ① dsh-notify-windows 手动 patch 步骤自动化 — 🔲（T5）

- **事实**：npm 装完后需**手动**在 profile 的 `cordis.patch.yml` 追加 insert 条目（热监视生效），或跑 `scripts\install-profile.ps1`——对小白是额外一步。
- **方案**：在我们的发行层组合里内置该 insert 行（构建期自动注入），用户安装即生效。
- **验收**：安装后无需任何手动编辑，Windows toast 通知可用。

## ② theme-gallery × @oh-dsh/skins 共存验证 — 🔲（T4）

- **事实**：oh-dsh `@oh-dsh/skins` 是三端唯一皮肤定义模块（Web/Desktop 适配 CSS token，TUI 适配 `/theme` 调色板，统一写 `skins.json`）；dsh-theme-gallery 走 DSH 原生 `--dsw-*` 主题 token 设置面。二者可能共享"外观"设置区，需验证互不覆盖、互不冲突。
- **方案**：T4 集成时同时启用两者，冒烟断言主题切换不回退皮肤、皮肤切换不回退主题。
- **验收**：15 主题可选且与 oh-dsh 皮肤系统并存。

## ③ drag-and-drop 双仓定源 — 🔲（T5）

- **事实**：`bill9109/dsh-drag-and-drop`（08-06 创建，README 带未解决合并冲突标记 `<<<<<<< HEAD`）与 `omdsh-dev/dsh-drag-and-drop`（08-14 创建，README 徽章/安装命令/issue 链接全指向 org 仓）双仓并存、互非 fork，疑似已迁 org。
- **方案**：跟踪源定为 **omdsh-dev/dsh-drag-and-drop**；集成时从 org 仓取包。
- **验收**：选品清单与安装来源一致指向 org 仓。

## ④ Node / rc.6 契约对齐 — 🔲（T2~T5 全程）

- **事实**：基线 DSH = git `47f9438`（dsh-source.json 标 0.1.0-rc.5）；16 个核心插件 peer 多为 `@deepseek-ai/*@0.1.0-rc.6`；**rc.6 仅存在于 npm，不在公开 git 仓库**（git master HEAD 即 47f9438）。
- **策略**（Q17 决策 a）：先按 rc.5 实证跑通基线；插件集成时逐个核对契约差异，能对齐的逐个 patch；若大面积冲突 → 重新评估升基线（走 npm rc.6 改造）。
- **已知点**：dsh-file-uploads 明确要求 rc.6 + Node 22+（基座自带 Node 24 runtime，Node 侧无忧）；cost-meter 运行时依赖 zod/dsh-home-paths/dsh-credentials 纯函数。

## ⑤ dsh-dafeiyu 与 Electron 桌面壳共存 — 🔲（T4）

- **事实**：alpha `0.1.0-alpha.6`；透明无边框置顶原生窗口 + PyInstaller 打包的 Windows Helper；安装/更新/卸载均需先退出 DSH Host；设置卡复用 DSH 本地 Web 服务、不开新端口。
- **方案**：T4 集成后在 desktop 形态冒烟——窗口层级、托盘共存、跟随 Host 启停。
- **验收**：桌面壳运行时桌宠正常显示与退出。

---

## 基线锁定备忘

- 基座：oh-dsh `@4a183a3`（git 历史已保留在 `upstream` remote，push 已禁用）。
- DSH：`dsh-source.json` 钉 `47f9438`（rc.5），构建走 `.cache/dsh-source/<rev12>/` 源码构建。
- 升级：由整合包发版驱动（ADR-0001），上游更新不自动合并。
