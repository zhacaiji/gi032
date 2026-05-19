<!--
  用户自定义首页模板。

  使用：
    cp app/components/home/HomeCustom.example.vue app/components/home/HomeCustom.vue
  HomeCustom.vue 已在 .gitignore，本机生效不入库；首次新建后需重启一次 dev server。
  详见 apps/web/CUSTOM-HOME.md。
-->
<script setup lang="ts">
// 你的逻辑写这里。shadcn-vue / Tailwind v4 / VueUse / Pinia 都可以照常使用。
</script>

<template>
  <div class="px-10 py-20">
    <h1 class="font-display text-[40px] leading-[1.15] font-semibold text-ink-900 tracking-tight">
      Hello, custom home.
    </h1>
    <p class="mt-4 text-[15px] text-ink-600 leading-relaxed">
      这是用户自定义首页模板。改这里。
    </p>
  </div>
</template>
