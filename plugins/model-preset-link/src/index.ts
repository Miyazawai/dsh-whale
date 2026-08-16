/**
 * @dsh-whale/model-preset-link host 半区。
 * 持有模型↔预设映射配置，向 client 提供配置读取与开关状态。
 * 切换动作由 client 半区执行（blank 会话 agentPresets.select）。
 */
import { Context } from 'cordis'

export const name = 'model-preset-link'

export interface Config {
  /** 是否自动切换（设置页可关） */
  autoSwitch: boolean
  /** 家族 → 预设列表 */
  families: Record<string, string[]>
  /** 家族 → 需启停的插件栈 */
  pluginStack: Record<string, string[]>
  /** 家族判定正则 */
  modelPatterns: Record<string, string>
  /** 未知模型回落家族 */
  fallbackFamily: string
}

export const Config: import('cordis').Schema<Config> = {
  autoSwitch: true,
  families: {
    flash: ['router-standard'],
    pro: ['anchored-standard', 'zero-anchored-standard', 'whoami-standard'],
  },
  pluginStack: { flash: ['dsh-super-injector'], pro: [] },
  modelPatterns: { flash: '/flash/i', pro: '/pro/i' },
  fallbackFamily: 'pro',
}

export function apply(ctx: Context, config: Config) {
  ctx.provide('modelPresetLink', {
    config,
    getState: () => ({ autoSwitch: config.autoSwitch }),
    setAutoSwitch: (value: boolean) => {
      config.autoSwitch = value
      return config.autoSwitch
    },
  })
}
