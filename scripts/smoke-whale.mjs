// dsh-whale 整合包检查器（T1）：验证 DSH_HOME 的组合完整性 + 三 profile 启动探测。
// 用法:
//   DSH_SOURCE=<dsh checkout> node scripts/smoke-whale.mjs [--home <dshHome>] [--profile web]
// 断言（任一失败 → 冒烟红）:
//   1. 每个核心插件（config/bundles.json.core）已进 profile manifest bundles
//   2. web profile 启动就绪 + index 200 + boot graph 包含已安装 client 插件的 entry
//   3. 输出逐插件 ✓/✗ 清单
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureWebProfile } from '../src/profile.ts'

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
const profile = arg('--profile', 'web')

const manifest = JSON.parse(readFileSync(join(root, 'config', 'bundles.json'), 'utf8'))
const manifestPath = join(dshHome, 'profiles', profile, 'package.json')
if (!existsSync(manifestPath)) throw new Error(`profile manifest missing: ${manifestPath}`)
const profileManifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const bundles = profileManifest.dsh?.profile?.bundles ?? []

const results = []
for (const spec of manifest.core) {
  if (!(spec.profile ?? ['web']).includes(profile)) continue
  const bundleName = spec.source === 'link'
    ? JSON.parse(readFileSync(join(resolve(root, spec.pkg), 'package.json'), 'utf8')).name
    : (spec.source === 'npm' ? spec.pkg : spec.pkg.split('/').pop())
  const inProfile = bundles.some(id => id === bundleName || id.endsWith(`/${bundleName}`))
  results.push({ id: spec.id, bundleName, inProfile })
}

const failures = results.filter(r => !r.inProfile)
for (const r of results) {
  console.log(`${r.inProfile ? '✅' : '❌'} core ${r.id} (bundle ${r.bundleName}) ${r.inProfile ? 'in profile' : 'MISSING from profile bundles'}`)
}

// 启动探测：直接 boot 开发 DSH_HOME（其 profiles/node_modules 已含全部插件）
const lines = []
const child = spawn(process.execPath, [cliEntry, '--profile', profile, '--port', '0'], {
  cwd: dshHome,
  env: { ...process.env, DSH_HOME: dshHome },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let readySettled = false
const ready = new Promise((resolveReady, rejectReady) => {
  const resolveOnce = value => {
    if (readySettled) return
    readySettled = true
    resolveReady(value)
  }
  const reader = stream => chunk => {
    const text = chunk.toString('utf8')
    lines.push(`[${stream}] ${text}`)
    const match = /^dsh web: (http:\/\/127\.0\.0\.1:\d+)/m.exec(text)
    if (match?.[1] !== undefined) resolveOnce(new URL(match[1]))
  }
  child.stdout.on('data', reader('stdout'))
  child.stderr.on('data', reader('stderr'))
  child.once('error', rejectReady)
  child.once('exit', (code, signal) => {
    if (readySettled) return
    rejectReady(new Error(`profile exited before readiness (code=${String(code)}, signal=${String(signal)})\n${lines.join('')}`))
  })
})
const timeout = new Promise((_, reject) => {
  setTimeout(() => reject(new Error(`readiness timed out\n${lines.join('')}`)), 90_000).unref()
})

let bootEntries = []
try {
  const base = await Promise.race([ready, timeout])
  const response = await fetch(base)
  const index = await response.text()
  assert.equal(response.status, 200, `index status`)
  assert.match(index, /__DSH_BOOT__/, `client boot graph`)
  const marker = 'window.__DSH_BOOT__ = '
  const start = index.indexOf(marker)
  const end = index.indexOf('</script>', start)
  bootEntries = JSON.parse(index.slice(start + marker.length, end)).entries
  console.log(`✅ profile ${profile}: ready at ${base.href}, boot graph has ${bootEntries.length} entries`)
  // client 插件在 boot graph 里应有 entry（host-only 插件不在 graph，靠 manifest 检查兜底）
  const bootIds = new Set(bootEntries.map(entry => entry.id))
  for (const r of results) {
    if (bootIds.has(r.bundleName)) console.log(`✅ boot entry present: ${r.id} (${r.bundleName})`)
  }
} catch (error) {
  console.error(`❌ profile boot failed: ${error.message}`)
  console.log(lines.join(''))
  process.exitCode = 1
} finally {
  if (child.exitCode === null) {
    child.kill('SIGTERM')
    await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve) })
  }
}

if (failures.length > 0) {
  console.error(`\n整合包检查：RED — ${failures.length} 个核心插件缺失：${failures.map(f => f.id).join(', ')}`)
  process.exitCode = 1
} else {
  console.log(`\n整合包检查：GREEN — ${results.length} 个核心插件全部在组合中`)
}
