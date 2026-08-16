// dsh-whale TUI 冒烟：用 node-pty 起伪终端跑 dsh-tui，验证真实渲染输出。
// 用法: DSH_CLI=<npm bin.js> DSH_HOME=<home> node scripts/smoke-tui.mjs
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
// node-pty 在 dsh-whale workspace 的 pnpm store 里，直接指到 store 包
const ptyPath = resolve(import.meta.dirname, '../node_modules/.pnpm/node-pty@1.1.0/node_modules/node-pty')
const pty = require(ptyPath)

const cli = resolve(process.env.DSH_CLI)
const dshHome = resolve(process.env.DSH_HOME)

const child = pty.spawn(process.execPath, [cli, '--profile', 'tui'], {
  name: 'xterm-256color',
  cols: 100,
  rows: 30,
  cwd: dshHome,
  env: { ...process.env, DSH_HOME: dshHome, DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ?? '' },
})

let output = ''
const deadline = Date.now() + 20000
child.onData(data => { output += data })

await new Promise(resolveDone => {
  const timer = setInterval(() => {
    const hasTui = /[┌┐└┘│─]|whale|dsh|Deep|thinking|esc|/i.test(output) && output.length > 200
    if (hasTui || Date.now() > deadline) {
      clearInterval(timer)
      resolveDone()
    }
  }, 500)
})

child.kill()
const ansi = output.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '')
console.log('=== TUI 渲染输出（去 ANSI 后前 20 行）===')
console.log(ansi.split('\n').slice(0, 20).join('\n'))
console.log(`\n=== 原始字节: ${output.length} ===`)
process.exit(0)
