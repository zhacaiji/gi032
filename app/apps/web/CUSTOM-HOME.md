# CUSTOM-HOME.md — 用户自定义首页方案

> 让 `/` 路由支持"开发者另写一版首页 SFC 覆盖默认首页"，跟 `public/user-data/` 的数据 overlay 风格对齐：**约定位置 + 文件存在则覆盖**。

## 目标

- `/` 路由仍由 `app/pages/index.vue` 接管，**只有一个路由入口**，不污染路由表。
- 存在约定位置的"自定义首页 SFC" → 渲染它。
- 不存在 → 渲染当前那版首页（Hero / 关键指标 / 进入模块 / 最近动态）作为 fallback，**行为零变化**。
- 自定义首页 SFC **不入库**（写在 `.gitignore`），跟 `public/user-data/` 一样只在本机生效，不污染团队。
- 切换不需要重启 dev server —— Vite HMR 在你存盘后自动 reload。

## 同步改动（顺手做）

- **`nav.json`**：删除 `key: home1`（label 是"首页"、嵌 google 的 iframe 入口），把 `key: home`（path `/`）的 label / label_i18n 从"简介示例"改成"首页" / "Home"。这样顶部导航只剩一个"首页"且就指向 `/`，跟自定义首页机制语义一致。
- **`pages/index.vue` 分发器**：`useHead({ title: '首页' })`，替换掉原来的 `'简介示例'`。

## 非目标（本次不做）

- ❌ 数据层 overlay 描述首页（"Hero 文案 / 卡片 / 链接来自 JSON"）—— 你前面明确否掉这条。
- ❌ 运行时 HTML / Markdown overlay（XSS 风险，需要 sanitize 体系）。
- ❌ 修默认首页里 fallback 内容的其它问题（硬编码 stats / updates、缺 i18n）。
  这些等单独开清单再处理，**这次保持原状搬过去** `HomeDefault.vue`，避免一锅炖混淆。
- ❌ 改 `useDataSource` / `user-data` 现有数据 overlay 机制。

## 现状速览

- 当前 `app/pages/index.vue` 直接渲染 Hero + 4 个硬编码统计 + `entries`（来自 `useNav()`）+ 3 条硬编码动态。
- 已有数据 overlay 机制（`public/user-data/<同名>.json`）只覆盖 JSON 数据，不覆盖 SFC。
- Nuxt 4 + Vite 7 + Node 24 + Windows 上 SSR 拉数据会 OOM，所以项目里所有数据获取走 `useAsyncData({ server: false })`。新增首页分发器要继续遵守。

## 备选方案对比

| 方案 | 检测时机 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- | --- |
| **A. `import.meta.glob` 编译期探测**（选定） | 编译期 | 零运行时网络请求；不存在不报错；HMR 自动 reload；语义跟 Vite 原生一致 | 仅支持相对路径字面量；新增/删除自定义文件后需要 dev server 热重启一次（HMR 触发） | ✅ |
| B. `defineAsyncComponent` + dynamic import | 运行时 | 写法直观 | 文件不存在时 Vite 编译期就报错 —— **走不通** | ❌ |
| C. HTTP 探测 `/api/has-custom-home` | 运行时 | 真"运行时存在性"判断 | 引入 server route、首屏多一个请求、跟编译期组件耦合矛盾 | ❌ |
| D. Nuxt hook 在编译期改写路由表 | 编译期 | 路由层切换最干净 | 写 Nuxt module / kit hook 成本高，对单页改造杀鸡用牛刀 | ❌ |

**选定 A**：`import.meta.glob` 对**不存在的相对路径不会报错**，编译期返回空对象。这就是它适合做"约定位置 + 存在则覆盖"的原因。

## 文件布局

```
app/
├── pages/
│   └── index.vue                          ← 改为分发器（薄壳）
├── components/
│   └── home/
│       ├── HomeDefault.vue                ← 从原 index.vue 整体搬过来（入库）
│       ├── HomeCustom.example.vue         ← 模板（入库，给用户抄作业）
│       └── HomeCustom.vue                 ← 用户自定义（.gitignore，本机生效）
└── ...
.gitignore                                  ← 加一行 app/components/home/HomeCustom.vue
CUSTOM-HOME.md                              ← 本文件（入库）
```

## 关键代码草案（伪代码）

### `app/pages/index.vue`

```vue
<script setup lang="ts">
useHead({ title: '首页' }); // 同步 nav label，替换掉原来的 '简介示例'
// import.meta.glob：对不存在的相对路径返回空对象，不会报错。
// eager: true → 同步打包进 bundle（只 glob 一个文件，开销可忽略）。
const customs = import.meta.glob<{ default: Component }>(
  '../components/home/HomeCustom.vue',
  { eager: true },
);
const CustomHome = Object.values(customs)[0]?.default;
</script>

<template>
  <component :is="CustomHome ?? HomeDefault" />
</template>
```

要点：
- `import.meta.glob` 参数必须是**相对路径字面量**，不能用 alias（`~/`）或变量 —— Vite 限制。
- `eager: true` + 只 glob 一个文件，零额外网络请求，零异步等待。
- `Object.values(customs)[0]` 命中 0 或 1 个，没有"多个候选"的歧义。
- 模板用 `<component :is>` 而不是 `v-if/v-else` —— 单分支渲染，避免不必要的子树挂载。

### `app/components/home/HomeDefault.vue`

把当前 `app/pages/index.vue` 的 `<template>` 和 `<script setup>` **整体搬过来**，零行为变化。
唯一改动是把里头的 `useHead(...)` 删掉（移到 `pages/index.vue` 分发器层），避免两边各 set 一次。

### `app/components/home/HomeCustom.example.vue`

```vue
<!-- 拷贝本文件为 HomeCustom.vue，存盘即覆盖默认首页。-->
<!-- HomeCustom.vue 已在 .gitignore，不会进 commit。-->
<script setup lang="ts">
// 你想要的逻辑
</script>

<template>
  <div class="p-10">
    <h1 class="font-display text-3xl font-semibold">
      Hello, custom home.
    </h1>
    <p class="mt-4 text-ink-600">
      改这里。任何 shadcn-vue / Tailwind v4 / VueUse / Pinia 都可以用。
    </p>
  </div>
</template>
```

### `.gitignore` 追加

```
# 用户自定义首页：本机生效，不入库（机制详见 apps/web/CUSTOM-HOME.md）
app/components/home/HomeCustom.vue
```

## 用户使用流程

1. `cp app/components/home/HomeCustom.example.vue app/components/home/HomeCustom.vue`
2. 编辑 `HomeCustom.vue`，保存。
3. **首次新建文件后**：Vite HMR 不一定会自动识别新增的 glob 匹配文件，需要让 dev server 重启一次（改 `nuxt.config.ts` 任意空白 / `Ctrl+C` 重起 / 等 Nuxt 自身重启）。**之后改这个文件正常 HMR**。
4. 不想用了：删掉 `HomeCustom.vue`，或改名为 `HomeCustom.disabled.vue`。

> 这条"首次需重启"的限制来自 `import.meta.glob` 的编译期语义，不是 bug。

## 验证 / 测试

### 单元测试（vitest）

新建 `tests/custom-home.spec.ts`，两个用例：

1. **fallback**：mock `import.meta.glob` 返回 `{}` → 断言渲染 `HomeDefault`。
2. **命中**：mock `import.meta.glob` 返回 `{ '../components/home/HomeCustom.vue': { default: <stub> } }` → 断言渲染 stub。

由于 `import.meta.glob` 是 Vite 编译期 API，单元测试里不容易直接 mock。变通做法：
- 把"挑选哪个组件"的逻辑抽成纯函数 `pickHomeComponent(customs, fallback)`，单测这个函数。
- `index.vue` 里调用这个纯函数，模板层不再有判断。

### 浏览器验收（chrome-devtools MCP）

- `pnpm dev` 启动
- chrome-devtools navigate `http://localhost:3000/`，确认 fallback 行为（看到"运营看板"标题）+ 截图
- 在本机创建一个 `HomeCustom.vue`（最小内容："Hello, custom home."），重启 dev → 再访问 `/`，确认命中 + 截图
- 删除 `HomeCustom.vue` → 重启 → 再访问 `/`，确认回 fallback

## 风险与边界

| 风险 | 应对 |
| --- | --- |
| `HomeCustom.vue` 跟 `HomeDefault.vue` 同名风险 | 不存在 —— 不同文件名，不同位置。 |
| 用户写出错的 SFC（编译失败） | Vite 编译期报错，dev server 红屏，删 / 修复后恢复。Fallback 不会被"绕过"，因为分发器编译同样要过。 |
| 用户在 `HomeCustom.vue` 里 import 项目代码 | 允许且鼓励。auto-import 也照常工作。 |
| 团队成员误把 `HomeCustom.vue` 提交 | `.gitignore` 已挡，`git status` 看不到；强制 `git add -f` 才能加进来 —— 不属于本机制的兜底范围。 |
| 切到 API 模式 / 未来切真后端 | 跟数据层无关，机制无感。 |

## 决策记录

- 2026-05-19：方案确定走"SFC 切换 + import.meta.glob 编译期检测 + .gitignore 不入库"。备选的"数据 overlay 描述首页"和"运行时 HTML/MD overlay"否掉，理由见上文备选方案对比。
- 2026-05-19：顺手把 `nav.json` 的"首页（iframe google）"删除、"简介示例"改名为"首页"，浏览器标签 `useHead` 统一改为"首页"。其它 fallback 内容里的 i18n 漏 / 硬编码 stats 等问题**不在本次范围**，搬迁时保持原样，等单独清理。
