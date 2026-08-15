# dsh-ui-status-label

[![featured on dsh-suite](https://img.shields.io/badge/featured%20on-dsh--suite-4d6bfe)](https://whyihaveyou.github.io/dsh-suite/)

把你的鲸鱼娘思考时的 deep diving 自定义成任意你想要的样子。

[![dsh-suite Featured Pick](https://whyihaveyou.github.io/dsh-suite/assets/badges/ui-status-label.png)](https://whyihaveyou.github.io/dsh-suite/)

为 **dsh Web** 聊天视图提供可配置的运行中轮次状态文案：General 设置区的一行文本输入，插件把聊天视图运行状态栏的文案替换为你输入的文字（支持 DOM 注入和上游 `conversationStatus` 服务两条路径，见[兼容性](#兼容性)）。插件注册持久的 `ui-status-label` settings 命名空间（默认 `小难梁在0721`）；在设置行输入新文字后，聊天视图在轮次运行期间（等待首 token、工具执行、流式输出）显示的状态文案随之更新。选择持久化在 `$DSH_HOME/settings.yaml`，跟随同一个用户 home 跨越 Web 端口。

## 前提

- **dsh Web**（`dsh --profile web` 或自定义 Web 组合）。本插件只面向浏览器交互面；headless/TUI profile 装它没有意义。
- 依赖分两类：`@deepseek-ai/cordis`、`dsh-client-*` 等为 **peer 依赖**（由 dsh 安装提供）；`@deepseek-ai/dsh-settings`、`schemastery` 为**直接依赖**（从 npm 安装）。仓库内的 `pnpm-workspace.yaml` 已关闭 peer 自动安装（`autoInstallPeers: false`），clone 后直接 `pnpm install` 即可完成直接依赖。

## 安装

本包声明了 `dsh.bundle`，`dsh plugin add` 会自动激活它的 `cordis.patch.yml` 层（把 `dsh-ui-status-label` 行插入 Web roster）。

```sh
# ① tarball（需要先在仓库根执行 pnpm pack 生成 dsh-ui-status-label-0.1.0.tgz）
dsh plugin --profile web add ./dsh-ui-status-label-0.1.0.tgz

# ② git 仓库直装
dsh plugin --profile web add github:alingalingling/ui-status-label

# ③ npm（当前 npm 上尚未发布，发布后可用）
dsh plugin --profile web add dsh-ui-status-label
```

**git 安装注意**：pnpm ≥10 默认**阻止运行 git 依赖的 `prepare` 脚本**——首次 `add` 可能报 "Ignored build scripts"，报错会打印一个包 key。把它加入 profile 目录下 `pnpm-workspace.yaml` 的 `allowBuilds` 后重新 `add` 即可（这是**允许执行该包构建代码**的授权，只对你信任的包开启）：

```yaml
allowBuilds:
  dsh-ui-status-label: true
```

不过本仓库**已把预构建的 `lib/`（含类型声明）随源码一起提交**，git 安装即使跳过 `prepare` 也能直接用产物；`allowBuilds` 只在你想从源码重新构建时才需要。

卸载用 `dsh plugin --profile web remove dsh-ui-status-label`。

> 仅在使用**内置了本插件的定制 dsh 构建**（如 deepseek-harness 仓库本地构建）时，不要重复安装——`ui-status-label` settings 命名空间会注册两次。官方发布版未内置本插件，正常安装即可。

## 安装后生效

装完需要**重启 dsh web 进程**（当前运行中的 GUI 不会热加载新插件 bundle），重启后刷新页面即可在设置里看到入口。

## 兼容性

本插件同时提供两条生效路径，**官方正式版（含 0.1.0-rc.6）即可直接生效**：

1. **DOM 注入（默认兜底）**：插件监听聊天视图的运行状态元素（官方标记 `role="status"` + 硬编码 `Deep diving...`），把文本替换为你配置的文案。不依赖官方任何新机制，装完即用。
2. **`conversationStatus` 可选服务**：当 ui-conversation 带上了扩展点（随 `UPSTREAM-EXTENSION.patch` 合入官方后），聊天视图直接渲染你配置的文案，DOM 注入自动让位，两者不会冲突。

## 设置

安装并重启后，修改入口在 dsh Web 页面里：

1. 打开 dsh Web 页面（默认 `http://127.0.0.1:3080`）
2. 点击页面左下角的**齿轮图标**，打开设置面板
3. 在左侧导航选择 **General（通用）** 分区
4. 找到「**运行状态文案**」一行，在输入框里输入你想要的文字（例如"努力干活中"）
5. **输入即生效，无需保存**——下次智能体运行期间，聊天视图的状态行就会显示你输入的文字

清空输入框会回到默认文案 `小难梁在0721`。文案按用户而非按会话，上限 40 字符。

## 从源码构建

```sh
pnpm install        # 安装直接依赖（dsh-settings、schemastery 等，均已发布 npm）
pnpm run bundle     # 重建 JS 产物：lib/index.js（node 半边）+ lib/client.js（浏览器半边）+ lib/invariant.js
pnpm pack           # 生成 tarball（含 lib/ 与 cordis.patch.yml）
```

`lib/`（含 `lib/types` 类型声明）已**预构建并随仓库提交**；`prepare`/`bundle`（tsdown）只重建 JS 产物，**不重新生成 `.d.ts`**——类型由仓库维护，改动源码后如需同步类型请对照 `lib/types` 更新。

## 结构

- `src/schema.ts` — 仅 node 半边；`ui-status-label` 设置 schema（放在浏览器 bundle 之外，运行时不依赖 schemastery）。
- `src/status-settings.ts` — 两个半边共享的常量与 section 类型。
- `src/client/StatusLabelRow.tsx` — General 设置文本行。
- `src/client/status-label-policy.ts` — 实时 snapshot store、持久化写穿、采纳 Host 侧变更，以及空值回退默认。
- `src/client/status-label-injector.ts` — DOM 兜底：把官方硬编码的 `Deep diving...` 文本替换为配置文案（上游合入扩展点后自动让位）。
- `src/client/index.ts` — 注册设置行、提供 `conversationStatus` 服务并启动 DOM 注入器；把本插件从 cordis.yml 组合掉后，ui-conversation 的内置文案保持原样。

## 模型体验

无——设置行与服务只影响浏览器呈现；本包不会触及任何模型请求。

