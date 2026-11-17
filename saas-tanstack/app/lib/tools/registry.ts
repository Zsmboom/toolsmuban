/**
 * 工具注册表 —— 用本模板搭具体工具站时，主要就是往这里加条目。
 *
 * 每个工具声明自己的 id、消耗积分数和是否需要登录；
 * 真正的执行逻辑放在 ~/lib/tools/server-fns.ts 的 handlers 里。
 */

export interface ToolDefinition {
  id: string;
  /** i18n key 前缀，指向 messages.tools.<nameKey> */
  nameKey: string;
  descriptionKey: string;
  /** 每次运行消耗的积分 */
  cost: number;
  requiresAuth: boolean;
}

export const TOOLS = {
  demo: {
    id: 'demo',
    nameKey: 'demoName',
    descriptionKey: 'demoDescription',
    cost: 1,
    requiresAuth: true,
  },
} satisfies Record<string, ToolDefinition>;

export type ToolId = keyof typeof TOOLS;

export const toolList: ToolDefinition[] = Object.values(TOOLS);

export function isToolId(value: unknown): value is ToolId {
  return typeof value === 'string' && value in TOOLS;
}

export function getTool(id: ToolId): ToolDefinition {
  return TOOLS[id];
}
