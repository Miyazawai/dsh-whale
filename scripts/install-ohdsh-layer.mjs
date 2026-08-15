// dsh-whale 开发环辅助：把 oh-dsh 自己的插件层装进 dev profile。
// 构建产物在 dist/plugins/<dir>/*，而插件包的 files 指向包内 dist/ —— 先镜像再 add。
// 用法: DSH_SOURCE=<dsh checkout> node scripts/install-ohdsh-layer.mjs [--home <dshHome>]
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
function arg(name, fallback) {
  const index = process.argv.indexOf(name)
  return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback
}
if (!(process.env.DSH_SOURCE !== undefined && process.env.DSH_SOURCE !== '')) throw new Error('DSH_SOURCE env is required')
const dshSource = resolve(process.env.DSH_SOURCE)
const cliEntry = join(dshSource, 'apps', 'cli', 'lib', 'bin.js')
const dshHome = resolve(arg('--home', join(root, '.dev', 'dsh-home')))
const profile = 'web'

const WEB_PLUGINS = ['skins', 'sidebar', 'panel-controls', 'pinned-summary', 'plugin-marketplace', 'better-sidebar-runtime']

function shortPath(path) {
  if (process.platform !== 'win32' || !path.includes(' ')) return path
  const bat = join(tmpdir(), `shortpath-${process.pid}.bat`)
  writeFileSync(bat, `@echo off\r\nfor %%I in ("${path}") do @echo %%~sI\r\n`)
  const result = spawnSync('cmd.exe', ['/c', bat], { encoding: 'utf8' })
  rmSync(bat, { force: true })
  const output = (result.stdout ?? '').trim().split(/\r?\n/).pop() ?? ''
  return output !== '' && !output.includes(' ') ? output : path
}

function add(sourceDir) {
  const result = spawnSync(process.execPath, [cliEntry, 'plugin', '--profile', profile, 'add', shortPath(sourceDir)], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DSH_HOME: dshHome },
  })
  if (result.status !== 0) {
    console.error(`❌ add failed for ${sourceDir}\n${result.stderr ?? ''}\n${result.stdout ?? ''}`)
    return false
  }
  console.log(`✅ added ${sourceDir}`)
  return true
}

const profileManifestPath = join(dshHome, 'profiles', profile, 'package.json')
const profileManifest = JSON.parse(readFileSync(profileManifestPath, 'utf8'))
const bundles = profileManifest.dsh?.profile?.bundles ?? []

for (const dir of WEB_PLUGINS) {
  const pkgDir = join(root, 'plugins', dir)
  const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
  if (bundles.includes(manifest.name)) {
    console.log(`⏭️  skip ${manifest.name} (already in profile)`)
    continue
  }
  // 镜像构建产物
  const built = join(root, 'dist', 'plugins', dir)
  if (!existsSync(join(built, 'index.js'))) {
    console.error(`❌ built dist missing: ${built}; run pnpm run build first`)
    continue
  }
  const targetDist = join(pkgDir, 'dist')
  rmSync(targetDist, { recursive: true, force: true })
  mkdirSync(targetDist, { recursive: true })
  cpSync(built, targetDist, { recursive: true })
  console.log(`📦 mirrored ${dir} -> ${targetDist}`)
  add(pkgDir)
}
console.log('oh-dsh layer install done')
