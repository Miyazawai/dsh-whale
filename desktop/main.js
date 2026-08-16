// dsh-whale 桌面壳主进程：spawn DSH web（独立 DSH_HOME），就绪后在 Electron 窗口加载。
// 发布态：electron.exe 以 ELECTRON_RUN_AS_NODE=1 充当 node 跑内置 dsh CLI。
const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron')
const { spawn } = require('node:child_process')
const { join, dirname } = require('node:path')
const { existsSync, mkdirSync, writeFileSync } = require('node:fs')
const { homedir } = require('node:os')

const isDev = !app.isPackaged

// 1. 定位 dsh CLI 与 DSH_HOME
function resolveDshCli() {
  if (process.env.DSH_CLI !== undefined) return process.env.DSH_CLI
  if (isDev) {
    // 开发态：dsh-whale 根 node_modules 里放一份 @deepseek-ai/dsh 的链接
    const p = join(__dirname, '..', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
    if (existsSync(p)) return p
  }
  // 发布态：extraResources 里的 dsh-cli
  return join(process.resourcesPath, 'dsh-cli', 'lib', 'bin.js')
}

function resolveDshHome() {
  if (process.env.DSH_WHALE_HOME !== undefined) return process.env.DSH_WHALE_HOME
  const base = isDev
    ? join(__dirname, '..', '.dev', 'desktop-home')
    : join(app.getPath('userData'), 'dsh-home')
  mkdirSync(base, { recursive: true })
  return base
}

const DSH_CLI = resolveDshCli()
const DSH_HOME = resolveDshHome()
let dshChild = null
let tray = null
let mainWindow = null

function installPresets(home) {
  // 把内置预设拷进 $DSH_HOME/.agent-presets（发布态从 extraResources；开发态从 upstream）
  const presets = isDev
    ? [
        ['../upstream/dsh-anchored-standard/preset', 'anchored-standard'],
        ['../upstream/dsh-anchored-standard/zero-anchored-standard', 'zero-anchored-standard'],
        ['../upstream/dsh-anchored-standard/whoami-standard', 'whoami-standard'],
        ['../upstream/dsh-routing-suite/preset/preset', 'router-standard'],
      ]
    : [
        ['presets/anchored-standard', 'anchored-standard'],
        ['presets/zero-anchored-standard', 'zero-anchored-standard'],
        ['presets/whoami-standard', 'whoami-standard'],
        ['presets/router-standard', 'router-standard'],
      ]
  const { cpSync } = require('node:fs')
  const targetRoot = join(home, '.agent-presets')
  mkdirSync(targetRoot, { recursive: true })
  for (const [srcRel, id] of presets) {
    const src = isDev ? join(__dirname, srcRel) : join(process.resourcesPath, srcRel)
    const dst = join(targetRoot, id)
    if (!existsSync(dst) && existsSync(src)) cpSync(src, dst, { recursive: true })
  }
}

function installCorePlugins(home) {
  // 首次运行：读 config/bundles.json，把核心插件装配进 web profile（可插拔，用户可随时卸）
  const marker = join(home, '.dsh-whale-plugins-installed')
  if (existsSync(marker)) return
  const { readFileSync } = require('node:fs')
  const bundlesPath = isDev
    ? join(__dirname, '..', 'config', 'bundles.json')
    : join(process.resourcesPath, 'bundles.json')
  if (!existsSync(bundlesPath)) return
  const bundles = JSON.parse(readFileSync(bundlesPath, 'utf8'))
  const core = bundles.core ?? []
  const add = (source) => new Promise(resolve => {
    const child = spawn(process.execPath, ['--expose-internals', DSH_CLI, 'plugin', '--profile', 'web', 'add', source], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_HOME: home },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.on('exit', () => resolve())
  })
  const install = async () => {
    console.log(`[dsh-whale] 首次运行：装配 ${core.length} 个核心插件…`)
    for (const spec of core) {
      if (spec.install === 'manual') continue
      const source = spec.source === 'npm'
        ? `${spec.pkg}@${spec.version ?? 'latest'}`
        : spec.source === 'github' ? `github:${spec.pkg}` : spec.pkg
      try { await add(source); console.log(`[dsh-whale]   核心 ✓ ${spec.id}`) }
      catch { console.warn(`[dsh-whale]   核心 ✗ ${spec.id}`) }
    }
    try { writeFileSync(marker, String(Date.now())) } catch { }
    console.log('[dsh-whale] 核心插件装配完成')
  }
  install()
}

function spawnDsh() {
  installPresets(DSH_HOME)
  installCorePlugins(DSH_HOME)
  console.log(`[dsh-whale] DSH_CLI=${DSH_CLI}`)
  console.log(`[dsh-whale] DSH_HOME=${DSH_HOME}`)
  dshChild = spawn(process.execPath, ['--expose-internals', DSH_CLI, '--profile', 'web', '--port', '0'], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_HOME },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let buf = ''
  const onData = stream => chunk => {
    const text = chunk.toString('utf8')
    buf += text
    process.stdout.write(`[dsh] ${text}`)
    const m = /dsh web: (http:\/\/127\.0\.0\.1:\d+)/.exec(buf)
    if (m) {
      buf = ''
      openWindow(m[1])
    }
  }
  dshChild.stdout.on('data', onData('stdout'))
  dshChild.stderr.on('data', onData('stderr'))
  dshChild.on('exit', code => {
    console.log(`[dsh-whale] dsh exited (${code})`)
    if (code !== 0 && !app.isQuitting) {
      setTimeout(() => { if (!app.isQuitting) spawnDsh() }, 2000)
    }
  })
}

function openWindow(url) {
  if (mainWindow !== null && !mainWindow.isDestroyed()) { mainWindow.loadURL(url); return }
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'dsh-whale（鲸鱼包）',
    webPreferences: { preload: join(__dirname, 'preload.cjs') },
  })
  mainWindow.loadURL(url)
  mainWindow.on('close', e => {
    if (!app.isQuitting) { e.preventDefault(); mainWindow.hide() }
  })
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[dsh-whale] window loaded:', mainWindow.webContents.getTitle())
  })
  if (tray === null) setupTray()
}

function setupTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('dsh-whale（鲸鱼包）')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { label: '退出', click: () => { app.isQuitting = true; app.quit() } },
  ]))
}

app.whenReady().then(() => {
  app.isQuitting = false
  spawnDsh()
  app.on('activate', () => { if (mainWindow !== null) mainWindow.show() })
})

app.on('window-all-closed', e => {
  // 常驻托盘，不退出
  if (mainWindow !== null && !mainWindow.isDestroyed()) mainWindow.hide()
})

app.on('before-quit', () => {
  app.isQuitting = true
  if (dshChild !== null && !dshChild.killed) dshChild.kill()
})
