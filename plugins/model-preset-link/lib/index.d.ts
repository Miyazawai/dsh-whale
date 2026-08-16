/**
 * @dsh-whale/model-preset-link host 半区。
 * 持有模型↔预设映射配置，向 client 提供配置读取与开关状态。
 * 切换动作由 client 半区执行（blank 会话 agentPresets.select）。
 */
import { Context } from 'cordis';
export declare const name = "model-preset-link";
export interface Config {
    /** 是否自动切换（设置页可关） */
    autoSwitch: boolean;
    /** 家族 → 预设列表 */
    families: Record<string, string[]>;
    /** 家族 → 需启停的插件栈 */
    pluginStack: Record<string, string[]>;
    /** 家族判定正则 */
    modelPatterns: Record<string, string>;
    /** 未知模型回落家族 */
    fallbackFamily: string;
}
export declare const Config: import('cordis').Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
