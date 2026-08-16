/**
 * @dsh-whale/model-preset-link client 半区。
 * 监听按会话的模型选择（ctx.modelDirectories），模型切换时按家族自动选预设：
 *   - blank（未开跑）会话：调 agentPresets.select 直接切换
 *   - 已开跑会话：DSH 锁定预设，只记录提示（宿主拒绝中途换预设）
 * 提供设置区开关（localStorage 持久化，toggleable）。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings'

export const inject = ['sessions', 'modelDirectories', 'connection', 'remote', 'slots']

const LS_KEY = 'dsh-whale.model-preset-link.enabled'
const FAMILIES: Record<string, string[]> = {
  flash: ['router-standard'],
  pro: ['anchored-standard', 'zero-anchored-standard', 'whoami-standard'],
}
const PATTERNS = { flash: /flash/i, pro: /pro/i }
const FALLBACK = 'pro'

function familyOf(modelId: string): string | null {
  for (const [family, re] of Object.entries(PATTERNS)) {
    if (re.test(modelId)) return family
  }
  return null
}

function toggleLabel(enabled: boolean): string {
  return enabled ? '自动切换：开（flash→Router Standard，pro→Anchored Standard）' : '自动切换：关（手动选预设）'
}

export function apply(ctx: ClientContext): void {
  const { api } = ctx.get('connection') as ConnectionHandle
  const enabled = () => localStorage.getItem(LS_KEY) !== 'off'

  // 订阅会话名册变化 + 当前会话的模型目录，模型变化时触发联动
  ctx.effect(() => {
    const stopList = ctx.sessions.list.subscribe(() => {
      const state = ctx.sessions.list.getSnapshot()
      const currentId = state.current
      if (currentId === undefined || !enabled()) return
      const summary = state.byId[currentId]
      if (summary === undefined || summary.blank !== true) return
      const directory = ctx.modelDirectories.directoryFor(currentId as never)
      const current = directory.store.getSnapshot().current
      if (current === undefined) return
      const family = familyOf(String(current.model))
      if (family === null) return
      const preset = FAMILIES[family]?.[0]
      if (preset === undefined || summary.agentPreset === preset) return
      api.agentPresets.select({ sessionId: currentId as never, agentPreset: preset })
        .then((result: { ok: boolean; error?: { code?: string } }) => {
          if (!result.ok) console.warn('[model-preset-link] select failed:', result.error?.code)
        })
    })
    return () => stopList()
  }, 'model-preset-link: session roster watch')

  // 设置区：一键开关
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'model-preset-link',
    order: 60,
    label: () => '模型↔预设联动',
    component: () => ({
      render() {
        const el = document.createElement('div')
        const btn = document.createElement('button')
        btn.style.cssText = 'font-family:ui-monospace,monospace;font-size:12px;padding:6px 12px;border-radius:6px;cursor:pointer;'
        const refresh = () => {
          btn.textContent = toggleLabel(enabled())
        }
        refresh()
        btn.addEventListener('click', () => {
          localStorage.setItem(LS_KEY, enabled() ? 'off' : 'on')
          refresh()
        })
        el.append(btn)
        return { dispose: () => { } }
      },
    }),
  }), 'model-preset-link: settings toggle')
}
