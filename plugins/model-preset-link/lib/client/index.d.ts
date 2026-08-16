/**
 * @dsh-whale/model-preset-link client 半区。
 * 监听按会话的模型选择（ctx.modelDirectories），模型切换时按家族自动选预设：
 *   - blank（未开跑）会话：调 agentPresets.select 直接切换
 *   - 已开跑会话：DSH 锁定预设，只记录提示（宿主拒绝中途换预设）
 * 提供设置区开关（localStorage 持久化，toggleable）。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
