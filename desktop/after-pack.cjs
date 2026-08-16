// Windows 专用 afterPack：把 .runtime/dsh-cli 整体拷进 resources/dsh-cli，
// 并在 resources/ 下建 node_modules junction -> dsh-cli/node_modules。
// 为什么：link 源插件（dsh-super-injector / dsh-theme-gallery）在 resources/upstream/** 下，
// ESM 从那里向上解析 peer 依赖（@deepseek-ai/dsh-tools、schemastery、cordis）时必经 resources/node_modules；
// 而 electron-builder 对 extraResources 里的 node_modules 会按 package.json dependencies 裁剪删空，
// 所以 runtime 不走 extraResources，改在此处直接 cpSync + mklink。
const { cpSync, rmSync, existsSync } = require('node:fs')
const { join } = require('node:path')
const { spawnSync } = require('node:child_process')

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return
  const resourcesDir = join(context.appOutDir, 'resources')

  // 1. runtime：完整 node_modules 拷贝
  const runtimeSrc = join(__dirname, '.runtime', 'dsh-cli')
  if (!existsSync(runtimeSrc)) {
    throw new Error(`[after-pack] runtime missing: ${runtimeSrc}（先跑 node scripts/build-desktop-runtime.mjs）`)
  }
  const dst = join(resourcesDir, 'dsh-cli')
  rmSync(dst, { recursive: true, force: true })
  cpSync(runtimeSrc, dst, { recursive: true })
  console.log(`[after-pack] copied runtime (${runtimeSrc}) -> ${dst}`)

  // 2. resources/node_modules junction -> dsh-cli/node_modules（link 源插件 peer 解析链）
  const nmJunction = join(resourcesDir, 'node_modules')
  const nmTarget = join(resourcesDir, 'dsh-cli', 'node_modules')
  rmSync(nmJunction, { recursive: true, force: true })
  const res = spawnSync('cmd', ['/c', 'mklink', '/J', nmJunction, nmTarget], { stdio: 'pipe' })
  if (res.status !== 0) {
    throw new Error(`[after-pack] mklink failed: ${res.stderr?.toString() ?? res.stdout?.toString()}`)
  }
  if (!existsSync(join(nmJunction, '@deepseek-ai', 'dsh-tools'))) {
    throw new Error('[after-pack] junction created but @deepseek-ai/dsh-tools not resolvable through it')
  }
  console.log(`[after-pack] junction ${nmJunction} -> ${nmTarget}`)
}
