import type { Component } from 'vue';

/**
 * `import.meta.glob` 返回形如 `{ '<相对路径>': { default: Component } }`。
 * 命中 0 个文件时是空对象（Vite 对不存在的相对路径不会报错），命中 1 个时只有一个 entry。
 */
type GlobMap = Record<string, { default: Component }>;

/**
 * 抽出"挑哪个组件"的判断，让 pages/index.vue 模板层无分支、单测可绕开 import.meta.glob 直接验证逻辑。
 *
 * 约定 customs 至多 1 个 entry（HomeCustom.vue 单文件 glob）。多 entry 时取第一个，行为可预测、不抛错。
 */
export function pickHomeComponent(customs: GlobMap, fallback: Component): Component {
  return Object.values(customs)[0]?.default ?? fallback;
}
