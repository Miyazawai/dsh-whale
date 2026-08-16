// dsh-whale 插件安装器：读 config/bundles.json，把核心插件装配进指定 profile 的 DSH_HOME。
// 用法:
//   DSH_SOURCE=<dsh checkout> node scripts/install-bundles.mjs [--home <dshHome>] [--profile web] [--only <id,...>]
// 行为:
//   - 核心插件（bundles.json.core）: dsh plugin --profile <p> add <来源>（npm 名 / github:owner/repo / 本地目录）
//   - git 托管插件 prepare 脚本: 失败时从 pnpm 输出解析包名，自动写入 profile pnpm-workspace.yaml 的 allowBuilds 并重试
//   - 预设（bundles.json.presets）: 拷贝 upstream 目录到 $DSH_HOME/.agent-presets/<id>
//   - 可选插件: 默认不安装（可插拔性：需要时单装，保持"默认关"）
//   - 幂等：已存在的 bundle/预设跳过
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureWebProfile } from '../src/profile.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback
}

const sourceMode = process.env.DSH_SOURCE !== undefined && process.env.DSH_SOURCE !== ''
const cliMode = process.env.DSH_CLI !== undefined && process.env.DSH_CLI !== ''
if (!sourceMode && !cliMode) {
  throw new Error('DSH_SOURCE or DSH_CLI env is required (point at a built checkout or the npm bin.js)')
}
const dshSource = sourceMode ? resolve(process.env.DSH_SOURCE) : ''
const cliEntry = cliMode ? resolve(process.env.DSH_CLI) : join(dshSource, 'apps', 'cli', 'lib', 'bin.js')
const dshHome = resolve(arg('--home', join(root, '.dev', 'dsh-home')))
const profile = arg('--profile', 'web')
const only = process.argv.includes('--only')
  ? new Set(arg('--only', '').split(',').map(id => id.trim()).filter(Boolean))
  : null

const manifest = JSON.parse(readFileSync(join(root, 'config', 'bundles.json'), 'utf8'))
const profileDir = join(dshHome, 'profiles', profile)

/** 治网络抖动：profile 级 .npmrc 大超时 + 多重试。 */
function ensureProfileNpmrc() {
  const path = join(profileDir, '.npmrc')
  if (!existsSync(path)) {
    writeFileSync(path, 'fetch-timeout=600000\nfetch-retries=10\n')
    console.log(`installer: wrote ${path}`)
  }
}

/** 把 git 托管插件的 prepare 构建许可写入 profile pnpm-workspace.yaml。 */
function ensureAllowBuilds(pkgNames) {
  const path = join(profileDir, 'pnpm-workspace.yaml')
  let content = existsSync(path) ? readFileSync(path, 'utf8') : 'packages:\n  - .\n'
  if (!content.includes('allowBuilds:')) content += 'allowBuilds:\n'
  for (const name of pkgNames) {
    if (name !== '' && !content.includes(`    ${name}:`)) {
      content += `    ${name}: true\n`
      console.log(`installer: allowBuilds += ${name}`)
    }
  }
  writeFileSync(path, content)
}

function runCapture(args) {
  return spawnSync(process.execPath, [cliEntry, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DSH_HOME: dshHome },
  })
}

/** 从 pnpm 输出解析被忽略的构建脚本包名（"Ignored build scripts: a, b"）。 */
function ignoredBuildScripts(text) {
  const names = []
  for (const match of text.matchAll(/Ignored build scripts:\s*([^\r\n]+)/g)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+/)[0]
      if (name !== '') names.push(name)
    }
  }
  return [...new Set(names)]
}

function pluginSpecSource(spec) {
  if (spec.source === 'npm') return `${spec.pkg}@${spec.version ?? 'latest'}`
  if (spec.source === 'github') return `github:${spec.pkg}`
  if (spec.source === 'link') return shortPath(resolve(root, spec.pkg))
  throw new Error(`unknown source type: ${spec.source} for ${spec.id}`)
}

/** Windows 用户名/目录带空格会把本地目录安装拆成多段参数 → 用临时 bat 拿 8.3 短路径。 */
function shortPath(path) {
  if (process.platform !== 'win32' || !path.includes(' ')) return path
  const bat = join(tmpdir(), `shortpath-${process.pid}.bat`)
  writeFileSync(bat, `@echo off\r\nfor %%I in ("${path}") do @echo %%~sI\r\n`)
  const result = spawnSync('cmd.exe', ['/c', bat], { encoding: 'utf8' })
  rmSync(bat, { force: true })
  const output = (result.stdout ?? '').trim().split(/\r?\n/).pop() ?? ''
  if (output !== '' && !output.includes(' ')) {
    console.log(`installer: shortPath ${path} -> ${output}`)
    return output
  }
  return path
}

console.log(`installer: DSH_HOME=${dshHome}, profile=${profile} (${cliMode ? 'npm CLI mode' : 'source mode'})`)
mkdirSync(dshHome, { recursive: true })
if (!cliMode) ensureWebProfile(dshHome)
ensureProfileNpmrc()

// 1. 核心插件
let installed = 0
let skipped = 0
for (const spec of manifest.core) {
  if (only !== null && !only.has(spec.id)) continue
  if (!(spec.profile ?? ['web']).includes(profile)) continue
  const source = pluginSpecSource(spec)
  // 幂等探测：profile manifest 里已有该 bundle 名即跳过
  const manifestPath = join(profileDir, 'package.json')
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
  let result = runCapture(['plugin', '--profile', profile, 'add', source])
  if (result.status !== 0) {
    // prepare 脚本被 pnpm 拦截 → 解析包名、加 allowBuilds、重试
    const text = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    const ignored = ignoredBuildScripts(text)
    if (ignored.length > 0) {
      ensureAllowBuilds(ignored)
      console.log(`installer: retry ${spec.id} after allowBuilds`)
      result = runCapture(['plugin', '--profile', profile, 'add', source])
    }
    // 网络抖动 → 最多再补 2 次重试
    for (let attempt = 0; attempt < 2 && result.status !== 0; attempt++) {
      console.log(`installer: retry ${spec.id} (network, attempt ${attempt + 1}/2)`)
      result = runCapture(['plugin', '--profile', profile, 'add', source])
    }
  }
  if (result.status === 0) {
    installed++
  } else {
    console.error(`❌ core install failed: ${spec.id}\n${result.stderr ?? ''}\n${result.stdout ?? ''}`)
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
