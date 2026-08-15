# DSH 傻瓜整合包 · 发行版/桌面应用类仓库事实调查报告

> 调查对象：11 个与"发行版/桌面应用"相关的 DSH 社区仓库。
> 数据来源：全部 11 个仓库的 README（`raw.githubusercontent.com/OWNER/REPO/HEAD/README.md`）与 GitHub API 元数据均抓取成功，**无"仅凭搜索摘要"条目**；另抓取了 oh-dsh 官方 `docs/design.md`。仅"DSH 官方上游仓库地址"一处用 web_search 确认（GitHub API 对该仓库限流）。
> 元数据快照时间：2026-08-15（push 日期以此为基准判断活跃度）。全部仓库处于活跃期，无 archived。

---

## 1. hust-open-atom-club/oh-dsh

- **一句话用途**：一站式 DeepSeek Harness 社区发行版——用同一套 DSH runtime 提供 Desktop、Web、TUI 三种形态的统一体验，支持分层安装（完整版 / Web-only / TUI-only）。
- **类型**：独立发行版（"发行层"，非 DSH 内核 fork）。
- **架构**（据 README + `docs/design.md`）：
  - 核心是 **Pinned DSH runtime（固定版本 DSH）**，三种形态共用同一 runtime：`ohdsh` CLI 只负责选择交互形态（`ohdsh desktop|web|tui`），运行时能力继续由 DSH Profile + Loader 管理，**不引入第二套插件系统**。
  - Desktop = Electron + Web runtime；Web = HTTP + Web runtime；TUI = dsh-TUI renderer。三端共享会话、凭据、皮肤与插件缓存，但用独立 Profile 隔离组合。
  - **与官方 DSH 的关系：不是 fork 上游改内核，是"上游固定版本 + 自研/下游适配插件"**。设计文档明确：复用 DSH 的 Profile、Loader、locale、settings、ThemeService；"上游能力按 feature 同步，不直接覆盖 Oh-DSH 的 UI 与主题"；"上游代码、Oh-DSH UI 和最终权限边界不会混为一层"。源码构建流程（`git submodule update --init --recursive` + `pnpm run build:dsh` + `stage:dsh`）表明 DSH 以 submodule 形式 vendored 打包发行，属于打包行为而非补丁核心。
  - 上游依赖表：DeepSeek Harness（runtime/会话/插件加载器）、**dsh-TUI（Oh-DSH TUI 的直接上游插件）**、DSH-better-sidebar（Git Review/文件/PTY Host）。
  - 内置插件体系：`@oh-dsh/desktop`（自研入口/窗口/bridge）、`@oh-dsh/skins`（三端唯一皮肤定义模块，同一皮肤 ID 分别适配 Web/Desktop 的 CSS token 与 TUI 的 `/theme` 调色板）、`@oh-dsh/plugin-marketplace`（隔离预览、风险确认、TOFU 来源锁、失败恢复的插件安装事务）、`dsh-cc-tui` + `@oh-dsh/tui`（TUI 下游适配）等。
  - **安装方式**：GitHub Releases 分发。macOS 用 DMG 拖入 Applications；Windows 安装包或便携版；Linux AppImage 或 deb（apt）。Web-only / TUI-only 解压即用，`./bin/ohdsh web|tui`；Windows 用 `bin\ohdsh.cmd`。macOS 完整版可把应用内启动器软链进 `PATH`。
  - **数据目录**：三端默认共用 `~/.ohdsh`；`OH_DSH_HOME` 统一更换；Web/TUI 的 `--data` 只覆盖当前进程。
- **依赖**：发行包自带固定版本 DSH 与 Node runtime（"不要求单独安装运行环境"）；从源码构建需 Node.js、pnpm 与平台构建工具。运行时依赖不重（自带）。
- **健康度**：⭐184、fork 13、open issues 11；最近 push 2026-08-15；MIT；活跃（创建于 2026-08-11，发布 v 徽章指向 latest release）。
- **DSH 兼容性**：自带固定版本 DSH runtime，版本随上游同步（README 未写死具体版本号）；不做内核补丁。
- **与"三 UI 整合包"的关系**：该仓库本身就是一个"webui + gui + tui 三形态、分层安装、自带 runtime"的发行版，与整合包目标同构，形态上可直接作为基座候选（事实陈述，不做推荐）。其 TUI 层直接复用 3 号仓库 dsh-TUI。

---

## 2. foolgry/dsh-desktop

- **一句话用途**：下载即用的 DSH 桌面版——Electron 壳内置 Node 运行时与官方 dsh 包，无需装 Node/npm/终端。
- **类型**：桌面应用壳（Electron shell + 打包脚本，明确自述"非官方构建"）。
- **架构**：**只包一层 webui**。打包 Electron 自带的 Node runtime + 官方 `@deepseek-ai/dsh` npm 包；启动时在回环地址跑 `dsh web`（默认 127.0.0.1:3080，被占自动试 3081、3082…），原生窗口加载该界面。关窗口不退出（× 最小化到托盘，任务后台继续），托盘菜单 "Quit" 才彻底退出。**不在系统装任何东西**。
  - **发布渠道**：GitHub Releases（macOS：dmg + zip，arm64，未签名需 `xattr -cr` 绕过；Windows：nsis setup.exe，SmartScreen 需"仍要运行"）。
  - **自动更新**：应用每 4 小时检查一次更新；Windows 自动安装，macOS（未签名）弹窗给下载链接。另有 GitHub Actions `sync-and-release.yml` 每天 09:00/13:00/17:00（北京时间）检查 npm 上新版 `@deepseek-ai/dsh`，有新版就更新依赖、打 tag、构建并发布到 Releases。
  - **数据目录**：系统应用数据目录（Electron userData，不污染用户目录），日志在 `logs/dsh.log`。
  - 版本号追踪上游：`0.1.0-rc.6.6` = 基于上游 `0.1.0-rc.6` 的第 6 个桌面构建。
- **依赖**：仅 Electron + `@deepseek-ai/dsh`（用户侧零依赖）；开发侧需 Node `^22.19 || >=24`、pnpm、just。
- **健康度**：⭐7、fork 1；最近 push 2026-08-15；API 未检测到 LICENSE 文件（README 声明壳代码 MIT、DSH 本体 MIT）；活跃。
- **DSH 兼容性**：打包官方 npm 发布包（非 fork 非补丁），版本号跟随上游自动同步。
- **与"三 UI 整合包"的关系**：只解决"桌面端 = Electron 包 webui"这一种形态，不含 TUI；可作为整合包桌面壳组件的现成实现或参考（事实陈述）。

---

## 3. ccch1mneyyy/dsh-TUI

- **一句话用途**：Claude Code 风格的 DSH 终端界面插件——像素鲸鱼顶栏、流式渲染、工作状态行、上下文进度条 + TPS 仪表、完整会话工作流。
- **类型**：**DSH 插件（TUI 前端）**，不是独立可执行文件。被 DeepSeek Harness 官方公众号收录为"内测用户精选插件"。
- **架构 / 怎么和 DSH 通信**：
  - **是 TUI 前端，但以"挂进 DSH profile 的 Cordis 插件"形态存在**，官方定位"零核心改动，纯插件挂载"。工作链路：`dsh profile → dsh-base → dsh-TUI Cordis patch → Agent preset + DSH services → session/event → Channel projection → React components → ported Ink/Yoga renderer → terminal`。
  - **通信是进程内的**：它运行在 DSH 进程里，通过 DSH 的 `session/event` 事件流驱动增量差分渲染（不是外部进程通过 HTTP/WS 连 DSH）。"TUI 只负责交互与呈现，会话日志是对话真源，模型调用、工具执行、fork/resume、compaction 与持久化继续由 DSH 服务拥有"。
  - `dsh-tui` 命令是 npm 全局安装后自带的**直达启动器**（等价 `dsh --profile dsh-tui`）；首次运行自动初始化 profile（需 pnpm 10+）。Windows 另有 `dsh-tui.cmd`。旧版 `dsh-cc-tui` / `cc-tui` profile 有迁移路径。
  - 后台自动查 npm 新版，`/update` 自动更新并重启恢复当前会话。
  - 数据：`~/.dsh-cc/`（agent-preset.json、model.json、themes）；MCP 经 `@deepseek-ai/dsh-mcp-client` 挂载。
- **依赖**：官方 `dsh` CLI、pnpm 10+、可用 TTY、`DEEPSEEK_API_KEY`；npm 包 `@deepseek-harness-tui/dsh-tui`。Windows 下 Ctrl+V 依赖 PowerShell `Get-Clipboard`。
- **健康度**：⭐1135、fork 50、open issues 38；最近 push 2026-08-15；MIT；**public beta，极活跃**（创建于 2026-08-13，两天内 1135 star）。
- **DSH 兼容性**：纯插件、无核心补丁；README 未写死最低 DSH 版本，安装命令为 `dsh plugin --profile dsh-tui add`。
- **与"三 UI 整合包"的关系**：是 TUI 形态的核心组件（三 UI 之 TUI 层），可被整合包直接复用为终端前端；oh-dsh 已把它作为 TUI 直接上游插件固定跟踪。

---

## 4. dsh-market/dsh-market

- **一句话用途**：装在 DSH 里的官方社区插件市场——Settings → Plugin Market 浏览/搜索/一键安装，含主题标签页。
- **类型**：DSH 插件（npm 包名 `dshmarket`）。
- **架构 / 数据源**：**这个仓库是"市场应用"本身，不是目录**。插件清单来自 curated 注册表 [awesome-dsh-plugin](https://awesome-dsh-plugin.com) 的 `plugins.json`（CI 每天刷新 star 数与 npm 映射），内置离线快照兜底。安装机制：**偏好 npm tarball 而非整仓库 GitHub 下载**（registry 与仓库交叉校验防名字抢注），GitHub-only 插件依赖网络。
  - 安装：`dsh plugin --profile web add dshmarket`，重启 `dsh web`。
  - 功能：300+ 插件浏览/搜索/分类/排序（中英双语描述随 UI 语言）、主题一键安装即切换（互斥、重启保留）、逐插件更新检查（npm 版本或 pinned commit vs HEAD）、一键全量更新、两步确认卸载、需重启的变更给一键重启按钮（重启端点要求直接 loopback 客户端，且按原入口/参数/环境/工作目录重启；systemd/launchd/pm2 托管时设 `allowRestart: false`）、缺 pnpm 时一键自动配置、一键脱敏日志导出。
  - 安全：安装只接受 awesome-dsh-plugin curated registry 收录来源；build scripts 默认阻止（pnpm ≥10），放行需逐包显式选择；装进 web profile 的 terminal/CLI 插件会先标记；安装端点仅接受 same-origin POST；"never phones home"。
- **依赖**：dsh CLI + 网络（npm/GitHub）；无外部服务。
- **健康度**：⭐205、fork 17、open issues 13；最近 push 2026-08-15；MIT；活跃。
- **DSH 兼容性**：未声明特定 DSH 版本；README 自述由 awesome-dsh-plugin.com 维护者开发（生态内"官方"定位）。
- **与"三 UI 整合包"的关系**：webui 内的开箱即用生态组件（插件安装入口），属整合包可预装的功能层，不是基座。

---

## 5. Sanqi-normal/dsh-webui-market-plugin

- **一句话用途**：社区独立实现的 Web GUI 插件市场——设置 → 插件 → 插件市场 里浏览 awesome-dsh-plugin 目录并安装/卸载插件。
- **类型**：DSH 插件。
- **架构 / 与 4 号差异（README 自述比对）**：
  - **README 自己声明：本插件是社区独立实现，"推荐优先使用官方 dsh-market"（由 awesome-dsh-plugin.com 维护者开发，功能一致、维护更活跃）**。
  - **数据源相同**：官方 `plugins.json` JSON API（含 stars/added），回退链"过期缓存 → 内置离线快照"，与官方 dsh-market 同源同策略。
  - **安装机制**：npm `@sanqi-normal/dsh-webui-market-plugin`（推荐，无 git 克隆/prepare 步骤）或 GitHub 源；装后重启 web 生效；GitHub 源 prepare 脚本如被 pnpm 拦截需加入 `allowBuilds`。
  - **额外能力（相对 4 号）**：FIFO 任务队列面板（右下角常驻，排队/校验/执行/完成/失败/终止/超时，120 秒超时，可看每个任务的 pnpm 日志，一键更新全部）；**停用/启用**（保留依赖与磁盘文件，只移出激活 bundle 层，状态持久化到 `dsh.market.disabled`）；**本机插件列表**（含市场之外安装的插件，标注目录内/外、来源类型）；已安装状态按 owner/repo 精确同步（同名插件不误标）；**热挂载**（纯 id/name 插入行的 patch 直接挂进运行中组合并自动刷新页面，无需重启）；**试装验证（trial boot）**（临时 DSH_HOME 里按 web profile 重建组合实际启动一次，只有出现 `dsh web:` 就绪行才判定可装，失败给真实启动错误且不写真实 profile）；安装前自动快照备份（`.mkts-snapshot-<时间戳>.json`）；pnpm ≥11 的 minimumReleaseAge 违规自动合并排除并重试。
  - 安全：与 4 号一致的 curated registry 白名单（目录抓取失败或 registry/link 源不限制）、同源 POST 校验；写操作 403 跨源。
  - Host 半注册 `/api/dsh-market` 路由（list/probe/installed/install/update/uninstall/disable/enable/op/kill，队列头执行白名单+试装，后台 spawn `dsh plugin` CLI）；Client 半注册到 `settings.plugins.tab` 槽位。
- **依赖**：dsh CLI + 网络；无外部服务。
- **健康度**：⭐37、fork 2、open issues 1；最近 push 2026-08-15；MIT；活跃但规模小于 4 号。
- **DSH 兼容性**：未声明特定 DSH 版本。
- **与"三 UI 整合包"的关系**：与 4 号同属 webui 内插件安装入口（功能层组件）；两者并存时功能重叠，README 自认官方 4 号更优（事实陈述）。

---

## 6. liustack/modsearch

- **一句话用途**：给"没有联网能力的纯文本模型"的联网搜索桥——把 DSH 内置 `web_search` 换到多引擎链上，另加 X 搜索（`x_search`）与单页读取（`read_page`）。
- **类型**：DSH 插件（同时以 skill 形态支持 Claude Code / Codex / Pi / OpenCode）。
- **架构**：装进 DSH web profile 后覆盖/增强内置 `web_search`，保留原生引用卡片。引擎链：**Antigravity CLI（默认，免费，浏览器登录）**、Tavily、Exa、Firecrawl、Grok Build（X 搜索）、local（页面读取），多引擎自动 failover。密钥存 `~/.modsearch/config.json`（0600，显示时打码），也支持环境变量；第三方/自托管兼容端点可改 baseURL。
  - 安装：`npx -y @deepseek-ai/dsh plugin --profile web add @liustack/modsearch@latest`；引擎准备（agy 登录或注册免费 key）需人工。
- **依赖**：外部 CLI `agy`（Antigravity）或各家 API key；无 API key 也能用默认免费通道；**npm 依赖轻**（单包）。
- **健康度**：⭐104、fork 5、open issues 1；最近 push 2026-08-15；MIT；活跃（仓库创建于 2026-02-22，本簇中历史最长）。**不接受 PR**（单人维护，issues 与 fork 是贡献途径）。
- **DSH 兼容性**：未声明特定 DSH 版本；文档称"which harness you are on"即兼容多 harness。
- **与"三 UI 整合包"的关系**：开箱即用能力组件（联网搜索），与具体 UI 形态无关，可作整合包预装功能。

---

## 7. Lum1104/dsh-browser

- **一句话用途**：Chrome 侧边栏扩展 + 桥接插件，让 DSH 模型直接操作你正在用的浏览器标签页（读内容、点击、填表、滚动、导航，保留登录态）。
- **类型**：浏览器扩展（Chrome MV3）+ DSH 配套 bridge 插件（同一 pnpm workspace 两个包）。**不是 DSH 插件本身**。
- **架构 / 安装运行**：
  - 组成：`packages/browser/bridge-browser/`（bridge 插件，cordis.patch.yml）+ `extensions/dsh-browser/`（Chrome MV3 扩展）+ `scripts/install.sh`。
  - **安装**：`curl -fsSL …/scripts/install.sh | bash`——下载 main 到 `~/.dsh/dsh-browser`，按 lockfile 装 pinned npm 依赖、构建 bridge 插件、注册到 dsh 本地 web profile、构建扩展、复制到 `~/.dsh/browser-extension`，并打开 `chrome://extensions` 手动"开发者模式 + 加载已解压扩展"。
  - **运行**：启动 dsh（`cd ~/.dsh/dsh-browser && pnpm start` 或 `npx @deepseek-ai/dsh web`，默认 3080），点工具栏鲸鱼图标开侧边栏。**已运行的 dsh 需重启**，profile 只在启动时加载。
  - **通信**：扩展通过 `GET /ext/bridge-config` 发现 dsh（返回 `ws://127.0.0.1:3080/ext/bridge`），走 WebSocket bridge；默认探测 3080/3081/3090 端口；**本地回环免 token**，远程 `--host 0.0.0.0` 部署才需地址 + bridge token。
  - 纯文本管线：页面变结构化文本 + 编号交互元素清单，模型按编号操作；密码/卡号永远显示 `••••` 不出页面；bridge 在 `/api` 信任边界外自做 bearer 认证；特权 gateway 方法拒绝非 loopback 调用；点击/输入/导航等默认 fail-closed 需用户批准。
- **依赖**：Node `^22.19 || >=24`、Corepack/pnpm、Google Chrome、pinned 的 `@deepseek-ai/dsh` release（公共 npm，无需 token）。
- **健康度**：⭐135、fork 9、open issues 3；最近 push 2026-08-15；MIT；活跃。
- **DSH 兼容性**：pinned 公共 `@deepseek-ai/dsh` 版本构建；README 提示 DSH 处于 developer preview，升级可能需要配套依赖与 API 更新。
- **与"三 UI 整合包"的关系**：独立于三种 UI 形态运行的浏览器扩展形态（额外的"浏览器侧边栏 UI"），可作可选组件与 Web UI 并存。

---

## 8. dingyi222666/dsh-session-notification

- **一句话用途**：dsh web GUI 的会话通知插件——会话完成、失败、提问、需要审批时响铃 + 离开标签页时发系统通知。
- **类型**：DSH 插件（**纯 client 半端为主**，Node 半仅预留 settings namespace）。
- **架构**：settings 面板注册 **Notifications** 分节（`settings.section` 槽位，与官方分节同机制）；偏好存浏览器 localStorage（跨标签同步，**不需要 host 改动**，README 明说 "no harness (host) changes"）；四种通知（`turn/end` 完成 / turn 错误 / `question/requested` / `approval/requested`）各可开关、换内置音效（Web Audio 合成、无音频文件）或上传自定义音频（≤1MB，也存 localStorage）；浏览器系统通知默认关闭，开启需用户手势授权；当前阅读中的会话默认静音。
  - 实现：浏览器半端观察 sessions list 快照 + 每个会话的 conversation 快照（**无轮询、无新通道**）；running 边沿 true→false 分类完成/失败；pending 交互边沿触发提问/审批通知。
- **依赖**：npm 包 `@dingyi222666/dsh-session-notification`；零模型请求、零 KV 缓存影响；纯浏览器能力。
- **健康度**：⭐7、fork 0、open issues 0；最近 push 2026-08-13；API 未检测到 LICENSE 文件；活跃（很新）。
- **DSH 兼容性**：**要求 dsh >= 0.1.0-rc.6**（README 安装节明确）。
- **与"三 UI 整合包"的关系**：webui 形态的开箱即用体验组件（通知），可选预装。

---

## 9. SeverusZh/dsh-notify-windows

- **一句话用途**：DSH 插件——Agent 需要你关注时（任务完成 / 等待审批 / 等待回答）向 Windows 发送系统桌面通知。
- **类型**：DSH 插件（host 半端，Windows 专属）。
- **架构**：监听会话 `turn/end`（完成/出错/超限）、`approval/asked`（审批策略为 never 时自动跳过）、`tool/call`（扫描 run_code 程序源码中的 `tools.ask_user_question(` 提取问题文本）事件；**零依赖**：经 Windows PowerShell 5.1 WinRT Toast API 发通知，自动注册 HKCU 的 AppUserModelId（无需管理员）。默认忽略子代理会话。
  - **安装与 4/5/8 号不同**：npm 安装 `dsh plugin --profile web add dsh-notify-windows` 后，**还要手动在 profile 的 `cordis.patch.yml` 追加 insert 条目**（该文件被运行中的 DSH 热监视，改动即生效无需重启）；或源码方式跑 `scripts\install-profile.ps1 -Profile web`（部署到 hoisted node_modules，目录名带版本号，重部署即热加载）。
  - 可选日志 `%TEMP%\dsh-notify\notify.log`；smoke-test 脚本可独立进程验证。
- **依赖**：零 npm 运行时依赖（纯 Node + PowerShell）；仅 Windows 10/11。
- **健康度**：⭐3、fork 0、open issues 0；最近 push 2026-08-13；MIT；活跃（很新）。
- **DSH 兼容性**：未声明特定版本；依赖 `turn/end`、`approval/asked`、`tool/call` 事件契约。
- **与"三 UI 整合包"的关系**：Windows 桌面通知组件（与 UI 形态无关，监听 host 事件），可选预装；安装需额外 patch 步骤，是它与其他插件的主要差异。

---

## 10. QCYTSN/dsh-dafeiyu

- **一句话用途**：住在 Windows 桌面上的"大肥鱼"桌宠，由 DSH 真实工作状态（思考/工作/等待/完成/错误）驱动的 Agent 伴侣。
- **类型**：DSH 插件 + 随包 Windows Helper（桌面显示层）。**不是需要单独启动的桌宠应用**。
- **架构**：由 DSH 插件启用，跟随 DSH Host 启动/退出；透明、无边框、始终置顶的原生窗口显示在桌面。随发布包带**预构建的 Windows Helper**（PyInstaller 打包的 Python，普通用户无需装 Python/PySide6，也不应手动启动 helper）。**不截图、不读其他窗口、不开新网络端口**（设置卡复用 DSH 的本地 Web 服务），状态只来自 DSH Agent 事件，无真实待办数据时不编造进度百分比。多 Session 时按"等待确认 > 错误 > 工作 > 思考 > 空闲"优先级展示。
  - 安装：`dsh plugin --profile web add dsh-dafeiyu@alpha`（npm alpha），或下载 GitHub Releases 的 `.tgz` 不解压直接 `add <路径>`；装前需完全退出 DSH Host；设置入口"设置 → 插件 → 插件配置 → 大肥鱼桌面伴侣"。更新/回退/卸载均需先退出 DSH。
  - 当前版本 `0.1.0-alpha.6`，**Windows MVP Alpha**，设置与文案目前为简体中文。
- **依赖**：Windows 10/11 x64、可用的 DSH WebUI + `dsh plugin --profile web` 命令；发布包内含 Helper 可执行文件；开发构建需 Python + PyInstaller。
- **健康度**：⭐2、fork 0、open issues 0；最近 push 2026-08-14；MIT（角色视觉资产另见 ASSET_LICENSE.md）；活跃但极早期（创建于 2026-08-14）。
- **DSH 兼容性**：未声明特定版本；依赖 web profile 插件机制与 Agent 事件；相关独立桌宠项目为 QCYTSN/ds-local-pet。
- **与"三 UI 整合包"的关系**：Windows 桌面形态的趣味/状态展示组件（可独立于三 UI 常驻桌面），可选预装；当前为 alpha。

---

## 11. xiaobright/dsh-anchored-standard

- **一句话用途**（README 为准）：实验性 DSH **agent preset**——第一次模型请求用 Minimal 对齐的 system prompt + Minimal 的真实工具 schema（`bash` + `str_replace_editor`）引导轨迹，首个持久化工具调用或回复后暴露完整 Standard 工具目录。
- **类型**：DSH agent preset（组合配置），**不是插件、也不是发行版**。
- **架构**：`preset/` 目录（含 `agent.cordis.yml`，派生自官方 Standard preset，保留上游 MIT NOTICE）复制到用户 preset root（`~/.dsh/.agent-presets/anchored-standard`，`DSH_HOME` 可换），重启 DSH 后新建空白会话选择 "Anchored Standard (experimental)"。核心是 `tool-bootstrap` 行：`suppressedContextSources`（首请求剥离 AGENTS.md/CLAUDE.md 摘要与技能提醒）、`promoteOn`（either / tool-call / assistant-message 决定提升时机）；提升决策按会话在进程生命周期内记忆，可从持久化会话事件推导阶段（resume/reload 保留）。另附两个实验变体 preset：**Zero-Anchored Standard**（首轮注入零工具锚点）与 **Whoami Standard**（首轮"你是谁"自介锚点）。
  - 动机（README 自述实验数据）：DeepSeek V4 Pro 强依赖 API 可见工具目录；Project2 评估中 Standard/PTC 得 91/92，官方 Minimal 得 99/96；本 preset 把"首次轨迹选择"与"后续工具使用"分离。
  - **零网络请求、零遥测**；本地 `npm test` 零依赖测试。
- **依赖**：无运行时外部依赖；需 DSH + 会话/事件契约。
- **健康度**：⭐1732、fork 54、open issues 16；最近 push 2026-08-15；API license 为 NOASSERTION（README 声明 MIT，`NOTICE` 保留上游 DeepSeek MIT 版权）；极活跃（创建于 2026-08-14）。
- **DSH 兼容性**：明确**针对 DeepSeek Harness `0.1.0-rc.5`（commit `47f9438`）+ Node 24 Windows 开发测试**；README 警告 DSH 是 developer preview 允许破坏性变更，"本 preset 是 Standard 组合的完整快照，用新版前需审查上游变更"。
- **与"三 UI 整合包"的关系**：属于"会话默认配置/预设"层组件，与 UI 形态无关；整合包若内置官方预设之外的默认 preset，可将其作为候选预设（事实陈述）；它强调兼容版本敏感。

---

## 重点比对与横向事实

### A. 1 号 oh-dsh 架构小结（重点）
- 已实现"webui + gui + tui 统一"：同一 `ohdsh` CLI 启动三形态，共享 Pinned DSH runtime、会话、凭据、皮肤、插件缓存，独立 Profile。
- 安装：GitHub Releases 分发（DMG/安装包/AppImage/deb/便携包），Web-only 与 TUI-only 解压即用，自带 Node runtime，无环境前置。
- 与官方 DSH：**非 fork 内核**，插件化扩展 + 固定版本打包；上游 DSH runtime 以 submodule vendored 构建发行；设计文档承诺"上游能力按 feature 同步"。
- 活跃度：极活跃（184 star，创建 4 天内，每日 push）。

### B. 2 号 dsh-desktop 小结（重点）
- 确认是"只包一层 webui"的 Electron 壳：spawn `dsh web`（127.0.0.1:3080，端口自动递增），窗口加载本地 webui。
- 发布渠道：GitHub Releases；自动更新：应用内 4 小时检查 + CI 每日三次 npm 版本同步自动发版。
- 不含 TUI；数据在系统应用数据目录；托盘常驻。

### C. 3 号 dsh-TUI 通信方式确认（重点）
- 是 TUI 前端，但**不是独立可执行**：以 Cordis 插件形态挂进 DSH profile（`dsh-tui` = `dsh --profile dsh-tui`），**与 DSH 同进程**，经 `session/event` 事件流 + Channel projection 渲染到终端，会话真源与模型执行都在 DSH 侧；"零核心改动，纯插件挂载"。在 oh-dsh 的 TUI-only 发行里才被包装成"解压即用的独立 TUI 发行"。

### D. 4 vs 5：两个插件市场比对（重点）
| 维度 | 4 dsh-market | 5 dsh-webui-market-plugin |
| --- | --- | --- |
| 定位 | 官方（awesome-dsh-plugin.com 维护者开发） | 社区独立实现；README 自荐用 4 号 |
| npm 包 | `dshmarket` | `@sanqi-normal/dsh-webui-market-plugin` |
| 数据源 | awesome-dsh-plugin.com `plugins.json` + 离线快照 | 同源同策略（过期缓存 → 离线快照） |
| 安装机制 | 偏好 npm tarball（registry 交叉校验）；白名单 curated registry；same-origin POST | 队列头白名单 + **试装验证**；同源 POST；**热挂载**（纯行 patch 免重启） |
| 特色功能 | 主题标签页、一键重启（loopback 限定）、缺 pnpm 自动配置、日志导出 | FIFO 任务队列面板、停用/启用、本机插件列表、安装前快照、minimumReleaseAge 自动处理 |
| DSH 版本要求 | 未声明 | 未声明 |
| 规模 | ⭐205 | ⭐37 |

### E. 7 号 dsh-browser 安装运行方式（重点）
- 不是 DSH 插件，是"Chrome MV3 扩展 + bridge 插件"组合：curl 脚本安装到 `~/.dsh/dsh-browser` 与 `~/.dsh/browser-extension`，chrome://extensions 手动加载；dsh 侧 bridge 注册在 web profile，扩展经 `/ext/bridge-config` + WebSocket（回环免 token）连接；dsh 需重启以加载 bridge。

### F. 10 号桌宠 / 11 号用途（重点）
- 10 dsh-dafeiyu：插件 + 预构建 Windows Helper，跟随 DSH Host 生命周期，状态来自真实 Agent 事件，alpha。
- 11 dsh-anchored-standard：README 清晰（实验性 agent preset，非插件），已完整解读；不存"抓不到"情况。

### G. 全仓库健康度速览
| 仓库 | ⭐ | 最近 push | license | 状态 |
| --- | ---: | --- | --- | --- |
| hust-open-atom-club/oh-dsh | 184 | 2026-08-15 | MIT | 活跃 |
| foolgry/dsh-desktop | 7 | 2026-08-15 | 无 LICENSE 文件（README 称 MIT） | 活跃 |
| ccch1mneyyy/dsh-TUI | 1135 | 2026-08-15 | MIT | 极活跃，public beta |
| dsh-market/dsh-market | 205 | 2026-08-15 | MIT | 活跃 |
| Sanqi-normal/dsh-webui-market-plugin | 37 | 2026-08-15 | MIT | 活跃 |
| liustack/modsearch | 104 | 2026-08-15 | MIT | 活跃（单人维护，不收 PR） |
| Lum1104/dsh-browser | 135 | 2026-08-15 | MIT | 活跃 |
| dingyi222666/dsh-session-notification | 7 | 2026-08-13 | 无 LICENSE 文件 | 活跃 |
| SeverusZh/dsh-notify-windows | 3 | 2026-08-13 | MIT | 活跃 |
| QCYTSN/dsh-dafeiyu | 2 | 2026-08-14 | MIT（角色资产另许可） | 极早期 alpha |
| xiaobright/dsh-anchored-standard | 1732 | 2026-08-15 | NOASSERTION（README 称 MIT） | 极活跃 |

### H. 上游官方仓库地址说明
- 本簇多个 README 引用上游为 `deepseek-ai/deepseek-harness`（foolgry、Lum1104、xiaobright 引用的 commit `47f9438` 即该仓库），oh-dsh 引用 `deepseek-harness/deepseek-harness`。web_search 确认 canonical 为 **deepseek-ai/DeepSeek-Harness**（GitHub API 对该仓库请求被限流，此项标注"经搜索摘要确认"）。

---

*以上全部条目均基于抓取到的仓库 README / 官方文档 / GitHub API 元数据；未给出任何"选哪个"的建议。*
