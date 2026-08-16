// dsh-whale 桌面壳主进程：spawn DSH web（独立 DSH_HOME），就绪后在 Electron 窗口加载。
// 发布态：electron.exe 以 ELECTRON_RUN_AS_NODE=1 充当 node 跑内置 dsh CLI。
const { app, BrowserWindow, Tray, Menu, nativeImage, dialog } = require('electron')
const { spawn } = require('node:child_process')
const { join } = require('node:path')
const { existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync } = require('node:fs')

const isDev = !app.isPackaged

// ---------- 日志：发布态 GUI 无控制台，console 输出落到日志文件 ----------
let logStream = null
function initLog(home) {
  try {
    const p = join(home, 'dsh-whale.log')
    logStream = p
    appendFileSync(p, `\n===== ${new Date().toISOString()} dsh-whale start =====\n`)
  } catch { }
}
function log(...args) {
  const line = args.map(a => typeof a === 'string' ? a : safeString(a)).join(' ')
  try { if (process.stdout && process.stdout.write) process.stdout.write(line + '\n') } catch { }
  if (logStream) { try { appendFileSync(logStream, line + '\n') } catch { } }
}
function safeString(v) {
  try { return JSON.stringify(v) } catch { return String(v) }
}

// 1. 定位 dsh CLI 与 DSH_HOME
function resolveDshCli() {
  if (process.env.DSH_CLI !== undefined) return process.env.DSH_CLI
  if (isDev) {
    // 开发态：dsh-whale 根 node_modules 里放一份 @deepseek-ai/dsh 的链接
    const p = join(__dirname, '..', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
    if (existsSync(p)) return p
  }
  // 发布态：extraResources 里的 dsh-cli（v0.1.3 起为完整 npm 安装，含 node_modules）
  const withNm = join(process.resourcesPath, 'dsh-cli', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
  if (existsSync(withNm)) return withNm
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
let splashWindow = null
let cliReady = false
let cliFailCount = 0

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

// 返回 true=成功 false=失败
function addPlugin(source) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, ['--expose-internals', DSH_CLI, 'plugin', '--profile', 'web', 'add', source], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_HOME },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    child.stdout.on('data', c => { out += c.toString('utf8') })
    child.stderr.on('data', c => { out += c.toString('utf8') })
    child.on('error', err => { log(`[dsh-whale]   spawn error: ${safeString(err)}`); resolve(false) })
    child.on('exit', code => {
      if (code !== 0) log(`[dsh-whale]   plugin add failed (${code}): ${source}\n${out.slice(-400)}`)
      resolve(code === 0)
    })
  })
}

// 首次运行：装配核心插件。幂等：marker 记录已成功的 id，失败的留在下次重试。
async function installCorePlugins(home) {
  const markerPath = join(home, '.dsh-whale-plugins-installed')
  let done = new Set()
  try {
    if (existsSync(markerPath)) {
      const m = JSON.parse(readFileSync(markerPath, 'utf8'))
      if (Array.isArray(m.ok)) done = new Set(m.ok)
    }
  } catch { /* 旧版纯文本 marker，当作未完成重装 */ }

  const bundlesPath = isDev
    ? join(__dirname, '..', 'config', 'bundles.json')
    : join(process.resourcesPath, 'bundles.json')
  if (!existsSync(bundlesPath)) return
  let bundles
  try { bundles = JSON.parse(readFileSync(bundlesPath, 'utf8')) } catch (e) { log(`[dsh-whale] bundles.json 解析失败: ${safeString(e)}`); return }
  const core = bundles.core ?? []

  const todo = core.filter(s => !done.has(s.id) && s.install !== 'manual')
  if (todo.length === 0) return
  log(`[dsh-whale] 首次运行：装配 ${todo.length} 个核心插件…`)
  for (const spec of todo) {
    let source = spec.pkg
    if (spec.source === 'npm') source = `${spec.pkg}@${spec.version ?? 'latest'}`
    else if (spec.source === 'github') source = `github:${spec.pkg}`
    else if (spec.source === 'link') {
      const p = isDev ? join(__dirname, '..', spec.pkg) : join(process.resourcesPath, spec.pkg)
      source = existsSync(p) ? p : spec.pkg
    }
    const ok = await addPlugin(source)
    log(`[dsh-whale]   核心 ${ok ? '✓' : '✗'} ${spec.id}`)
    if (ok) done.add(spec.id)
  }
  try { writeFileSync(markerPath, JSON.stringify({ version: '1', ok: [...done], time: Date.now() })) } catch { }
  const failed = core.filter(s => !done.has(s.id) && s.install !== 'manual')
  if (failed.length > 0) log(`[dsh-whale] 有 ${failed.length} 个插件未装成功（${failed.map(f => f.id).join(', ')}），下次启动将自动重试`)
  else log('[dsh-whale] 核心插件装配完成')
}

function createSplash() {
  if (splashWindow !== null && !splashWindow.isDestroyed()) return
  splashWindow = new BrowserWindow({
    width: 420,
    height: 260,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    center: true,
    show: false,
    webPreferences: { preload: join(__dirname, 'preload.cjs') },
  })
  splashWindow.setAlwaysOnTop(true, 'screen-saver')
  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
html,body{margin:0;height:100%;background:#0b1220;color:#e6edf7;font-family:"Microsoft YaHei",system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;user-select:none}
.logo{font-size:52px;line-height:1}
.title{font-size:18px;font-weight:600}
.sub{font-size:13px;color:#8fa3bf;text-align:center;padding:0 28px;line-height:1.7}
.spinner{width:34px;height:34px;border:3px solid #274060;border-top-color:#4da3ff;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>
<div class="logo">🐋</div>
<div class="title">dsh-whale（鲸鱼包）</div>
<div class="sub">正在启动 DSH 内核…<br>首次运行需联网下载核心插件，请稍候</div>
<div class="spinner"></div>
</body></html>`))
  splashWindow.once('ready-to-show', () => splashWindow.show())
}

function openWindow(url) {
  cliReady = true
  if (mainWindow !== null && !mainWindow.isDestroyed()) { mainWindow.loadURL(url); mainWindow.show(); return }
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'dsh-whale（鲸鱼包）',
    show: false,
    webPreferences: { preload: join(__dirname, 'preload.cjs') },
  })
  mainWindow.loadURL(url)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (splashWindow !== null && !splashWindow.isDestroyed()) splashWindow.destroy()
    splashWindow = null
  })
  mainWindow.on('close', e => {
    if (!app.isQuitting) { e.preventDefault(); mainWindow.hide() }
  })
  mainWindow.webContents.on('did-finish-load', () => {
    log('[dsh-whale] window loaded:', mainWindow.webContents.getTitle())
  })
  if (tray === null) setupTray()
}

function spawnDsh() {
  log(`[dsh-whale] DSH_CLI=${DSH_CLI}`)
  log(`[dsh-whale] DSH_HOME=${DSH_HOME}`)
  log(`[dsh-whale] DSH_CLI exists=${existsSync(DSH_CLI)}`)
  if (!existsSync(DSH_CLI)) {
    log('[dsh-whale] 致命：找不到 DSH CLI')
    dialog.showErrorBox('dsh-whale 启动失败', `找不到 DSH 内核：\n${DSH_CLI}\n\n请重新安装鲸鱼包。详细日志：\n${logStream ?? ''}`)
    app.quit()
    return
  }
  dshChild = spawn(process.execPath, ['--expose-internals', DSH_CLI, '--profile', 'web', '--port', '0'], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_HOME },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let buf = ''
  const onData = chunk => {
    const text = chunk.toString('utf8')
    buf += text
    if (buf.length > 65536) buf = buf.slice(-65536)
    log(`[dsh] ${text}`)
    const m = /dsh web: (http:\/\/127\.0\.0\.1:\d+)/.exec(buf)
    if (m) {
      buf = ''
      openWindow(m[1])
    }
  }
  dshChild.stdout.on('data', onData)
  dshChild.stderr.on('data', onData)
  dshChild.on('error', err => {
    log(`[dsh-whale] spawn error: ${safeString(err)}`)
    cliFailCount++
  })
  dshChild.on('exit', (code, signal) => {
    log(`[dsh-whale] dsh exited (code=${code} signal=${signal}) ready=${cliReady}`)
    if (cliReady) {
      // 曾经就绪过：正常退出则退出应用；异常退出尝试重启
      if (code !== 0 && !app.isQuitting) {
        cliFailCount++
        if (cliFailCount > 3) { log('[dsh-whale] 多次异常退出，停止重试'); return }
        setTimeout(() => { if (!app.isQuitting) spawnDsh() }, 2000)
      }
      return
    }
    // 从未就绪：说明 CLI 启动失败，尝试重启，最多 3 次
    cliFailCount++
    log(`[dsh-whale] 启动失败次数=${cliFailCount}`)
    if (cliFailCount >= 3) {
      log('[dsh-whale] 启动 3 次失败，弹窗告知用户')
      if (splashWindow !== null && !splashWindow.isDestroyed()) splashWindow.destroy()
      splashWindow = null
      dialog.showErrorBox('dsh-whale 启动失败', `DSH 内核连续 3 次启动失败。\n\n请把日志发给我们排查：\n${logStream ?? ''}`)
      app.quit()
      return
    }
    setTimeout(() => { if (!app.isQuitting && !cliReady) spawnDsh() }, 2000)
  })
}

async function boot() {
  app.isQuitting = false
  createSplash()
  initLog(DSH_HOME)
  installPresets(DSH_HOME)
  await installCorePlugins(DSH_HOME)
  spawnDsh()
}

app.whenReady().then(() => {
  boot()
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
