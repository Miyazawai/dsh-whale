// dsh-whale boot 二分器：逐个排除核心插件试 boot，找出让 Loader 挂起/失败的肇事者。
// 用法: DSH_SOURCE=<dsh checkout> node scripts/bisect-boot.mjs [--home <dshHome>]
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback
}
const sourceMode = process.env.DSH_SOURCE !== undefined && process.env.DSH_SOURCE !== ''
if (!sourceMode) throw new Error('DSH_SOURCE env is required')
const dshSource = resolve(process.env.DSH_SOURCE)
const cliEntry = join(dshSource, 'apps', 'cli', 'lib', 'bin.js')
const dshHome = resolve(arg('--home', join(root, '.dev', 'dsh-home')))
const profile = 'web'
const manifestPath = join(dshHome, 'profiles', profile, 'package.json')
const original = JSON.parse(readFileSync(manifestPath, 'utf8'))
const coreBundles = [
  'dsh-cost-meter', 'dsh-genui', 'dsh-at-file', 'dsh-file-uploads', 'dsh-web-archive',
  'dsh-navbar', 'dsh-file-mentions', 'dsh-message-edit', 'dsh-plugin-anydoc',
  'dsh-session-notification', 'dsh-theme-gallery', 'dsh-tool-csv', 'dsh-skill-viewer',
  'dsh-vision-toolkit', 'dsh-plugin-description', 'dsh-dafeiyu', 'dsh-super-injector',
]
const BUNDLES = original.dsh.profile.bundles

function bootWith(bundles, timeoutMs = 25_000) {
  const manifest = structuredClone(original)
  manifest.dsh.profile.bundles = bundles
  writeFileSync(manifestPath, JSON.stringify(manifest, undefined, 2) + '\n')
  return new Promise(resolve => {
    const child = spawn(process.execPath, [cliEntry, '--profile', profile, '--port', '0'], {
      cwd: dshHome,
      env: { ...process.env, DSH_HOME: dshHome },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let settled = false
    let ready = false
    let out = ''
    const finish = ok => {
      if (settled) return
      settled = true
      if (child.exitCode === null) child.kill('SIGTERM')
      resolve(ok)
    }
    child.stdout.on('data', chunk => {
      out += chunk.toString('utf8')
      if (/^dsh web: http:\/\/127\.0\.0\.1:\d+/m.test(out)) { ready = true; finish(true) }
    })
    child.stderr.on('data', chunk => { out += chunk.toString('utf8') })
    child.once('exit', () => finish(ready))
    setTimeout(() => finish(ready), timeoutMs)
  })
}

// 0. 先测全量（当前状态）
const fullOk = await bootWith(BUNDLES)
console.log(`全量 boot: ${fullOk ? '✅ 就绪' : '❌ 挂起/失败'}`)
if (fullOk) { process.exit(0) }

// 1. 逐个排除
console.log('--- 逐个排除 ---')
for (const id of coreBundles) {
  const rest = BUNDLES.filter(b => {
    const name = b.split('/').pop()
    return name !== id && !b.endsWith(`/${id}`)
  })
  const ok = await bootWith(rest)
  console.log(`排除 ${id}: ${ok ? '✅ 就绪 → 肇事者' : '❌ 仍挂'}`)
}

// 2. 恢复原状
writeFileSync(manifestPath, JSON.stringify(original, undefined, 2) + '\n')
console.log('bisect done')
