// dsh-whale 插件安装器：读 config/bundles.json，把核心插件装配进指定 profile 的 DSH_HOME。
// 用法:
//   DSH_SOURCE=<dsh checkout> node scripts/install-bundles.mjs [--home <dshHome>] [--profile web] [--only <id,...>]
// 行为:
//   - 核心插件（bundles.json.core）: dsh plugin --profile <p> add <来源>（npm 名 / github:owner/repo / git+URL / 本地目录）
//   - 预设（bundles.json.presets）: 拷贝 upstream 目录到 $DSH_HOME/.agent-presets/<id>
//   - 可选插件: 默认不安装（可插拔性：需要时单装，保持"默认关"）
//   - 幂等：已存在的 bundle/预设跳过
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureWebProfile } from '../src/profile.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback
}

const sourceMode = process.env.DSH_SOURCE !== undefined && process.env.DSH_SOURCE !== ''
if (!sourceMode) {
  throw new Error('DSH_SOURCE env is required (point at a built DSH checkout)')
}
const dshSource = resolve(process.env.DSH_SOURCE)
const cliEntry = join(dshSource, 'apps', 'cli', 'lib', 'bin.js')
const dshHome = resolve(arg('--home', join(root, '.dev', 'dsh-home')))
const profile = arg('--profile', 'web')
const only = process.argv.includes('--only')
  ? new Set(arg('--only', '').split(',').map(id => id.trim()).filter(Boolean))
  : null

const manifest = JSON.parse(readFileSync(join(root, 'config', 'bundles.json'), 'utf8'))

function run(args, opts = {}) {
  const result = spawnSync(process.execPath, [cliEntry, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
    env: { ...process.env, ...(opts.env ?? {}), DSH_HOME: dshHome },
  })
  if (result.status !== 0) {
    throw new Error(`dsh ${args.join(' ')} failed (${result.status})\n${result.stderr ?? ''}\n${result.stdout ?? ''}`)
  }
  return result.stdout
}

function pluginSpecSource(spec) {
  if (spec.source === 'npm') return `${spec.pkg}@${spec.version ?? 'latest'}`
  if (spec.source === 'github') return `github:${spec.pkg}`
  if (spec.source === 'link') return resolve(root, spec.pkg)
  throw new Error(`unknown source type: ${spec.source} for ${spec.id}`)
}

console.log(`installer: DSH_SOURCE=${dshSource}`)
console.log(`installer: DSH_HOME=${dshHome}, profile=${profile}`)
mkdirSync(dshHome, { recursive: true })
ensureWebProfile(dshHome)

// 1. 核心插件
let installed = 0
let skipped = 0
for (const spec of manifest.core) {
  if (only !== null && !only.has(spec.id)) continue
  if (!(spec.profile ?? ['web']).includes(profile)) continue
  const source = pluginSpecSource(spec)
  // 幂等探测：profile manifest 里已有该 bundle 名即跳过
  const manifestPath = join(dshHome, 'profiles', profile, 'package.json')
  const profileManifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const bundles = profileManifest.dsh?.profile?.bundles ?? []
  const bundleName = spec.source === 'link'
    ? JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).name
    : (spec.source === 'npm' ? spec.pkg : spec.pkg.split('/').pop())
  if (bundles.some(id => id === bundleName || id.endsWith(`/${bundleName}`))) {
    console.log(`⏭️  skip ${spec.id} (already in profile bundles)`)
    skipped++
    continue
  }
  console.log(`📦 installing core: ${spec.id} <- ${source}`)
  try {
    run(['plugin', '--profile', profile, 'add', source])
    installed++
  } catch (error) {
    console.error(`❌ core install failed: ${spec.id}\n${error.message}`)
  }
}

// 2. 预设
let presets = 0
for (const preset of manifest.presets) {
  if (only !== null && !only.has(preset.id)) continue
  const source = resolve(root, preset.source)
  const target = join(dshHome, '.agent-presets', preset.id)
  if (existsSync(join(target, 'preset.yml'))) {
    console.log(`⏭️  skip preset ${preset.id} (already installed)`)
    continue
  }
  if (!existsSync(join(source, 'preset.yml')) && !existsSync(join(source, 'agent.cordis.yml'))) {
    console.error(`❌ preset source missing: ${source} for ${preset.id}`)
    continue
  }
  console.log(`📦 installing preset: ${preset.id} <- ${source}`)
  mkdirSync(dirname(target), { recursive: true })
  cpSync(source, target, { recursive: true })
  presets++
}

console.log(`\ninstaller done: ${installed} core installed, ${skipped} skipped, ${presets} presets`)
