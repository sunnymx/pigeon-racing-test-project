---
description: Vue 3 + Leaflet + Chart.js best practices for building modern frontend applications with reactive maps, data visualizations, and component-based architecture. Covers Composition API, responsive design, performance optimization, virtual scrolling, state management with Pinia, TypeScript integration, accessibility patterns, and memory leak prevention. Use when working with Vue 3, Leaflet maps, Chart.js charts, or building data visualization dashboards.
triggers:
  - path: "frontend/**/*.{vue,js,ts,html}"
  - path: "src/**/*.vue"
  - keyword: "vue 3"
  - keyword: "leaflet"
  - keyword: "chart.js"
  - keyword: "composition api"
  - keyword: "reactive map"
  - keyword: "pinia"
  - content: "import.*vue"
  - content: "L\\.map\\("
  - content: "new Chart\\("
  - content: "<script setup>"
---

# Vue 3 + Leaflet + Chart.js Guidelines

Production-ready patterns for building modern frontend applications with Vue 3, Leaflet maps, and Chart.js visualizations. This skill provides quick reference for common tasks and links to comprehensive guides for complex scenarios.

---

## Quick Decision Tree

**Need help with:**
- Vue 3 basics or state management? → See [Vue 3 Composition API](#vue-3-composition-api) or [vue-composition-api.md](references/vue-composition-api.md)
- Map integration or performance? → See [Leaflet Integration](#leaflet-map-integration) or [leaflet-map-integration.md](references/leaflet-map-integration.md)
- Chart updates or synchronization? → See [Chart.js Patterns](#chartjs-patterns) or [chart-js-patterns.md](references/chart-js-patterns.md)
- Component structure or testing? → See [Component Organization](#component-organization) or [component-organization.md](references/component-organization.md)
- Layout or accessibility? → See [UI Patterns](#uiux-patterns) or [ui-patterns.md](references/ui-patterns.md)

---

## Vue 3 Composition API

### Basic Component

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

onMounted(() => console.log('Component mounted'))
</script>

<template>
  <div>Count: {{ count }}, Doubled: {{ doubled }}</div>
</template>
```

### Common Pitfall: ref() vs reactive()

❌ Wrong: `reactive(0)` - reactive() expects object
✅ Correct: `ref(0)` for primitives, `reactive({})` for objects

**For details:** [vue-composition-api.md](references/vue-composition-api.md)

---

## Leaflet Map Integration

### Map Initialization

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const map = ref(null)

onMounted(() => {
  map.value = L.map('map').setView([24.75, 121.25], 9)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)
  setTimeout(() => map.value?.invalidateSize(), 100)
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>

<template>
  <div id="map" style="height: 500px; width: 100%;"></div>
</template>
```

### Common Pitfall: Memory Leaks

❌ Wrong: Not cleaning up map on unmount
✅ Correct: Always call `map.remove()` in `onUnmounted()`

**For details:** [leaflet-map-integration.md](references/leaflet-map-integration.md)

---

## Chart.js Patterns

### Reactive Chart Updates

```vue
<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Chart from 'chart.js/auto'

const chartCanvas = ref(null)
const chartInstance = ref(null)
const chartData = ref([10, 20, 30, 40, 50])

onMounted(() => {
  chartInstance.value = new Chart(chartCanvas.value, {
    type: 'line',
    data: { labels: ['A', 'B', 'C', 'D', 'E'], datasets: [{ data: chartData.value }] }
  })
})

watch(chartData, (newData) => {
  if (chartInstance.value) {
    chartInstance.value.data.datasets[0].data = newData
    chartInstance.value.update('none') // No animation
  }
})

onUnmounted(() => chartInstance.value?.destroy())
</script>

<template>
  <canvas ref="chartCanvas"></canvas>
</template>
```

### Common Pitfall: Chart Not Updating

❌ Wrong: `chartData.value.push(60)` - Doesn't trigger reactivity
✅ Correct: `chartData.value = [...chartData.value, 60]` - Replaces array

**For details:** [chart-js-patterns.md](references/chart-js-patterns.md)

---

## Component Organization

### Folder Structure (Production)

```
src/
├── modules/              # Feature modules
│   ├── track-filter/
│   │   ├── components/   # FilterPanel.vue, ResultsTable.vue
│   │   ├── composables/  # useTrackData.js, useMapLayers.js
│   │   └── store/        # filterStore.js (Pinia)
│   └── map-viz/
│       ├── components/   # LeafletMap.vue, ChartViewer.vue
│       └── composables/  # useMapResize.js
└── shared/
    ├── components/       # Button.vue, LoadingSpinner.vue
    └── composables/      # useDebounce.js, useFetch.js
```

### Composable Pattern

```js
// composables/useMapResize.js
import { onMounted, onUnmounted } from 'vue'

export function useMapResize(map) {
  const handleResize = () => {
    setTimeout(() => map.value?.invalidateSize(), 250)
  }

  onMounted(() => window.addEventListener('resize', handleResize))
  onUnmounted(() => window.removeEventListener('resize', handleResize))

  return { handleResize }
}
```

**For details:** [component-organization.md](references/component-organization.md)

---

## UI/UX Patterns

### Responsive Layout Pattern

```css
.main-content {
  display: flex;
  height: 100vh;
}

.left-panel {
  width: 400px;
  overflow-y: auto;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}
```

### CSS Variables Theme

```css
:root {
  --color-primary: #2563eb;
  --color-bg-white: #ffffff;
  --color-border: #e2e8f0;
  --radius-sm: 6px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}
```

**For details:** [ui-patterns.md](references/ui-patterns.md)

---

## Production Checklist

**Performance:**
- [ ] Virtual scrolling for 1000+ items (`vue-virtual-scroller`)
- [ ] PruneCluster for 50k+ map markers
- [ ] Chart.js decimation for large datasets
- [ ] Lazy loading with `defineAsyncComponent`
- [ ] Debounce resize handlers (250ms)

**Memory Management:**
- [ ] Clean up maps/charts in `onUnmounted`
- [ ] Remove event listeners in `onUnmounted`
- [ ] Clear timers/intervals

**Accessibility:**
- [ ] WCAG AA (contrast 4.5:1)
- [ ] Keyboard navigation
- [ ] ARIA labels

**Code Quality:**
- [ ] TypeScript strict mode
- [ ] Component tests (Vitest)
- [ ] E2E tests (Playwright)
- [ ] ESLint + Prettier

**Best Practices:**
- [ ] Composables for reusable logic
- [ ] Pinia for global state
- [ ] Responsive design with viewport units

---

## Current Project Analysis

**Project:** Pigeon Racing Track Filter (`frontend/index.html`, 1,737 lines)

**Strengths:**
- ✅ Vue 3 Composition API, reactive state
- ✅ Responsive map + dual charts
- ✅ CSV export, CSS variables

**High Priority Improvements:**
- Modular components (extract 10+)
- Memory leak prevention (`onUnmounted`)
- Virtual scrolling (1000+ rows)
- Pinia store, TypeScript

**Medium Priority:**
- Dark mode, accessibility, loading states

**Low Priority:**
- E2E tests, build tooling, PWA

**Migration:** See 4-phase plan in [component-organization.md](references/component-organization.md)

---

## Reference Documentation

### Comprehensive Guides
- [Vue 3 Composition API Reference](references/vue-composition-api.md) - ref/reactive, composables, state management, TypeScript, Vue 3.4+ features
- [Leaflet Map Integration](references/leaflet-map-integration.md) - Lifecycle, responsive design, performance, memory leaks, layer management
- [Chart.js Patterns](references/chart-js-patterns.md) - Reactive updates, multi-chart sync, performance, plugins, v4 migration
- [Component Organization](references/component-organization.md) - Architecture, folder structure, testing, migration roadmap
- [UI/UX Patterns](references/ui-patterns.md) - Responsive layout, dark mode, accessibility, virtual scrolling, loading states

### Official Documentation
- [Vue 3 Official Docs](https://vuejs.org/)
- [VueUse Composables](https://vueuse.org/)
- [Leaflet Documentation](https://leafletjs.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Pinia State Management](https://pinia.vuejs.org/)

### Production Examples
- [vue-leaflet v4](https://github.com/vue-leaflet/vue-leaflet) - Vue 3 Leaflet wrapper
- [vue-chartjs v5](https://github.com/apertureless/vue-chartjs) - Vue 3 Chart.js wrapper
- [VueUse Playground](https://vueuse.org/playground/) - Composable examples

---

## 如何觸發此技能

### 自動觸發

當你在 Claude Code 中輸入包含以下關鍵詞的請求時，UserPromptSubmit Hook 會自動推薦此技能：

**英文關鍵詞**（36+）:
- vue, vue 3, vue3, composition api, script setup
- ref, reactive, computed, watcheffect, onmounted, onunmounted
- composables, pinia, vueuse
- leaflet, map, marker, geojson, polyline
- chart.js, chartjs, chart, visualization, canvas
- responsive design, virtual scrolling, accessibility, wcag
- dark mode, theme, component organization
- single file component, sfc, vitest, cypress
- typescript vue, definemodel, defineprops
- memory leak, cleanup

**中文關鍵詞**（30+）:
- **動詞**：添加, 創建, 新增, 修改, 更新, 實現, 實作, 構建, 編寫, 開發, 幫我, 請
- **技術術語**：組件, 元件, 地圖, 圖表, 可視化, 視覺化, 響應式, 互動, 交互, 前端, 界面, 頁面, 標記, 圖層, 動畫, 性能優化, 主題, 暗色模式

### 手動啟用

```bash
# 使用 Skill tool
Skill(skill="vue-leaflet-guidelines")
```

### 推薦輸入示例

✅ **觸發率高**：
- "創建一個 Vue 3 組件顯示 Leaflet 地圖和軌跡標記"
- "添加響應式圖表組件來可視化統計數據"
- "實現 marker cluster 聚合功能和互動彈窗"
- "如何在 Vue 組件中使用 Composition API 管理地圖狀態？"
- "優化大量數據點的渲染性能，使用虛擬滾動"

⚠️ **觸發率低**：
- "做個前端頁面"（太模糊，缺少技術關鍵詞）
- "顯示地圖"（缺少框架和具體需求）
- "寫個界面"（太通用）

### 技能觸發機制

此技能通過以下方式被觸發：
1. **關鍵詞匹配**：輸入包含上述英文或中文關鍵詞
2. **意圖模式匹配**：匹配如 `(create|add|添加|創建).*?(vue|component|組件)` 的模式
3. **文件路徑觸發**：編輯 `frontend/*.html`, `frontend/*.vue` 等文件
4. **代碼內容觸發**：文件包含 `<script setup>`, `L.map()`, `new Chart()` 等

**推薦使用方式**：
- 在輸入中明確提及 Vue、Leaflet 或 Chart.js
- 使用具體的技術術語（如「組件」、「地圖」、「響應式」）
- 描述具體的 UI 功能需求和互動行為

---

**Skill Version:** 1.0
**Last Updated:** 2025-11-11
**Vue Version:** 3.4+
**Leaflet Version:** 1.9+
**Chart.js Version:** 4.x
