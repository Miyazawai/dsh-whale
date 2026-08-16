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

## ⑥ 桌面壳发布态 DSH 内核缺失依赖 — ✅（v0.1.3，T0 用户实测发现）

- **事实**：`extraResources` 之前只拷 `node_modules/@deepseek-ai/dsh` **包本体**（`lib/`+`config/`，0.4MB），不带其 60+ 依赖。发布态 `resources/dsh-cli` 是孤立目录，`lib/bin.js` 的 ESM `import '@deepseek-ai/dsh-app-boot'` 向上解析不到 node_modules → `ERR_MODULE_NOT_FOUND` → CLI 秒退 exit 1 → 窗口永不创建（main.js 只在收到 `dsh web: http://...` 后才开窗）→ 用户双击"没反应"，且 `spawnDsh` 每 2s 无限重启。
- **连带 bug**：
  1. `installCorePlugins` 的 `add()` 无条件 `resolve()` 不检查 exit code → 17 个 `plugin add` 全静默失败却照写 marker 假成功；
  2. 插件安装不与 CLI 启动同步（fire-and-forget）→ 竞态；
  3. link 源插件（`dsh-super-injector`、`dsh-theme-gallery`）peer 依赖（`@deepseek-ai/dsh-tools`、裸 `schemastery`/`cordis`）解析链 `resources/upstream/**` 上没有 node_modules；且 electron-builder 对 extraResources 里的 node_modules 按 `dependencies` 字段裁剪删空；
  4. 发布态 GUI 无控制台，`console.log` 全部丢失 → 故障无迹可查。
- **方案（v0.1.3 已落地并全链路验证）**：
  1. `scripts/build-desktop-runtime.mjs`：在 `desktop/.runtime/dsh-cli` 做完整 `npm install @deepseek-ai/dsh@0.1.0-rc.6 --omit=dev`（528 包）+ 补装裸 `schemastery@^3.18.0`、`cordis`；
  2. `desktop/after-pack.cjs`：打包后整体 `cpSync` runtime 进 `resources/dsh-cli`（绕过 electron-builder 的 node_modules 裁剪），并 `mklink /J resources\node_modules -> resources\dsh-cli\node_modules` 供 link 源插件 peer 解析（NSIS 打包后 junction 被 7z 跟随复制为真实目录，功能不受影响）；
  3. `add()` 检查 exit code，marker 改为 JSON `{version, ok:[ids]}` 幂等记录——失败插件下次自动重试；
  4. `spawnDsh` 改为 async：先 `await installCorePlugins` 再启 CLI；加 splash 窗口（首次运行提示下载）；CLI 连续 3 次启动失败弹错误框并退出（不再无限重启）；
  5. CLI 子进程输出与主进程日志统一落 `$DSH_HOME/dsh-whale.log`；
  6. `desktop/package.json` 加 `npmRebuild: false`（runtime 自带 prebuilds，避免 electron-builder 触发 node-gyp Spectre 失败）。
- **验收（已完成）**：手动跑修复后 CLI 打印 `dsh web: http://127.0.0.1:端口`；静默安装全新目录 + 全新 DSH_HOME 首启 → 18/18 插件 ✓、`dsh web:` 行出现、renderer 进程存在、HTTP 200 + `__DSH_BOOT__`。

---

## 基线锁定备忘

- 基座：oh-dsh `@4a183a3`（git 历史已保留在 `upstream` remote，push 已禁用）。
- DSH：`dsh-source.json` 钉 `47f9438`（rc.5），构建走 `.cache/dsh-source/<rev12>/` 源码构建。
- 升级：由整合包发版驱动（ADR-0001），上游更新不自动合并。
