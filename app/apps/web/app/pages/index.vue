<script setup lang="ts">
import type { Component } from 'vue';
import HomeDefault from '~/components/home/HomeDefault.vue';
import { pickHomeComponent } from '~/utils/pick-home';

useHead({ title: '首页' });

/*
 * 用户自定义首页机制（详见 apps/web/CUSTOM-HOME.md）：
 * - 把 HomeCustom.example.vue 拷成 HomeCustom.vue 即覆盖首页；
 * - HomeCustom.vue 已在 .gitignore，本机生效不入库；
 * - 首次新增该文件后需要重启一次 dev，因为 import.meta.glob 是编译期收集。
 *
 * 注意：import.meta.glob 的路径必须是相对路径字面量，不能用 ~/ 别名或变量。
 */
const customs = import.meta.glob<{ default: Component }>(
  '../components/home/HomeCustom.vue',
  { eager: true },
);

const HomeView = pickHomeComponent(customs, HomeDefault);
</script>

<template>
  <component :is="HomeView" />
</template>
