// 构建桌面壳发布态 runtime：在 desktop/.runtime/dsh-cli 做一次完整 npm 安装，
// 使 resources/dsh-cli 发布后自带全部依赖（lib/bin.js 的 ESM import 可解析）。
// 用法：node scripts/build-desktop-runtime.mjs [--registry <url>] [--dsh <spec>]
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, 'desktop', '.runtime', 'dsh-cli')
const args = process.argv.slice(2)
const registry =
  args[args.indexOf('--registry') + 1] ?? 'https://registry.npmjs.org'
const dshSpec = args[args.indexOf('--dsh') + 1] ?? '@deepseek-ai/dsh@0.1.0-rc.6'

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n> ${cmd} ${cmdArgs.join(' ')}\n`)
  const res = spawnSync(cmd, cmdArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  })
  if (res.status !== 0) {
    console.error(`[build-desktop-runtime] FAILED (${cmd} exit ${res.status})`)
    process.exit(res.status ?? 1)
  }
}

console.log(`[build-desktop-runtime] target=${target}`)
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })

// 用最小 package.json 锚定项目根，防止 npm 沿目录向上 hoist 到 desktop/node_modules
writeFileSync(
  join(target, 'package.json'),
  JSON.stringify({
    name: 'dsh-cli-runtime',
    private: true,
    version: '0.0.0',
    // npm 11 allow-scripts：放行必要的 install 脚本（pty/prebuild 等）
    allowScripts: {
      '@deepseek-ai/dsh-subprocess-local@0.1.0-rc.6': true,
      'koffi@3.1.5': true,
      'node-pty@1.1.0': true,
      '@google/genai@1.52.0': true,
      'protobufjs@7.6.5': true,
    },
  }, null, 2)
)

// 完整安装 @deepseek-ai/dsh（含依赖树，--omit=dev 只装运行时依赖）
// 注意：不用 --prefix（Windows 带空格路径会被拆断），直接 cd 到目标目录装
run('npm', [
  'install',
  dshSpec,
  '--omit=dev',
  '--no-audit',
  '--no-fund',
  '--registry',
  registry,
  '--fetch-retries',
  '8',
  '--fetch-timeout',
  '600000',
], { cwd: target })

// 补装裸 peer 包：link 源插件（dsh-super-injector/theme-gallery）从 resources/upstream/**
// 向上解析依赖，需要裸 schemastery / cordis（runtime 里默认只有 @deepseek-ai/scoped 版）。
run('npm', [
  'install',
  'schemastery@^3.18.0',
  'cordis',
  '--omit=dev',
  '--no-audit',
  '--no-fund',
  '--registry',
  registry,
  '--fetch-retries',
  '8',
  '--fetch-timeout',
  '600000',
], { cwd: target })

const bin = join(target, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
if (!existsSync(bin)) {
  console.error(`[build-desktop-runtime] MISSING ${bin}`)
  process.exit(1)
}

// 体积统计（遍历）
const { readdirSync } = await import('node:fs')
let total = 0
const walkDir = (d) => {
  let entries
  try { entries = readdirSync(d, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = join(d, e.name)
    if (e.isDirectory()) walkDir(p)
    else if (e.isFile()) total += statSync(p).size
  }
}
walkDir(target)
console.log(`\n[build-desktop-runtime] OK: ${(total / 1024 / 1024).toFixed(1)} MB at ${target}`)
console.log(`[build-desktop-runtime] bin.js = ${bin}`)
