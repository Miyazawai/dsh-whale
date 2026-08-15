// dsh-whale 基线探测：web / tui profile 干净启动（T0 验收 + T1 检查器的种子）
// 用法:
//   node scripts/smoke-baseline.mjs [resourcesRoot] [profile...]   # 用 .stage 打包 runtime
//   DSH_SOURCE=<dsh checkout> node scripts/smoke-baseline.mjs [profile...]  # 用源码构建 runtime（快，开发环）
// 默认 profiles: web tui。DSH_SOURCE 模式下 web 用最小规格 [dsh-base, dsh-web-app]（不依赖 @oh-dsh/web）。
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundledRuntimePaths, runtimeSearchPath } from '../src/runtime-paths.ts'
import { ensureProfile, WEB_PROFILE_SPEC, TUI_PROFILE_SPEC } from '../src/profile.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const sourceMode = process.env.DSH_SOURCE !== undefined && process.env.DSH_SOURCE !== ''
let cliEntry
let nodeBinary
let searchPath
if (sourceMode) {
  const source = resolve(process.env.DSH_SOURCE)
  cliEntry = join(source, 'apps', 'cli', 'lib', 'bin.js')
  nodeBinary = process.execPath
  searchPath = process.env.PATH ?? process.env.Path ?? ''
  console.log(`baseline source mode: DSH at ${source}`)
} else {
  const resources = resolve(process.argv[2] ?? join(root, '.stage'))
  const paths = bundledRuntimePaths(resources)
  cliEntry = paths.cliEntry
  nodeBinary = paths.nodeBinary
  searchPath = runtimeSearchPath(paths)
  console.log(`baseline staged mode: resources at ${resources}`)
}

const profileArgs = process.argv.slice(2).filter(arg => !arg.startsWith('.'))
const profiles = profileArgs.length > 0 ? profileArgs : ['web', 'tui']

// DSH_SOURCE 模式用最小 profile 规格（官方 web app 基线）；.stage 模式用 oh-dsh 规格。
const SPECS = sourceMode
  ? {
      web: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'], manifestName: 'dsh-profile-web', name: 'web' },
      tui: { bundles: ['@deepseek-ai/dsh-base'], manifestName: 'dsh-profile-tui', name: 'tui' },
    }
  : { web: WEB_PROFILE_SPEC, tui: TUI_PROFILE_SPEC }

for (const name of profiles) {
  const spec = SPECS[name]
  assert.ok(spec, `unknown profile: ${name}`)
  const smokeRoot = mkdtempSync(join(tmpdir(), `dsh-whale-baseline-${name}-`))
  const dshHome = join(smokeRoot, 'dsh-home')
  const lines = []
  let child
  try {
    ensureProfile(spec, dshHome)
    const env = {
      ...process.env,
      DSH_HOME: dshHome,
      PATH: searchPath,
    }
    child = spawn(nodeBinary, [cliEntry, '--profile', name, ...(name === 'web' ? ['--port', '0'] : [])], {
      cwd: smokeRoot,
      env,
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
        rejectReady(new Error(`profile ${name} exited before readiness (code=${String(code)}, signal=${String(signal)})\n${lines.join('')}`))
      })
    })
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`profile ${name} readiness timed out\n${lines.join('')}`)), 90_000).unref()
    })
    const base = await Promise.race([ready, timeout])
    const response = await fetch(base)
    const index = await response.text()
    assert.equal(response.status, 200, `profile ${name} index status`)
    assert.match(index, /<div id="root"><\/div>/, `profile ${name} root div`)
    if (name === 'web') {
      assert.match(index, /__DSH_BOOT__/, `profile ${name} client boot graph`)
    }
    console.log(`✅ baseline ${name}: ready at ${base.href} (DSH boot ok)`)
  } finally {
    if (child !== undefined && child.exitCode === null) {
      child.kill('SIGTERM')
      await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve) })
    }
    rmSync(smokeRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  }
}
