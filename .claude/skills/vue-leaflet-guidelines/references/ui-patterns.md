# UI/UX Patterns for Data Visualization Applications

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Target Audience:** Frontend developers building Vue 3 data visualization applications
**Scope:** Responsive layout, theming, loading states, accessibility, virtual scrolling, form patterns

---

## Table of Contents

1. [Responsive Layout Patterns](#responsive-layout-patterns)
2. [Theme System Implementation](#theme-system-implementation)
3. [Loading States and Skeletons](#loading-states-and-skeletons)
4. [Error Handling and Boundaries](#error-handling-and-boundaries)
5. [Virtual Scrolling for Large Datasets](#virtual-scrolling-for-large-datasets)
6. [Form Patterns](#form-patterns)
7. [Data Visualization Accessibility](#data-visualization-accessibility)
8. [Button Design System](#button-design-system)
9. [Summary and Best Practices](#summary-and-best-practices)

---

## Responsive Layout Patterns

Modern data visualization applications require flexible layouts that adapt to various screen sizes while maintaining usability and visual hierarchy.

### Two-Column Dashboard Layout

The most common pattern for data-intensive applications is a two-column layout with a fixed-width configuration panel and a flexible visualization area.

**Current Project Implementation:**

```html
<div class="main-content">
  <!-- Left Panel: 400px fixed width -->
  <div class="left-panel">
    <!-- Configuration forms, filters, controls -->
  </div>

  <!-- Right Panel: Flexible width -->
  <div class="right-panel">
    <!-- Charts, maps, visualizations -->
  </div>
</div>
```

```css
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 400px;
  background: var(--color-bg-white);
  padding: 24px;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-base);
  padding: 16px;
  gap: 16px;
  overflow-y: auto;
}
```

### CSS Grid vs Flexbox Decision Matrix

| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Two-column layout with fixed sidebar | **Flexbox** or **CSS Grid** | Both work well; Flexbox is simpler for this case |
| Multi-column responsive grid (charts) | **CSS Grid** | Auto-fit/auto-fill makes responsive easy |
| Vertical stacking with dynamic spacing | **Flexbox** | Gap property + flex-direction: column |
| Complex nested grids | **CSS Grid** | Better control over rows and columns |
| Single-axis alignment | **Flexbox** | Designed for one-dimensional layouts |

**Modern Approach: CSS Grid for Main Layout**

```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 1rem;
  height: 100vh;
  padding: 1rem;
}

/* Mobile: Stack vertically */
@media (max-width: 767px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}

/* Large screens: Adjust sidebar width */
@media (min-width: 1200px) {
  .dashboard-layout {
    grid-template-columns: 350px 1fr;
  }
}
```

**Flexbox for Component Internals**

```css
/* Charts container with responsive wrapping */
.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

/* Alternative: Flexbox with wrap */
.charts-container-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-box {
  flex: 1 1 300px; /* Grow, shrink, basis 300px */
  min-width: 300px;
}
```

### Viewport Units for Dynamic Sizing

**Current Project Issue: Fixed Map Height**

The current implementation uses viewport units but has limitations:

```css
.map-container {
  width: 100%;
  flex: 1;
  min-height: 400px;
  /* This doesn't adapt well to different screen sizes */
}
```

**Modern Solution: Container Queries + Viewport Units**

```css
/* Base responsive height calculation */
.map-container {
  width: 100%;
  /* Use calc() with viewport units for dynamic height */
  height: calc(100vh - 500px);
  min-height: 400px;
  max-height: calc(100vh - 300px);
}

/* Adaptive based on viewport height */
@media (min-height: 900px) {
  .map-container {
    height: calc(100vh - 400px);
    max-height: calc(100vh - 250px);
  }
}

@media (min-height: 1200px) {
  .map-container {
    height: calc(100vh - 350px);
    max-height: calc(100vh - 200px);
  }
}
```

**Container Queries (Modern CSS Feature)**

```css
/* Define container */
.right-panel {
  container-type: size;
  container-name: visualization;
}

/* Query the container */
@container visualization (min-height: 800px) {
  .map-container {
    height: 60%;
  }

  .charts-container {
    height: 40%;
  }
}

@container visualization (max-height: 600px) {
  .charts-container {
    display: none; /* Hide charts on very small heights */
  }

  .map-container {
    height: 100%;
  }
}
```

### Breakpoint Strategies

**Mobile-First Approach**

```css
/* Base styles for mobile (320px - 767px) */
.dashboard {
  padding: 0.5rem;
}

.left-panel {
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .left-panel {
    width: 350px;
  }
}

/* Desktop (1024px - 1439px) */
@media (min-width: 1024px) {
  .dashboard {
    padding: 1.5rem;
  }

  .left-panel {
    width: 400px;
  }
}

/* Large desktop (1440px+) */
@media (min-width: 1440px) {
  .dashboard {
    max-width: 1920px;
    margin: 0 auto;
  }

  .left-panel {
    width: 450px;
  }
}
```

**Modern Responsive Utilities with VueUse**

```vue
<script setup>
import { useBreakpoints } from '@vueuse/core'

const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440
})

const isMobile = breakpoints.smaller('tablet')
const isTablet = breakpoints.between('tablet', 'desktop')
const isDesktop = breakpoints.greaterOrEqual('desktop')
</script>

<template>
  <div class="dashboard" :class="{
    'mobile': isMobile,
    'tablet': isTablet,
    'desktop': isDesktop
  }">
    <!-- Conditional rendering based on breakpoint -->
    <aside v-if="!isMobile" class="left-panel">
      <!-- Sidebar for tablet+ -->
    </aside>

    <details v-else class="mobile-filters">
      <summary>Filters</summary>
      <!-- Collapsible filters for mobile -->
    </details>
  </div>
</template>
```

### Handling Resize Events

**Current Project Implementation:**

```javascript
handleResize() {
  clearTimeout(this.resizeTimeout);
  this.resizeTimeout = setTimeout(() => {
    if (this.map) {
      this.map.invalidateSize();
    }
    if (this.altitudeChart) {
      this.altitudeChart.resize();
    }
    if (this.speedChart) {
      this.speedChart.resize();
    }
  }, 250);
}
```

**Modern Approach with ResizeObserver**

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const mapContainer = ref(null)
const mapInstance = ref(null)

// Automatically resize map when container changes
useResizeObserver(mapContainer, (entries) => {
  const { width, height } = entries[0].contentRect

  if (mapInstance.value) {
    mapInstance.value.invalidateSize()
  }
})
</script>

<template>
  <div ref="mapContainer" class="map-container">
    <!-- Map component -->
  </div>
</template>
```

### Aspect Ratio Preservation

**Maintain Chart Aspect Ratio**

```css
/* Force specific aspect ratio */
.chart-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
}

/* Fallback for browsers without aspect-ratio support */
@supports not (aspect-ratio: 16 / 9) {
  .chart-wrapper {
    padding-top: 56.25%; /* 9/16 = 0.5625 */
    position: relative;
  }

  .chart-wrapper canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
```

**Chart.js Responsive Configuration**

```javascript
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // Important: allows flexible height
  aspectRatio: 2, // Optional: width/height ratio when maintainAspectRatio is true
}
```

---

## Theme System Implementation

Modern applications require dark/light theme support with system preference detection and persistent user choice.

### CSS Variables Architecture

**Current Project Implementation:**

```css
:root {
  /* Light theme (default) */
  --color-primary: #2563eb;
  --color-bg-base: #f8fafc;
  --color-bg-white: #ffffff;
  --color-text-primary: #1e293b;
  --color-border: #e2e8f0;
}

/* Dark theme would require manual class or override */
```

**Modern Approach: Dark Mode with CSS Variables**

```css
:root {
  /* Light theme colors */
  --color-background: #ffffff;
  --color-background-soft: #f5f5f5;
  --color-text: #1a1a1a;
  --color-text-soft: #666666;
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-border: #e5e7eb;

  /* Shadows adapt to theme */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.dark {
  /* Dark theme colors */
  --color-background: #1a1a1a;
  --color-background-soft: #2d2d2d;
  --color-text: #ffffff;
  --color-text-soft: #a0a0a0;
  --color-primary: #60a5fa;
  --color-success: #34d399;
  --color-warning: #fbbf24;
  --color-danger: #f87171;
  --color-border: #374151;

  /* Darker shadows for dark mode */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 2px 6px rgba(0, 0, 0, 0.5);
}
```

### Tailwind CSS Dark Mode Integration

**Configuration:**

```javascript
// tailwind.config.js
export default {
  darkMode: 'class', // Use class-based dark mode
  theme: {
    extend: {
      colors: {
        // Map to CSS variables
        background: 'var(--color-background)',
        'background-soft': 'var(--color-background-soft)',
        text: 'var(--color-text)',
        'text-soft': 'var(--color-text-soft)',
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
      }
    }
  }
}
```

**Usage in Components:**

```vue
<template>
  <div class="bg-background text-text dark:bg-background-soft">
    <button class="bg-primary hover:bg-primary-hover">
      Click Me
    </button>
  </div>
</template>
```

### System Preference Detection

**Composable for Theme Management:**

```typescript
// composables/useTheme.ts
import { ref, watch } from 'vue'
import { usePreferredDark, useLocalStorage } from '@vueuse/core'

export function useTheme() {
  const prefersDark = usePreferredDark()

  // Persist user choice in localStorage
  const userTheme = useLocalStorage<'light' | 'dark' | 'auto'>('theme', 'auto')

  const isDark = ref(prefersDark.value)

  // Apply theme based on user preference or system
  const applyTheme = () => {
    if (userTheme.value === 'auto') {
      isDark.value = prefersDark.value
    } else {
      isDark.value = userTheme.value === 'dark'
    }

    // Update DOM
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Watch for changes
  watch([prefersDark, userTheme], applyTheme, { immediate: true })

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    userTheme.value = theme
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    userTheme.value = isDark.value ? 'dark' : 'light'
  }

  return {
    isDark,
    userTheme,
    setTheme,
    toggleTheme
  }
}
```

**Theme Switcher Component:**

```vue
<script setup>
import { useTheme } from '@/composables/useTheme'

const { isDark, userTheme, setTheme, toggleTheme } = useTheme()
</script>

<template>
  <div class="theme-switcher">
    <button
      @click="toggleTheme"
      class="theme-toggle-btn"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <svg v-if="isDark" class="icon">
        <!-- Sun icon -->
        <use href="#icon-sun" />
      </svg>
      <svg v-else class="icon">
        <!-- Moon icon -->
        <use href="#icon-moon" />
      </svg>
    </button>

    <!-- Advanced: Three-way toggle -->
    <select v-model="userTheme" @change="setTheme(userTheme)">
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="auto">System</option>
    </select>
  </div>
</template>

<style scoped>
.theme-toggle-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle-btn:hover {
  background: var(--color-background-soft);
  border-color: var(--color-primary);
}

.icon {
  width: 20px;
  height: 20px;
  fill: var(--color-text);
}
</style>
```

### Chart.js Theme Integration

**Dynamic Chart Colors Based on Theme:**

```vue
<script setup>
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()

const chartOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: isDark.value ? '#ffffff' : '#1a1a1a'
      }
    }
  },
  scales: {
    x: {
      ticks: {
        color: isDark.value ? '#a0a0a0' : '#666666'
      },
      grid: {
        color: isDark.value ? '#374151' : '#e5e7eb'
      }
    },
    y: {
      ticks: {
        color: isDark.value ? '#a0a0a0' : '#666666'
      },
      grid: {
        color: isDark.value ? '#374151' : '#e5e7eb'
      }
    }
  }
}))

const chartData = computed(() => ({
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{
    label: 'Data',
    data: [10, 20, 30],
    borderColor: isDark.value ? '#60a5fa' : '#3b82f6',
    backgroundColor: isDark.value ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'
  }]
}))
</script>

<template>
  <Line :data="chartData" :options="chartOptions" />
</template>
```

### Leaflet Map Theme Adaptation

**Dark Map Tiles for Dark Mode:**

```vue
<script setup>
import { ref, watch } from 'vue'
import L from 'leaflet'
import { useTheme } from '@/composables/useTheme'

const map = ref(null)
const tileLayer = ref(null)
const { isDark } = useTheme()

const lightTiles = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

watch(isDark, (dark) => {
  if (tileLayer.value && map.value) {
    map.value.removeLayer(tileLayer.value)

    tileLayer.value = L.tileLayer(dark ? darkTiles : lightTiles, {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.value)
  }
}, { immediate: true })
</script>
```

---

## Loading States and Skeletons

Skeleton screens provide better perceived performance than traditional spinners by showing the structure of content before it loads.

### Skeleton vs Spinner Decision Matrix

| Scenario | Use Skeleton | Use Spinner |
|----------|--------------|-------------|
| Table with known structure | ✅ Yes | ❌ No |
| List of items | ✅ Yes | ❌ No |
| Card grid layout | ✅ Yes | ❌ No |
| Short API call (< 500ms) | ❌ No | ✅ Yes |
| Background task | ❌ No | ✅ Yes |
| Full-page navigation | ❌ No | ✅ Yes |
| Inline action (button click) | ❌ No | ✅ Yes (in button) |

### Skeleton Implementation

**Current Project Implementation:**

```javascript
// Simple loading spinner
<div class="loading" v-if="isExecuting">
  <div class="spinner"></div>
  <p>正在執行篩選...</p>
</div>
```

```css
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**Modern Approach: Skeleton Screens**

```vue
<script setup>
import { ref, onMounted } from 'vue'

const isLoading = ref(true)
const tracks = ref([])

onMounted(async () => {
  await loadTracks()
  isLoading.value = false
})
</script>

<template>
  <!-- Skeleton Table -->
  <div v-if="isLoading" class="skeleton-table">
    <div class="skeleton-row" v-for="i in 5" :key="i">
      <div class="skeleton-cell skeleton-animate"></div>
      <div class="skeleton-cell skeleton-animate"></div>
      <div class="skeleton-cell skeleton-animate"></div>
    </div>
  </div>

  <!-- Actual Table -->
  <table v-else class="results-table">
    <tr v-for="track in tracks" :key="track.id">
      <td>{{ track.name }}</td>
      <td>{{ track.points }}</td>
      <td>{{ track.score }}</td>
    </tr>
  </table>
</template>

<style scoped>
.skeleton-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.skeleton-cell {
  height: 20px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
}

.skeleton-animate {
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .skeleton-animate {
    animation: none;
    background: #f0f0f0; /* Static background */
  }
}
</style>
```

### Skeleton Component Library

**Reusable Skeleton Components:**

```vue
<!-- components/SkeletonCard.vue -->
<template>
  <div class="skeleton-card">
    <div class="skeleton-image skeleton-animate"></div>
    <div class="skeleton-title skeleton-animate"></div>
    <div class="skeleton-text skeleton-animate"></div>
    <div class="skeleton-text short skeleton-animate"></div>
  </div>
</template>

<style scoped>
.skeleton-card {
  background: var(--color-background);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--color-border);
}

.skeleton-image {
  width: 100%;
  height: 200px;
  margin-bottom: 1rem;
}

.skeleton-title {
  height: 24px;
  width: 70%;
  margin-bottom: 0.5rem;
}

.skeleton-text {
  height: 16px;
  width: 100%;
  margin-bottom: 0.5rem;
}

.skeleton-text.short {
  width: 60%;
}

.skeleton-animate {
  background: linear-gradient(
    90deg,
    var(--color-background-soft) 25%,
    var(--color-border) 50%,
    var(--color-background-soft) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}
</style>
```

**Usage:**

```vue
<script setup>
import SkeletonCard from '@/components/SkeletonCard.vue'

const isLoading = ref(true)
const items = ref([])
</script>

<template>
  <div class="grid">
    <SkeletonCard v-if="isLoading" v-for="i in 6" :key="i" />

    <Card v-else v-for="item in items" :key="item.id" :item="item" />
  </div>
</template>
```

### Progressive Loading

**Show Partial Content While Loading:**

```vue
<script setup>
import { ref, onMounted } from 'vue'

const tracks = ref([])
const isLoadingMore = ref(false)
const hasMore = ref(true)

async function loadMore() {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  const newTracks = await fetchTracks(tracks.value.length, 20)

  tracks.value.push(...newTracks)
  hasMore.value = newTracks.length === 20
  isLoadingMore.value = false
}

onMounted(() => loadMore())
</script>

<template>
  <div class="track-list">
    <!-- Show loaded tracks -->
    <TrackCard
      v-for="track in tracks"
      :key="track.id"
      :track="track"
    />

    <!-- Show skeleton while loading more -->
    <SkeletonCard v-if="isLoadingMore" v-for="i in 3" :key="i" />

    <!-- Load more button -->
    <button
      v-if="hasMore && !isLoadingMore"
      @click="loadMore"
      class="btn-load-more"
    >
      Load More
    </button>
  </div>
</template>
```

### Optimistic UI Updates

**Update UI immediately, sync with server in background:**

```vue
<script setup>
import { ref } from 'vue'

const tracks = ref([])
const trackToDelete = ref(null)

async function deleteTrack(trackId) {
  // Store reference for rollback
  const deletedTrack = tracks.value.find(t => t.id === trackId)
  const originalIndex = tracks.value.indexOf(deletedTrack)

  // Optimistic update: remove immediately from UI
  tracks.value = tracks.value.filter(t => t.id !== trackId)

  try {
    // Sync with server
    await api.deleteTrack(trackId)
  } catch (error) {
    // Rollback on error
    tracks.value.splice(originalIndex, 0, deletedTrack)

    // Show error notification
    notify.error('Failed to delete track')
  }
}
</script>

<template>
  <div v-for="track in tracks" :key="track.id">
    <TrackCard :track="track" />
    <button @click="deleteTrack(track.id)">
      Delete
    </button>
  </div>
</template>
```

### Loading State for Auxiliary Field Calculation

**Current Project Pattern:**

```vue
<script setup>
const auxiliaryStatus = ref({ total: 0, completed: 0, progress: 0 })

const auxiliaryStatusText = computed(() => {
  const { completed, total, progress } = auxiliaryStatus.value
  if (progress === 100) {
    return `✓ 已完成 (${total}/${total})`
  }
  return `計算中... (${completed}/${total})`
})
</script>

<template>
  <button @click="calculateAuxiliary" class="btn btn-primary">
    計算輔助欄位
  </button>

  <div v-if="auxiliaryStatus.progress > 0" class="progress-bar">
    <div
      class="progress-fill"
      :style="{ width: auxiliaryStatus.progress + '%' }"
    ></div>
    <span class="progress-text">{{ auxiliaryStatusText }}</span>
  </div>
</template>

<style scoped>
.progress-bar {
  position: relative;
  width: 100%;
  height: 30px;
  background: var(--color-background-soft);
  border-radius: 6px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 500;
  color: var(--color-text);
}
</style>
```

---

## Error Handling and Boundaries

Robust error handling prevents application crashes and provides clear feedback to users.

### Global Error Handler

**Setup in main.ts:**

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Error info:', info)

  // Send to error tracking service (Sentry, etc.)
  // errorTracker.captureException(err, { context: info })

  // Show user-friendly error notification
  notify.error('An unexpected error occurred. Please refresh the page.')
}

app.mount('#app')
```

### Component-Level Error Boundaries

**ErrorBoundary Component:**

```vue
<!-- components/ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from 'vue'

const props = defineProps<{
  fallback?: string
}>()

const emit = defineEmits<{
  error: [error: Error]
}>()

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err, instance, info) => {
  hasError.value = true
  errorMessage.value = err.message

  emit('error', err)

  console.error('Error captured:', err, info)

  // Return false to prevent propagation
  return false
})

function retry() {
  hasError.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <svg class="error-icon" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>

      <h3>Something went wrong</h3>

      <p class="error-message">{{ fallback || errorMessage }}</p>

      <button @click="retry" class="btn-retry">
        Try Again
      </button>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--color-background-soft);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.error-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.error-icon {
  width: 64px;
  height: 64px;
  fill: var(--color-danger);
  margin-bottom: 1rem;
}

.error-message {
  color: var(--color-text-soft);
  margin: 1rem 0;
}

.btn-retry {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
</style>
```

**Usage:**

```vue
<template>
  <ErrorBoundary @error="handleError">
    <TrackVisualization :track-id="selectedTrackId" />
  </ErrorBoundary>
</template>

<script setup>
function handleError(err) {
  console.log('Error in track visualization:', err)
  // Optional: Send to analytics
}
</script>
```

### User-Friendly Error Messages

**API Error Handling:**

```typescript
// composables/useApi.ts
import { ref } from 'vue'

export function useApi<T>(apiFn: () => Promise<T>) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null

    try {
      data.value = await apiFn()
    } catch (err) {
      // Transform error to user-friendly message
      error.value = getErrorMessage(err)
    } finally {
      isLoading.value = false
    }
  }

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      // Map error codes to messages
      const errorMap: Record<string, string> = {
        'NETWORK_ERROR': 'Unable to connect to server. Please check your internet connection.',
        'UNAUTHORIZED': 'You are not authorized to perform this action.',
        'NOT_FOUND': 'The requested resource was not found.',
        'VALIDATION_ERROR': 'Invalid data provided. Please check your input.',
        'SERVER_ERROR': 'Server error occurred. Please try again later.'
      }

      // Check if error message matches a known code
      for (const [code, message] of Object.entries(errorMap)) {
        if (err.message.includes(code)) {
          return message
        }
      }

      // Default message
      return 'An unexpected error occurred. Please try again.'
    }

    return 'An unexpected error occurred.'
  }

  return {
    data,
    error,
    isLoading,
    execute
  }
}
```

**Usage in Component:**

```vue
<script setup>
import { useApi } from '@/composables/useApi'

const { data: tracks, error, isLoading, execute: loadTracks } = useApi(() =>
  fetch('/api/tracks').then(r => r.json())
)

onMounted(() => loadTracks())
</script>

<template>
  <div>
    <div v-if="isLoading">
      <SkeletonCard v-for="i in 3" :key="i" />
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadTracks">Retry</button>
    </div>

    <div v-else>
      <TrackCard v-for="track in tracks" :key="track.id" :track="track" />
    </div>
  </div>
</template>
```

### Retry Mechanisms

**Exponential Backoff Retry:**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error

      if (i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
```

**Usage:**

```typescript
const tracks = await retryWithBackoff(
  () => fetch('/api/tracks').then(r => r.json()),
  3, // Max 3 retries
  1000 // Start with 1 second delay
)
```

---

## Virtual Scrolling for Large Datasets

When rendering 1000+ items, virtual scrolling is essential for maintaining 60fps performance.

### When to Use Virtual Scrolling

| Dataset Size | Recommendation |
|--------------|----------------|
| < 100 items | Standard rendering |
| 100-500 items | Optional (depends on item complexity) |
| 500-1000 items | Recommended |
| 1000+ items | **Mandatory** |
| 10,000+ items | Mandatory + pagination |

### VueUse Virtual List

**Basic Implementation:**

```vue
<script setup>
import { ref } from 'vue'
import { useVirtualList } from '@vueuse/core'

const tracks = ref([]) // 10,000 tracks

const { list, containerProps, wrapperProps } = useVirtualList(
  tracks,
  {
    itemHeight: 48, // Fixed height for each row
    overscan: 10    // Render 10 extra items above/below viewport
  }
)
</script>

<template>
  <div class="virtual-table">
    <!-- Fixed Header -->
    <div class="table-header">
      <div class="table-cell">Pigeon Number</div>
      <div class="table-cell">Total Points</div>
      <div class="table-cell">Suspicious Segments</div>
      <div class="table-cell">Confidence</div>
    </div>

    <!-- Virtual Scrolling Container -->
    <div v-bind="containerProps" class="table-body">
      <div v-bind="wrapperProps">
        <div
          v-for="{ index, data } in list"
          :key="data.id"
          class="table-row"
        >
          <div class="table-cell">{{ data.pigeon_number }}</div>
          <div class="table-cell">{{ data.total_points }}</div>
          <div class="table-cell">{{ data.suspicious_segments }}</div>
          <div class="table-cell">{{ data.confidence_score }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-table {
  height: 600px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 150px 120px 180px 120px;
  background: var(--color-background-soft);
  font-weight: 600;
  padding: 0.75rem;
  border-bottom: 2px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-body {
  flex: 1;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 150px 120px 180px 120px;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
  height: 48px; /* Must match itemHeight */
}

.table-row:hover {
  background: var(--color-background-soft);
}

.table-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
```

### Performance Benchmarks

**Without Virtual Scrolling:**
- 1,000 items: ~200ms initial render, noticeable scroll lag
- 10,000 items: ~2000ms initial render, severe scroll lag
- 50,000 items: Browser freeze, potential crash

**With Virtual Scrolling:**
- 1,000 items: ~50ms initial render, smooth 60fps scrolling
- 10,000 items: ~50ms initial render, smooth 60fps scrolling
- 50,000 items: ~50ms initial render, smooth 60fps scrolling

### Advanced: Variable Height Items

**When items have different heights:**

```vue
<script setup>
import { ref, computed } from 'vue'
import { useVirtualList } from '@vueuse/core'

const items = ref([
  { id: 1, content: 'Short', height: 50 },
  { id: 2, content: 'Long content...', height: 100 },
  { id: 3, content: 'Medium', height: 75 }
])

// Calculate cumulative heights
const itemHeights = computed(() => items.value.map(item => item.height))

const { list, containerProps, wrapperProps } = useVirtualList(
  items,
  {
    itemHeight: (index) => itemHeights.value[index] || 50,
    overscan: 5
  }
)
</script>

<template>
  <div v-bind="containerProps" class="container">
    <div v-bind="wrapperProps">
      <div
        v-for="{ index, data } in list"
        :key="data.id"
        :style="{ height: data.height + 'px' }"
        class="item"
      >
        {{ data.content }}
      </div>
    </div>
  </div>
</template>
```

### Horizontal Virtual Scrolling

**For wide tables or carousels:**

```vue
<script setup>
import { ref } from 'vue'
import { useVirtualList } from '@vueuse/core'

const columns = ref(Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `Column ${i}`
})))

const { list, containerProps, wrapperProps } = useVirtualList(
  columns,
  {
    itemWidth: 150, // Note: itemWidth instead of itemHeight
    overscan: 5
  }
)
</script>

<template>
  <div v-bind="containerProps" class="horizontal-scroll">
    <div v-bind="wrapperProps" class="horizontal-wrapper">
      <div
        v-for="{ data } in list"
        :key="data.id"
        class="column"
        style="width: 150px;"
      >
        {{ data.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.horizontal-scroll {
  overflow-x: auto;
  white-space: nowrap;
  height: 400px;
}

.horizontal-wrapper {
  display: inline-flex;
}

.column {
  flex-shrink: 0;
  padding: 1rem;
  border-right: 1px solid var(--color-border);
}
</style>
```

---

## Form Patterns

Forms are critical for user input and require careful attention to validation, accessibility, and user experience.

### Input Validation with Vuelidate

**Installation:**

```bash
npm install @vuelidate/core @vuelidate/validators
```

**Basic Validation:**

```vue
<script setup>
import { ref, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, between } from '@vuelidate/validators'

const form = ref({
  pigeonNumber: '',
  email: '',
  minPoints: null,
  maxPoints: null
})

const rules = {
  pigeonNumber: {
    required,
    minLength: minLength(5)
  },
  email: {
    required,
    email
  },
  minPoints: {
    required,
    between: between(1, 1000)
  },
  maxPoints: {
    required,
    between: between(1, 1000)
  }
}

const v$ = useVuelidate(rules, form)

async function submitForm() {
  const isValid = await v$.value.$validate()

  if (!isValid) {
    console.log('Validation failed:', v$.value.$errors)
    return
  }

  // Submit form
  console.log('Form is valid:', form.value)
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <div class="form-group">
      <label for="pigeonNumber">Pigeon Number</label>
      <input
        id="pigeonNumber"
        v-model="form.pigeonNumber"
        @blur="v$.pigeonNumber.$touch"
        :class="{ 'error': v$.pigeonNumber.$error }"
      />

      <div v-if="v$.pigeonNumber.$error" class="error-message">
        <span v-if="v$.pigeonNumber.required.$invalid">
          Pigeon number is required
        </span>
        <span v-else-if="v$.pigeonNumber.minLength.$invalid">
          Minimum length is 5 characters
        </span>
      </div>
    </div>

    <button type="submit" class="btn-primary">
      Submit
    </button>
  </form>
</template>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

input.error {
  border-color: var(--color-danger);
}

.error-message {
  color: var(--color-danger);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
```

### Tag-Based Input (Current Project Pattern)

**Computed Fields Editor:**

```vue
<script setup>
import { ref } from 'vue'

const computedFields = ref([])
const computedField = ref({
  name: '',
  left: 'altitude',
  op: '-',
  right: 'elevation_dem'
})

const computedFieldExpression = computed(() => {
  if (!computedField.value.left) return ''
  return `${computedField.value.left} ${computedField.value.op} ${computedField.value.right}`
})

function addComputedField() {
  if (!computedField.value.name || !computedFieldExpression.value) {
    alert('Please fill in all fields')
    return
  }

  computedFields.value.push({
    name: computedField.value.name,
    expression: computedFieldExpression.value
  })

  // Reset form
  computedField.value = {
    name: '',
    left: 'altitude',
    op: '-',
    right: 'elevation_dem'
  }
}

function removeComputedField(index) {
  computedFields.value.splice(index, 1)
}
</script>

<template>
  <div class="computed-fields-editor">
    <div class="form-group">
      <label>Field Name</label>
      <input v-model="computedField.name" placeholder="e.g., actual_flying_height" />
    </div>

    <div class="form-group">
      <label>Expression</label>
      <div class="input-row">
        <select v-model="computedField.left">
          <option value="altitude">altitude</option>
          <option value="moving_speed">moving_speed</option>
          <option value="wing_flaps_per_sec">wing_flaps_per_sec</option>
        </select>

        <select v-model="computedField.op">
          <option value="-">-</option>
          <option value="+">+</option>
          <option value="*">×</option>
          <option value="/">/</option>
        </select>

        <input v-model="computedField.right" placeholder="elevation_dem" />
      </div>

      <div class="expression-preview">
        {{ computedFieldExpression }}
      </div>
    </div>

    <button @click="addComputedField" class="btn-secondary">
      + Add Computed Field
    </button>

    <!-- Field Tags -->
    <div v-if="computedFields.length > 0" class="field-tags">
      <div v-for="(field, index) in computedFields" :key="index" class="field-tag">
        <span class="field-name">{{ field.name }}</span>
        <span class="field-formula">{{ field.expression }}</span>
        <button class="btn-remove" @click="removeComputedField(index)">
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-row input,
.input-row select {
  flex: 1;
}

.expression-preview {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.field-tags {
  margin-top: 1rem;
}

.field-tag {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.field-tag:hover {
  border-color: var(--color-border-hover);
}

.field-name {
  font-weight: 600;
  color: var(--color-primary);
  font-size: 14px;
}

.field-formula {
  color: var(--color-text-secondary);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  flex: 1;
}

.btn-remove {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 4px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-remove:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background: #fef2f2;
}
</style>
```

### File Upload Patterns

**CSV Import with Drag-and-Drop:**

```vue
<script setup>
import { ref } from 'vue'

const isDragging = ref(false)
const files = ref<File[]>([])
const error = ref<string | null>(null)

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  const droppedFiles = Array.from(e.dataTransfer?.files || [])
  validateAndAddFiles(droppedFiles)
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  const selectedFiles = Array.from(target.files || [])
  validateAndAddFiles(selectedFiles)
}

function validateAndAddFiles(newFiles: File[]) {
  error.value = null

  // Validate file types
  const validFiles = newFiles.filter(file => {
    if (!file.name.endsWith('.csv')) {
      error.value = 'Only CSV files are allowed'
      return false
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      error.value = 'File size exceeds 10MB'
      return false
    }

    return true
  })

  files.value.push(...validFiles)
}

function removeFile(index: number) {
  files.value.splice(index, 1)
}

async function uploadFiles() {
  if (files.value.length === 0) {
    error.value = 'Please select at least one file'
    return
  }

  const formData = new FormData()
  files.value.forEach(file => {
    formData.append('files', file)
  })

  try {
    await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    // Clear files after successful upload
    files.value = []
  } catch (err) {
    error.value = 'Upload failed. Please try again.'
  }
}
</script>

<template>
  <div class="file-upload">
    <div
      class="drop-zone"
      :class="{ 'is-dragging': isDragging }"
      @dragenter="handleDragEnter"
      @dragover.prevent
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <svg class="upload-icon" viewBox="0 0 24 24">
        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
      </svg>

      <p class="upload-text">
        Drag and drop CSV files here, or
        <label class="file-input-label">
          browse
          <input
            type="file"
            accept=".csv"
            multiple
            @change="handleFileInput"
            style="display: none;"
          />
        </label>
      </p>

      <p class="upload-hint">Maximum file size: 10MB</p>
    </div>

    <!-- File List -->
    <div v-if="files.length > 0" class="file-list">
      <div v-for="(file, index) in files" :key="index" class="file-item">
        <svg class="file-icon" viewBox="0 0 24 24">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
        </svg>

        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>

        <button @click="removeFile(index)" class="btn-remove-file">
          ×
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Upload Button -->
    <button
      v-if="files.length > 0"
      @click="uploadFiles"
      class="btn-primary"
    >
      Upload {{ files.length }} file{{ files.length > 1 ? 's' : '' }}
    </button>
  </div>
</template>

<style scoped>
.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.drop-zone:hover,
.drop-zone.is-dragging {
  border-color: var(--color-primary);
  background: var(--color-focus-ring);
}

.upload-icon {
  width: 48px;
  height: 48px;
  fill: var(--color-text-soft);
  margin-bottom: 1rem;
}

.file-input-label {
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
}

.file-list {
  margin-top: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--color-background-soft);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.file-icon {
  width: 24px;
  height: 24px;
  fill: var(--color-text-soft);
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 0.875rem;
  color: var(--color-text-soft);
}

.btn-remove-file {
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--color-text-soft);
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}

.btn-remove-file:hover {
  color: var(--color-danger);
}
</style>
```

### Form State Management

**Complex Form with Pinia:**

```typescript
// stores/filterStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  const rule = ref({
    minPoints: 2,
    maxPoints: 200,
    wingFlapsOp: '<=',
    wingFlapsValue: 15,
    altitudeOp: '<=',
    altitudeValue: 30,
    speedMin: 60,
    speedMax: 200
  })

  const computedFields = ref([])

  const isDirty = ref(false)
  const originalRule = ref(JSON.parse(JSON.stringify(rule.value)))

  const hasChanges = computed(() => {
    return JSON.stringify(rule.value) !== JSON.stringify(originalRule.value)
  })

  function resetRule() {
    rule.value = JSON.parse(JSON.stringify(originalRule.value))
    isDirty.value = false
  }

  function saveRule() {
    originalRule.value = JSON.parse(JSON.stringify(rule.value))
    isDirty.value = false
  }

  return {
    rule,
    computedFields,
    hasChanges,
    resetRule,
    saveRule
  }
})
```

---

## Data Visualization Accessibility

Ensuring data visualizations are accessible to all users, including those with disabilities, is both ethical and often legally required.

### WCAG Compliance Checklist

| Criterion | WCAG Level | Requirement |
|-----------|-----------|-------------|
| Color Contrast | AA | 4.5:1 for normal text, 3:1 for large text |
| Non-Color Differentiation | A | Don't rely solely on color |
| Keyboard Navigation | A | All interactive elements |
| Screen Reader Support | A | ARIA labels and descriptions |
| Focus Indicators | AA | Visible focus state (3:1 contrast) |
| Resize Text | AA | Support up to 200% zoom |
| Responsive Design | AA | Works on all screen sizes |

### Color Contrast Requirements

**Check Contrast Ratios:**

```css
/* Bad: Insufficient contrast (2.5:1) */
.bad-text {
  color: #888888; /* Gray */
  background: #ffffff; /* White */
}

/* Good: Sufficient contrast (4.6:1) */
.good-text {
  color: #666666; /* Darker gray */
  background: #ffffff; /* White */
}

/* Better: High contrast (12.6:1) */
.better-text {
  color: #1a1a1a; /* Near black */
  background: #ffffff; /* White */
}
```

**Current Project Color Contrast:**

```css
:root {
  --color-text-primary: #1e293b; /* 14.4:1 on white */
  --color-text-secondary: #64748b; /* 4.7:1 on white - WCAG AA */
  --color-text-tertiary: #94a3b8; /* 3.1:1 on white - fails for normal text */
}

/* Fix tertiary text for accessibility */
:root {
  --color-text-tertiary: #64748b; /* Same as secondary for AA compliance */
}
```

### Non-Color Differentiation

**Bad: Color-Only Differentiation:**

```vue
<template>
  <div :style="{ color: segment.suspicious ? 'red' : 'green' }">
    {{ segment.name }}
  </div>
</template>
```

**Good: Color + Icon + Text:**

```vue
<template>
  <div class="segment-status">
    <svg
      v-if="segment.suspicious"
      class="icon icon-warning"
      aria-label="Warning"
    >
      <use href="#icon-warning" />
    </svg>
    <svg
      v-else
      class="icon icon-check"
      aria-label="Normal"
    >
      <use href="#icon-check" />
    </svg>

    <span class="status-text">
      {{ segment.suspicious ? 'Suspicious' : 'Normal' }}
    </span>
  </div>
</template>

<style scoped>
.icon-warning {
  fill: var(--color-danger);
}

.icon-check {
  fill: var(--color-success);
}

.status-text {
  margin-left: 0.5rem;
}
</style>
```

### ARIA Live Regions for Dynamic Updates

**Announce Filter Results:**

```vue
<script setup>
import { ref, watch } from 'vue'

const results = ref([])
const announcementText = ref('')

watch(results, (newResults) => {
  // Update live region for screen readers
  announcementText.value = `Found ${newResults.length} suspicious tracks`
})
</script>

<template>
  <div>
    <!-- Visually hidden live region -->
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ announcementText }}
    </div>

    <!-- Visual results -->
    <div class="results">
      <p>{{ results.length }} suspicious tracks found</p>
      <!-- Results table... -->
    </div>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

### Keyboard Navigation for Map Interactions

**Accessible Map Markers:**

```vue
<script setup>
import { ref } from 'vue'
import L from 'leaflet'

function createAccessibleMarker(latlng, data) {
  const marker = L.marker(latlng)

  // Add keyboard navigation
  const markerElement = marker.getElement()
  if (markerElement) {
    markerElement.setAttribute('tabindex', '0')
    markerElement.setAttribute('role', 'button')
    markerElement.setAttribute('aria-label', `Track ${data.pigeonNumber}`)

    // Handle Enter and Space keys
    markerElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        marker.openPopup()
      }
    })
  }

  return marker
}
</script>
```

### Screen Reader Support for Data Tables

**Proper Table Structure:**

```vue
<template>
  <table
    class="results-table"
    role="table"
    aria-label="Suspicious tracks results"
  >
    <caption class="sr-only">
      Filtering results showing {{ results.length }} suspicious tracks
    </caption>

    <thead role="rowgroup">
      <tr role="row">
        <th role="columnheader" scope="col">Pigeon Number</th>
        <th role="columnheader" scope="col">Suspicious Segments</th>
        <th role="columnheader" scope="col">Confidence Score</th>
        <th role="columnheader" scope="col">Risk Level</th>
      </tr>
    </thead>

    <tbody role="rowgroup">
      <tr
        v-for="result in results"
        :key="result.track_id"
        role="row"
        @click="selectTrack(result.track_id)"
        :aria-selected="selectedTrackId === result.track_id"
        tabindex="0"
        @keydown.enter="selectTrack(result.track_id)"
      >
        <td role="cell">{{ result.pigeon_number }}</td>
        <td role="cell">{{ result.matched_segments.length }}</td>
        <td role="cell">
          <span :aria-label="`Confidence score ${result.confidence_score}`">
            {{ result.confidence_score.toFixed(2) }}
          </span>
        </td>
        <td role="cell">
          <span
            class="risk-badge"
            :class="`risk-${result.risk_level}`"
            :aria-label="`Risk level: ${getRiskText(result.risk_level)}`"
          >
            {{ getRiskText(result.risk_level) }}
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

### Chart Accessibility

**Accessible Chart with Alternative Data Table:**

```vue
<script setup>
import { ref } from 'vue'
import { Line } from 'vue-chartjs'

const chartData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [{
    label: 'Altitude (m)',
    data: [100, 120, 90, 110, 95]
  }]
})
</script>

<template>
  <div class="accessible-chart">
    <!-- Visual Chart -->
    <div class="chart-wrapper">
      <Line
        :data="chartData"
        :options="chartOptions"
        aria-labelledby="chart-title"
        aria-describedby="chart-description"
        role="img"
      />

      <div id="chart-title" class="sr-only">
        Altitude distribution over time
      </div>

      <div id="chart-description" class="sr-only">
        Line chart showing altitude values from January to May,
        ranging from 90 to 120 meters
      </div>
    </div>

    <!-- Data Table Alternative -->
    <details class="data-table-toggle">
      <summary>View data as table</summary>

      <table class="data-table">
        <caption>Altitude values by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Altitude (m)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(value, index) in chartData.datasets[0].data" :key="index">
            <th scope="row">{{ chartData.labels[index] }}</th>
            <td>{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>

<style scoped>
.data-table-toggle {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 6px;
}

.data-table-toggle summary {
  cursor: pointer;
  font-weight: 500;
  color: var(--color-primary);
}

.data-table {
  margin-top: 1rem;
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
</style>
```

---

## Button Design System

Consistent button design improves usability and maintains visual hierarchy.

### Button Hierarchy

**Current Project Implementation:**

```css
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
  width: 100%;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-button);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-button-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-bg-white);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
}
```

**Modern Component-Based Approach:**

```vue
<script setup lang="ts">
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false
})
</script>

<template>
  <button
    :class="[
      'base-button',
      `button-${variant}`,
      `button-${size}`,
      { 'is-loading': loading, 'full-width': fullWidth }
    ]"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="loading-spinner"></span>
    <slot v-else />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.full-width {
  width: 100%;
}

/* Sizes */
.button-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.button-md {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.button-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* Variants */
.button-primary {
  background: var(--color-primary);
  color: white;
}

.button-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.button-secondary {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.button-secondary:hover:not(:disabled) {
  background: var(--color-background-soft);
  border-color: var(--color-primary);
}

.button-ghost {
  background: transparent;
  color: var(--color-text-soft);
}

.button-ghost:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--color-background-soft);
}

.button-danger {
  background: var(--color-danger);
  color: white;
}

.button-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Loading state */
.loading-spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Focus state */
.base-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .base-button {
    transition: none;
  }

  .loading-spinner {
    animation: none;
  }
}
</style>
```

**Usage:**

```vue
<template>
  <div class="button-examples">
    <BaseButton variant="primary">Primary Button</BaseButton>
    <BaseButton variant="secondary">Secondary Button</BaseButton>
    <BaseButton variant="ghost">Ghost Button</BaseButton>
    <BaseButton variant="danger">Delete</BaseButton>

    <BaseButton variant="primary" size="sm">Small</BaseButton>
    <BaseButton variant="primary" size="md">Medium</BaseButton>
    <BaseButton variant="primary" size="lg">Large</BaseButton>

    <BaseButton variant="primary" :loading="true">Loading...</BaseButton>
    <BaseButton variant="primary" :disabled="true">Disabled</BaseButton>

    <BaseButton variant="primary" full-width>Full Width</BaseButton>
  </div>
</template>
```

### Icon Buttons

**With Leading/Trailing Icons:**

```vue
<script setup>
defineProps<{
  icon?: 'leading' | 'trailing'
}>()
</script>

<template>
  <button class="icon-button">
    <svg v-if="icon === 'leading'" class="icon icon-leading">
      <use href="#icon-download" />
    </svg>

    <slot />

    <svg v-if="icon === 'trailing'" class="icon icon-trailing">
      <use href="#icon-arrow-right" />
    </svg>
  </button>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
}
</style>
```

**Usage:**

```vue
<template>
  <IconButton variant="primary" icon="leading">
    Download CSV
  </IconButton>

  <IconButton variant="secondary" icon="trailing">
    Next Step
  </IconButton>
</template>
```

---

## Summary and Best Practices

### Key Takeaways

1. **Responsive Layout**
   - Use CSS Grid for main layout structure
   - Use Flexbox for component internals
   - Employ viewport units with calc() for dynamic sizing
   - Modern approach: Container queries for component-level responsiveness

2. **Theme System**
   - CSS variables for all colors and tokens
   - Class-based dark mode with Tailwind
   - System preference detection with localStorage persistence
   - Update Chart.js and Leaflet themes dynamically

3. **Loading States**
   - Prefer skeleton screens over spinners for known structures
   - Respect `prefers-reduced-motion` for animations
   - Implement progressive loading for large datasets
   - Use optimistic UI updates for better perceived performance

4. **Error Handling**
   - Global error handler for uncaught errors
   - Component-level error boundaries with retry
   - User-friendly error messages (no technical jargon)
   - Exponential backoff for network retries

5. **Virtual Scrolling**
   - Mandatory for 1000+ items
   - Use VueUse `useVirtualList` for simplicity
   - Fixed item height for best performance
   - Variable height supported but slower

6. **Forms**
   - Vuelidate for declarative validation
   - Tag-based input for complex data entry
   - Drag-and-drop file upload with validation
   - Pinia for complex form state management

7. **Accessibility**
   - 4.5:1 contrast ratio for normal text (WCAG AA)
   - Non-color differentiation (icons + text)
   - ARIA live regions for dynamic updates
   - Keyboard navigation for all interactive elements
   - Alternative data tables for charts

8. **Buttons**
   - Clear hierarchy: primary, secondary, ghost, danger
   - Consistent sizing: sm, md, lg
   - Loading and disabled states
   - Icon support (leading/trailing)

### Common Anti-Patterns to Avoid

❌ **Fixed pixel layouts** → Use viewport units and percentages
❌ **Color-only differentiation** → Add icons and text labels
❌ **Missing loading states** → Always show skeleton or spinner
❌ **Rendering 1000+ items without virtualization** → Use virtual scrolling
❌ **Generic error messages ("Error occurred")** → Provide specific, actionable messages
❌ **No keyboard navigation** → All interactive elements must be keyboard-accessible
❌ **Ignoring prefers-reduced-motion** → Respect user preferences
❌ **Missing ARIA labels** → Screen readers need proper labels

### Performance Checklist

- [ ] Virtual scrolling for lists with 1000+ items
- [ ] Skeleton screens for better perceived performance
- [ ] Image lazy loading and responsive images
- [ ] Code splitting and lazy component loading
- [ ] Chart.js decimation for large time-series datasets
- [ ] PruneCluster for 50k+ map markers
- [ ] Debounced resize handlers (250ms)
- [ ] ResizeObserver for efficient layout updates

### Accessibility Checklist

- [ ] Color contrast ratios meet WCAG AA (4.5:1)
- [ ] Non-color differentiation (icons, patterns, text)
- [ ] ARIA labels for all interactive elements
- [ ] Keyboard navigation support
- [ ] Screen reader announcements for dynamic content
- [ ] Focus indicators with 3:1 contrast ratio
- [ ] Alternative data tables for complex visualizations
- [ ] Respect `prefers-reduced-motion`

---

**End of UI/UX Patterns Guide**

*This document represents best practices for building accessible, performant, and user-friendly data visualization applications with Vue 3, Leaflet, and Chart.js.*
