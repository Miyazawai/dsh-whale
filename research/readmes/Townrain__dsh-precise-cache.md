# dsh-precise-cache

简体中文 | [English](README.en.md)

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 加一个小功能：在聊天输入框下方的统计栏旁边，多显示一行**精确到小数点后五位的缓存命中率**，长这样：

> `精确命中 99.87654%`

![效果图](docs/screenshot.png)

## 有什么用？

Harness 自带的统计栏里，缓存命中率是**四舍五入到整数**的：真实命中率只要达到 99.5%，它就会显示成 `100%`。

这个插件用的是**和官方一模一样的数据**，只是**不做四舍五入**，把真实的数字直接显示出来。

## 安装（三步）

### Windows：PowerShell 一行命令（不需要 npx，不需要装任何东西）

打开 PowerShell，粘贴运行：

```powershell
irm https://raw.githubusercontent.com/Townrain/dsh-precise-cache/main/scripts/install.ps1 | iex
```

脚本会自动下载插件、放进 dsh 的插件目录、登记到你的配置里（重复运行不会重复登记）。然后：

1. 重启 dsh
2. 刷新浏览器页面

完成，统计栏旁边就会出现 `精确命中 …%`。

> 想装到别的 profile 或强制覆盖，先下载脚本再带参数运行：
> `pwsh -File scripts/install.ps1 -Profile headless` / `-Force`

### 其他方式

- 装了 npm：`npx dsh-precise-cache install`
- 下载本仓库后用 Node：`node scripts/install.js install --from . --force`

## 卸载

```powershell
irm https://raw.githubusercontent.com/Townrain/dsh-precise-cache/main/scripts/install.ps1 -OutFile "$env:TEMP\dsh-precise-cache-install.ps1"
& "$env:TEMP\dsh-precise-cache-install.ps1" -Uninstall
```

然后重启 dsh。装了 npm 也可以直接 `npx dsh-precise-cache uninstall`。

## 常见问题

**装好了但看不到那一行？** 这一行只有在「产生过输入计费」之后才会显示，没有数据时它会自动隐藏。随便发一条消息再回来看就有了。

**会拖慢 dsh 或影响计费吗？** 都不会。它只读取 dsh 本来就在计算的统计数据，不发起任何请求、不改任何数字。

**为什么是五位小数？** 这是本插件最初的诉求：位数越少越容易重新掉进四舍五入的假象里。

<details>
<summary>技术细节（开发者）</summary>

### 工作原理

```
lib/index.js      宿主半：空实现（读数纯属浏览器呈现）
lib/client.js     浏览器半：模块表格式 bundle，无需构建步骤
scripts/install.js  Node 一键安装器
scripts/install.ps1 PowerShell 一键安装器（下载 zip + 写入组合行）
```

- **数据来源**：Harness 的 `tokenUsage` 投影（provider 上报值，宿主折叠、全日志累计），通过 dock 槽位的标准 `useProjection` 座席读取，无任何自建 RPC。分母与内置统计行完全一致：`uncachedInputTokens + cacheReadTokens + cacheWriteTokens`。
- **插件装载契约**：`package.json` 声明 `dsh.client.platform = "web"` 及 `inject` 依赖，宿主扫描器据此生成 `window.__DSH_BOOT__` 图行并挂载 `/plugins/dsh-precise-cache/client.js` 路由；浏览器半以 `window.__ModuleLoader__.load({ id, factory })` 注册交接，`id` 即包名，工厂返回 `{ apply, inject }`。
- **UI 入口**：通过 `ctx.slots.inject('conversation.composer.dock', …)` 注册为新 id 的列表条目（排在内置 `stats` 行之后），文案走 `locale: 'preciseCache'` 座席，样式标签带 `data-plugin` 归属、卸载时由模块加载器回收。
- **热更新边界**：`lib/client.js` 内容变化刷新页面即生效；`dsh.client` 声明变化需要重启 dsh。

### 开发

```sh
npm run check          # node --check 语法校验
npm run install:local  # 本地安装验证
```

</details>

## 许可

MIT © 2026 [Townrain](https://github.com/Townrain)。欢迎按 `dsh-plugin` 生态习惯提 PR 与 Issue。

