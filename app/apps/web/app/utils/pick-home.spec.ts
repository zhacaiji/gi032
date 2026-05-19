import type { Component } from 'vue';
import { describe, expect, it } from 'vitest';
import { pickHomeComponent } from './pick-home';

const Fallback = { name: 'Fallback', template: '<div>fallback</div>' } as Component;
const Custom = { name: 'Custom', template: '<div>custom</div>' } as Component;

describe('pickHomeComponent', () => {
  it('returns fallback when customs is empty (HomeCustom.vue not present)', () => {
    expect(pickHomeComponent({}, Fallback)).toBe(Fallback);
  });

  it('returns the custom default export when customs has one entry', () => {
    const customs = {
      '../components/home/HomeCustom.vue': { default: Custom },
    };
    expect(pickHomeComponent(customs, Fallback)).toBe(Custom);
  });

  it('returns the first entry when customs has multiple (defensive)', () => {
    // 实际 glob 永远只命中 0 或 1 个 HomeCustom.vue；这条用例只验证多 entry 时行为可预测、不抛错。
    const customs = {
      'a': { default: Custom },
      'b': { default: Fallback },
    };
    expect(pickHomeComponent(customs, Fallback)).toBe(Custom);
  });
});
