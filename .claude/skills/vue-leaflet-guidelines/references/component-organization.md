# Vue Component Organization & Architecture Reference

**Last Updated:** 2025-11-10
**Version:** 1.0
**Purpose:** Comprehensive guide for organizing Vue 3 applications from single-file prototypes to modular production systems

---

## Table of Contents

1. [Architecture Patterns Overview](#1-architecture-patterns-overview)
2. [Folder Structure Recommendations](#2-folder-structure-recommendations)
3. [Component Design Patterns](#3-component-design-patterns)
4. [Composables vs Pinia Decision Matrix](#4-composables-vs-pinia-decision-matrix)
5. [Testing Strategies](#5-testing-strategies)
6. [Migration Roadmap](#6-migration-roadmap)
7. [Current Project Analysis](#7-current-project-analysis)

---

## 1. Architecture Patterns Overview

### 1.1 Modular Monolithic Architecture (Recommended)

**Key Principle:** Organize code by feature/domain, not by technical layer.

**Benefits:**
- High cohesion: Related code stays together
- Low coupling: Features are independent
- Easy to reason about: Find everything for a feature in one place
- Scalable: Can extract modules to microservices later

**Structure:**
```
src/
├── modules/                  # Feature modules
│   ├── feature-a/           # Self-contained feature
│   │   ├── components/      # Feature-specific components
│   │   ├── composables/     # Feature-specific logic
│   │   ├── store/           # Feature-specific state
│   │   ├── api/             # Feature-specific API calls
│   │   └── types/           # Feature-specific types
│   └── feature-b/
└── shared/                   # Only truly shared code
    ├── components/          # Generic UI components
    ├── composables/         # Global utilities
    └── utils/               # Pure functions
```

**When to Use:**
- Medium to large applications (5+ features)
- Team size: 3+ developers
- Long-term maintenance expected
- Features have distinct boundaries

### 1.2 Atomic Design Critique

**Why NOT Recommended for Most Projects:**

**Problem 1: Organizational Overhead**
```
❌ Overly Complex Structure:
components/
├── atoms/           # 50+ tiny components
├── molecules/       # 30+ components
├── organisms/       # 20+ components
├── templates/       # 10+ templates
└── pages/           # 5 pages

Result: 5 layers of abstraction for simple changes
```

**Problem 2: Ambiguous Boundaries**
- Is a SearchBox an atom or molecule?
- When does a molecule become an organism?
- Endless debates over classification

**Problem 3: Poor Discoverability**
- Finding components requires understanding atomic theory
- New developers waste time navigating abstract hierarchy
- Code reviews focus on "correct atom level" not functionality

**When Atomic Design Makes Sense:**
- Design system libraries (e.g., Element Plus, Vuetify)
- UI component libraries consumed by multiple apps
- Dedicated design system team

### 1.3 Current Project: Single-File Monolith

**Status Quo Analysis:**
- **File:** `frontend/index.html`
- **Lines:** ~1,737 lines
- **Structure:** Single Vue app with inline templates, styles, and logic

**Problems:**
1. **No separation of concerns:** Everything in one file
2. **Difficult testing:** Cannot test components in isolation
3. **Poor reusability:** Cannot extract shared logic
4. **Merge conflicts:** Multiple developers editing same file
5. **Performance issues:** Entire app loads at once

**Migration Priority:** HIGH
- Current size (1,737 lines) is near maintainability limit
- Adding features will exponentially increase complexity

---

## 2. Folder Structure Recommendations

### 2.1 Small Projects (< 5 Features, 1-2 Developers)

**Simple Feature-Based Structure:**
```
track-filter-app/
├── src/
│   ├── components/        # All components flat or grouped
│   │   ├── FilterForm.vue
│   │   ├── TrackMap.vue
│   │   └── shared/
│   │       ├── BaseButton.vue
│   │       └── BaseModal.vue
│   ├── composables/       # All composables
│   │   ├── useFilterEngine.ts
│   │   └── useMapControl.ts
│   ├── stores/            # Pinia stores
│   │   └── raceStore.ts
│   ├── App.vue
│   └── main.ts
└── package.json
```

**Rationale:**
- Minimal overhead
- Quick to navigate
- Good for prototypes and MVPs

### 2.2 Medium Projects (5-10 Features, 2-5 Developers)

**Feature-Based Modules:**
```
track-filter-app/
├── src/
│   ├── modules/
│   │   ├── filter/
│   │   │   ├── components/
│   │   │   │   ├── FilterForm.vue
│   │   │   │   ├── ComputedFieldEditor.vue
│   │   │   │   └── ConditionBuilder.vue
│   │   │   ├── composables/
│   │   │   │   ├── useFilterEngine.ts
│   │   │   │   └── useExpressionValidator.ts
│   │   │   ├── api/
│   │   │   │   └── filterApi.ts
│   │   │   ├── types/
│   │   │   │   └── filter.types.ts
│   │   │   └── store/
│   │   │       └── filterStore.ts
│   │   │
│   │   ├── visualization/
│   │   │   ├── components/
│   │   │   │   ├── TrackMap.vue
│   │   │   │   ├── AltitudeChart.vue
│   │   │   │   └── SpeedChart.vue
│   │   │   ├── composables/
│   │   │   │   ├── useMapControl.ts
│   │   │   │   └── useChartSync.ts
│   │   │   └── store/
│   │   │       └── visualizationStore.ts
│   │   │
│   │   └── race/
│   │       ├── components/
│   │       │   ├── RaceSelector.vue
│   │       │   └── TrackList.vue
│   │       ├── composables/
│   │       │   └── useRaceData.ts
│   │       ├── api/
│   │       │   └── raceApi.ts
│   │       └── store/
│   │           └── raceStore.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseModal.vue
│   │   │   └── LoadingSkeleton.vue
│   │   ├── composables/
│   │   │   ├── useApi.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useNotification.ts
│   │   ├── layouts/
│   │   │   ├── DefaultLayout.vue
│   │   │   └── TwoColumnLayout.vue
│   │   └── utils/
│   │       ├── formatting.ts
│   │       └── validation.ts
│   │
│   ├── App.vue
│   ├── main.ts
│   └── router/
│       └── index.ts
│
├── tests/
│   ├── unit/              # Vitest unit tests
│   ├── component/         # Vitest component tests
│   └── e2e/               # Cypress E2E tests
│
├── vite.config.ts
└── package.json
```

**Rationale:**
- Features are self-contained
- Easy to find related code
- Reduces merge conflicts
- Supports parallel development

### 2.3 Large Projects (10+ Features, 5+ Developers)

**Add Domain-Based Grouping:**
```
src/
├── domains/               # Business domains
│   ├── racing/           # Racing domain
│   │   ├── modules/
│   │   │   ├── race-management/
│   │   │   ├── track-analysis/
│   │   │   └── result-processing/
│   │   └── shared/       # Domain-specific shared code
│   │
│   └── user-management/  # User domain
│       ├── modules/
│       │   ├── authentication/
│       │   └── profile/
│       └── shared/
│
└── shared/               # Cross-domain shared code
```

**Rationale:**
- Supports multiple business domains
- Enables team ownership by domain
- Facilitates microservices extraction

### 2.4 Pigeon Racing Track Filter - Recommended Structure

**Target Structure for Current Project:**
```
track-filter-app/
├── src/
│   ├── modules/
│   │   ├── filter/
│   │   │   ├── components/
│   │   │   │   ├── FilterForm.vue
│   │   │   │   ├── ComputedFieldEditor.vue
│   │   │   │   ├── ConditionBuilder.vue
│   │   │   │   └── RulePreview.vue
│   │   │   ├── composables/
│   │   │   │   ├── useFilterEngine.ts
│   │   │   │   ├── useExpressionValidator.ts
│   │   │   │   ├── useFilterHistory.ts
│   │   │   │   └── useComputedFields.ts
│   │   │   ├── views/
│   │   │   │   └── FilterDashboard.vue
│   │   │   ├── api/
│   │   │   │   └── filterApi.ts
│   │   │   ├── types/
│   │   │   │   └── filter.types.ts
│   │   │   └── store/
│   │   │       └── filterStore.ts
│   │   │
│   │   ├── visualization/
│   │   │   ├── components/
│   │   │   │   ├── TrackMap.vue
│   │   │   │   │   # Props: selectedTrackIds, results, mode
│   │   │   │   │   # Emits: trackSelected, segmentClicked
│   │   │   │   │   # Features: Leaflet integration, polyline rendering,
│   │   │   │   │   #          responsive sizing, click interactions
│   │   │   │   │
│   │   │   │   ├── AltitudeChart.vue
│   │   │   │   │   # Props: points, selectedPointIndex
│   │   │   │   │   # Emits: pointHovered, pointClicked
│   │   │   │   │   # Features: Chart.js integration, crosshair sync
│   │   │   │   │
│   │   │   │   ├── SpeedChart.vue
│   │   │   │   │   # Props: points, selectedPointIndex
│   │   │   │   │   # Emits: pointHovered, pointClicked
│   │   │   │   │   # Features: Chart.js integration, crosshair sync
│   │   │   │   │
│   │   │   │   └── ResultsTable.vue
│   │   │   │       # Props: results, selectedTrackId
│   │   │   │       # Emits: trackSelected, exportClicked
│   │   │   │       # Features: Virtual scrolling, sorting, filtering
│   │   │   │
│   │   │   ├── composables/
│   │   │   │   ├── useMapControl.ts
│   │   │   │   │   # Leaflet instance management
│   │   │   │   │   # Polyline rendering utilities
│   │   │   │   │   # Map event handlers
│   │   │   │   │
│   │   │   │   ├── useChartSync.ts
│   │   │   │   │   # Synchronized crosshair logic
│   │   │   │   │   # Chart data transformation
│   │   │   │   │   # Hover/click coordination
│   │   │   │   │
│   │   │   │   ├── useTrackSelection.ts
│   │   │   │   │   # Track selection state
│   │   │   │   │   # Multi-select support
│   │   │   │   │   # Color assignment
│   │   │   │   │
│   │   │   │   └── useChartResize.ts
│   │   │   │       # ResizeObserver integration
│   │   │   │       # Automatic chart resize
│   │   │   │       # Debounce handling
│   │   │   │
│   │   │   └── store/
│   │   │       └── visualizationStore.ts
│   │   │           # Global visualization state
│   │   │           # Selected track IDs
│   │   │           # Map mode (tracks/filter_results/none)
│   │   │
│   │   └── race/
│   │       ├── components/
│   │       │   ├── RaceSelector.vue
│   │       │   │   # Dropdown for race selection
│   │       │   │   # Auxiliary status display
│   │       │   │
│   │       │   ├── TrackList.vue
│   │       │   │   # Checkbox list for track selection
│   │       │   │   # Multi-select support
│   │       │   │
│   │       │   └── TrackDetailPanel.vue
│   │       │       # Displays selected track info
│   │       │       # GPX field statistics
│   │       │
│   │       ├── composables/
│   │       │   ├── useRaceData.ts
│   │       │   │   # Fetch races
│   │       │   │   # Load tracks for race
│   │       │   │   # Auxiliary field calculation
│   │       │   │
│   │       │   └── useAuxiliaryStatus.ts
│   │       │       # Poll auxiliary calculation progress
│   │       │       # Display status (completed/total)
│   │       │
│   │       ├── api/
│   │       │   └── raceApi.ts
│   │       │       # GET /api/races
│   │       │       # GET /api/races/:id/tracks
│   │       │       # POST /api/races/:id/calculate-auxiliary
│   │       │       # GET /api/races/:id/auxiliary-status
│   │       │
│   │       ├── types/
│   │       │   └── race.types.ts
│   │       │       # Race, Track, TrackPoint interfaces
│   │       │
│   │       └── store/
│   │           └── raceStore.ts
│   │               # Global race/track state
│   │               # Selected race ID
│   │               # Tracks list
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── BaseButton.vue
│   │   │   │   # Props: variant, size, loading, disabled
│   │   │   │   # Variants: primary, secondary, ghost, danger
│   │   │   │
│   │   │   ├── BaseModal.vue
│   │   │   │   # Props: modelValue, title, width
│   │   │   │   # Emits: update:modelValue
│   │   │   │   # Features: Teleport, focus trap
│   │   │   │
│   │   │   ├── LoadingSkeleton.vue
│   │   │   │   # Props: rows, columns, height
│   │   │   │   # Features: Animated shimmer
│   │   │   │
│   │   │   └── ErrorBoundary.vue
│   │   │       # Error handling wrapper
│   │   │       # Fallback UI
│   │   │
│   │   ├── composables/
│   │   │   ├── useApi.ts
│   │   │   │   # Axios wrapper with error handling
│   │   │   │   # Request/response interceptors
│   │   │   │   # Retry logic
│   │   │   │
│   │   │   ├── useDebounce.ts
│   │   │   │   # Debounce utility
│   │   │   │   # Used for search, resize, etc.
│   │   │   │
│   │   │   ├── useNotification.ts
│   │   │   │   # Toast notifications
│   │   │   │   # Global singleton state
│   │   │   │
│   │   │   └── useResizeObserver.ts
│   │   │       # ResizeObserver wrapper
│   │   │       # Auto-cleanup on unmount
│   │   │
│   │   ├── layouts/
│   │   │   ├── DefaultLayout.vue
│   │   │   │   # Standard app layout
│   │   │   │   # Header + main content
│   │   │   │
│   │   │   └── TwoColumnLayout.vue
│   │   │       # Left panel + right visualization
│   │   │       # Responsive breakpoints
│   │   │
│   │   └── utils/
│   │       ├── formatting.ts
│   │       │   # formatTimestamp, formatNumber, etc.
│   │       │
│   │       ├── validation.ts
│   │       │   # Input validation rules
│   │       │
│   │       └── colorScale.ts
│   │           # Color generation for confidence scores
│   │           # Risk level colors
│   │
│   ├── App.vue
│   ├── main.ts
│   └── router/
│       └── index.ts
│
├── tests/
│   ├── unit/
│   │   ├── composables/
│   │   │   ├── useFilterEngine.spec.ts
│   │   │   └── useChartSync.spec.ts
│   │   └── utils/
│   │       └── validation.spec.ts
│   │
│   ├── component/
│   │   ├── FilterForm.spec.ts
│   │   ├── TrackMap.spec.ts
│   │   └── AltitudeChart.spec.ts
│   │
│   └── e2e/
│       ├── filter-workflow.cy.ts
│       └── visualization-interaction.cy.ts
│
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Key Benefits:**
1. **Modularity:** Filter, visualization, and race management are independent
2. **Testability:** Each component can be tested in isolation
3. **Reusability:** Composables can be shared across components
4. **Scalability:** Easy to add new features (e.g., user management, reporting)
5. **Team Collaboration:** Multiple developers can work on different modules

---

## 3. Component Design Patterns

### 3.1 Single File Component (SFC) Structure

**Standard Template:**
```vue
<script setup lang="ts">
// ========== 1. Imports ==========
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { Track, FilterConfig } from '@/modules/filter/types/filter.types'

// ========== 2. Props & Emits ==========
interface Props {
  tracks: Track[]
  initialConfig?: FilterConfig
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialConfig: () => ({ minSpeed: 0, maxSpeed: 150 }),
  loading: false
})

const emit = defineEmits<{
  filterApplied: [config: FilterConfig]
  trackSelected: [trackId: number]
  error: [message: string]
}>()

// ========== 3. Composables ==========
const router = useRouter()
const route = useRoute()
const { executeFilter, isLoading, results } = useFilterEngine()
const { notify } = useNotification()

// ========== 4. Stores ==========
const filterStore = useFilterStore()
const { config, history } = storeToRefs(filterStore)

// ========== 5. Local State ==========
const showAdvanced = ref(false)
const selectedTrackId = ref<number | null>(null)
const errorMessage = ref<string>('')

// ========== 6. Computed Properties ==========
const hasResults = computed(() => results.value.length > 0)

const suspiciousTracks = computed(() =>
  results.value.filter(r => r.confidence_score > 0.7)
)

const formValid = computed(() => {
  return props.tracks.length > 0 && !props.loading
})

// ========== 7. Methods ==========
async function applyFilter(config: FilterConfig) {
  try {
    await executeFilter(config)
    emit('filterApplied', config)
    notify('Filter applied successfully', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errorMessage.value = message
    emit('error', message)
  }
}

function selectTrack(trackId: number) {
  selectedTrackId.value = trackId
  emit('trackSelected', trackId)
}

function resetForm() {
  selectedTrackId.value = null
  errorMessage.value = ''
  showAdvanced.value = false
}

// ========== 8. Watchers ==========
watch(() => props.tracks, (newTracks, oldTracks) => {
  if (newTracks.length !== oldTracks.length) {
    resetForm()
  }
}, { deep: true })

watch(errorMessage, (message) => {
  if (message) {
    notify(message, 'error')
  }
})

// ========== 9. Lifecycle Hooks ==========
onMounted(async () => {
  // Initialize component
  if (route.query.trackId) {
    selectedTrackId.value = Number(route.query.trackId)
  }
})

onUnmounted(() => {
  // Cleanup
  resetForm()
})

// ========== 10. Expose (if needed) ==========
defineExpose({
  resetForm,
  applyFilter
})
</script>

<template>
  <div class="filter-dashboard">
    <!-- ========== Header Section ========== -->
    <header class="dashboard-header">
      <h1>Track Filter</h1>
      <BaseButton
        variant="secondary"
        size="sm"
        @click="showAdvanced = !showAdvanced"
      >
        {{ showAdvanced ? 'Simple' : 'Advanced' }}
      </BaseButton>
    </header>

    <!-- ========== Main Content ========== -->
    <main class="dashboard-content">
      <!-- Filter Form -->
      <section class="filter-section">
        <FilterForm
          :config="props.initialConfig"
          :advanced="showAdvanced"
          :disabled="!formValid"
          @apply="applyFilter"
        />
      </section>

      <!-- Results -->
      <section v-if="hasResults" class="results-section">
        <h2>Results ({{ suspiciousTracks.length }} suspicious tracks)</h2>
        <ResultsTable
          :results="results"
          :selected-id="selectedTrackId"
          @select="selectTrack"
        />
      </section>

      <!-- Loading State -->
      <LoadingSkeleton v-if="isLoading" :rows="5" />

      <!-- Error State -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ========== Layout ========== */
.filter-dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: var(--radius-md);
}

.dashboard-content {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

/* ========== Sections ========== */
.filter-section,
.results-section {
  margin-bottom: 2rem;
}

.results-section h2 {
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

/* ========== Error State ========== */
.error-message {
  padding: 1rem;
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--color-error);
}
</style>
```

### 3.2 Props Validation and Type Safety

**Basic Props:**
```vue
<script setup lang="ts">
interface Props {
  // Required prop
  trackId: number

  // Optional prop with default
  showDetails?: boolean

  // Array prop
  tags: string[]

  // Object prop with type
  config: FilterConfig

  // Union types
  status: 'pending' | 'processing' | 'completed'

  // Function prop
  onSave?: (data: FormData) => Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
  onSave: undefined
})
</script>
```

**Advanced Props with Validators:**
```vue
<script setup lang="ts">
// Runtime validation
const props = defineProps({
  score: {
    type: Number,
    required: true,
    validator: (value: number) => value >= 0 && value <= 1
  },
  email: {
    type: String,
    validator: (value: string) => /\S+@\S+\.\S+/.test(value)
  }
})
</script>
```

### 3.3 Emits Declaration and Typing

**Type-Safe Emits:**
```vue
<script setup lang="ts">
// Emit with payload
const emit = defineEmits<{
  update: [id: number, data: Record<string, unknown>]
  delete: [id: number]
  error: [message: string, code?: number]
}>()

// Usage
function handleSave() {
  emit('update', props.trackId, { name: 'Updated' })
}

function handleDelete() {
  emit('delete', props.trackId)
}

function handleError() {
  emit('error', 'Something went wrong', 500)
}
</script>
```

**v-model with defineModel (Vue 3.4+):**
```vue
<script setup lang="ts">
// Before (Vue 3.0-3.3)
const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const updateValue = (newValue) => {
  emit('update:modelValue', newValue)
}

// After (Vue 3.4+)
const model = defineModel<string>()
// That's it! model is a ref that acts as two-way binding
</script>

<template>
  <input v-model="model" />
</template>
```

**Multiple v-models:**
```vue
<script setup lang="ts">
const firstName = defineModel<string>('firstName')
const lastName = defineModel<string>('lastName')
</script>

<template>
  <div>
    <input v-model="firstName" placeholder="First Name" />
    <input v-model="lastName" placeholder="Last Name" />
  </div>
</template>

<!-- Usage -->
<PersonForm
  v-model:first-name="user.firstName"
  v-model:last-name="user.lastName"
/>
```

### 3.4 Slots for Flexibility

**Named Slots:**
```vue
<template>
  <div class="modal">
    <!-- Header slot -->
    <header class="modal-header">
      <slot name="header">
        <h2>{{ title }}</h2>
      </slot>
    </header>

    <!-- Default slot (content) -->
    <main class="modal-body">
      <slot>
        <!-- Fallback content -->
        <p>No content provided</p>
      </slot>
    </main>

    <!-- Footer slot -->
    <footer class="modal-footer">
      <slot name="footer">
        <BaseButton @click="close">Close</BaseButton>
      </slot>
    </footer>
  </div>
</template>

<!-- Usage -->
<BaseModal title="Confirm Delete">
  <template #header>
    <h2>⚠️ Warning</h2>
  </template>

  <p>Are you sure you want to delete this track?</p>

  <template #footer>
    <BaseButton variant="danger" @click="confirmDelete">
      Delete
    </BaseButton>
    <BaseButton variant="secondary" @click="cancel">
      Cancel
    </BaseButton>
  </template>
</BaseModal>
```

**Scoped Slots:**
```vue
<script setup lang="ts">
const items = ref([
  { id: 1, name: 'Track A', score: 0.85 },
  { id: 2, name: 'Track B', score: 0.62 }
])
</script>

<template>
  <div class="list">
    <div
      v-for="item in items"
      :key="item.id"
      class="list-item"
    >
      <!-- Pass item data to parent via slot props -->
      <slot :item="item" :index="item.id">
        <!-- Fallback rendering -->
        {{ item.name }}
      </slot>
    </div>
  </div>
</template>

<!-- Usage -->
<DataList :items="tracks">
  <template #default="{ item, index }">
    <div class="custom-item">
      <strong>{{ index }}.</strong>
      {{ item.name }}
      <span :class="getScoreClass(item.score)">
        {{ (item.score * 100).toFixed(0) }}%
      </span>
    </div>
  </template>
</DataList>
```

### 3.5 defineExpose for Imperative Access

**When to Use:**
- Parent needs to call child methods
- Accessing child state for validation
- Triggering animations or focus

**Example:**
```vue
<!-- Child Component: FilterForm.vue -->
<script setup lang="ts">
const formData = ref({ minSpeed: 0, maxSpeed: 150 })
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}

  if (formData.value.minSpeed < 0) {
    errors.value.minSpeed = 'Must be positive'
  }

  return Object.keys(errors.value).length === 0
}

function reset() {
  formData.value = { minSpeed: 0, maxSpeed: 150 }
  errors.value = {}
}

function focus() {
  // Focus first input
  document.querySelector('input')?.focus()
}

// Expose methods to parent
defineExpose({
  validate,
  reset,
  focus,
  formData: readonly(formData) // Expose read-only state
})
</script>

<!-- Parent Component -->
<script setup lang="ts">
const filterFormRef = ref<InstanceType<typeof FilterForm>>()

async function handleSubmit() {
  // Call child's validate method
  if (!filterFormRef.value?.validate()) {
    return
  }

  // Access child's state
  const data = filterFormRef.value.formData

  await saveFilter(data)
}

function handleReset() {
  filterFormRef.value?.reset()
}
</script>

<template>
  <FilterForm ref="filterFormRef" />
  <BaseButton @click="handleSubmit">Submit</BaseButton>
  <BaseButton @click="handleReset">Reset</BaseButton>
</template>
```

### 3.6 Wrong vs Correct Examples

**❌ Wrong: Mutating Props Directly**
```vue
<script setup lang="ts">
const props = defineProps<{ config: FilterConfig }>()

function updateConfig() {
  // ❌ NEVER mutate props directly!
  props.config.minSpeed = 50
}
</script>
```

**✅ Correct: Emit Events for Changes**
```vue
<script setup lang="ts">
const props = defineProps<{ config: FilterConfig }>()
const emit = defineEmits<{ update: [config: FilterConfig] }>()

function updateConfig() {
  // ✅ Create new object and emit
  emit('update', { ...props.config, minSpeed: 50 })
}
</script>
```

**❌ Wrong: Not Cleaning Up Side Effects**
```vue
<script setup>
onMounted(() => {
  window.addEventListener('resize', handleResize)
  // ❌ Missing cleanup!
})
</script>
```

**✅ Correct: Clean Up in onUnmounted**
```vue
<script setup>
import { useEventListener } from '@vueuse/core'

// Option 1: VueUse (automatic cleanup)
useEventListener(window, 'resize', handleResize)

// Option 2: Manual cleanup
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
```

**❌ Wrong: Using Watchers Instead of Computed**
```vue
<script setup>
const selectedTrack = ref(null)
const trackName = ref('')

// ❌ Unnecessary watcher
watch(selectedTrack, (track) => {
  trackName.value = track?.pigeon_number || ''
})
</script>
```

**✅ Correct: Use Computed**
```vue
<script setup>
const selectedTrack = ref(null)

// ✅ Simple computed property
const trackName = computed(() =>
  selectedTrack.value?.pigeon_number || ''
)
</script>
```

---

## 4. Composables vs Pinia Decision Matrix

### 4.1 When to Use Composables

**Use Case 1: Scoped State (Component-Level)**
```typescript
// composables/useTrackSelection.ts
import { ref, computed } from 'vue'
import type { Track } from '@/types'

export function useTrackSelection(tracks: Ref<Track[]>) {
  // Each component gets its own instance
  const selectedId = ref<number | null>(null)

  const selectedTrack = computed(() =>
    tracks.value.find(t => t.id === selectedId.value)
  )

  function select(id: number) {
    selectedId.value = id
  }

  function clear() {
    selectedId.value = null
  }

  return {
    selectedId,
    selectedTrack,
    select,
    clear
  }
}

// Usage: Multiple instances, isolated state
const { selectedTrack: trackA, select: selectA } = useTrackSelection(tracksA)
const { selectedTrack: trackB, select: selectB } = useTrackSelection(tracksB)
```

**Use Case 2: Utility Functions (Stateless)**
```typescript
// composables/useDebounce.ts
import { ref, watch } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay: number) {
  const debouncedValue = ref(value.value) as Ref<T>

  watch(value, (newValue) => {
    const handler = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)

    return () => clearTimeout(handler)
  })

  return debouncedValue
}

// Usage: Pure utility, no global state
const searchTerm = ref('')
const debouncedSearch = useDebounce(searchTerm, 500)
```

**Use Case 3: Side Effect Management**
```typescript
// composables/useResizeObserver.ts
import { onMounted, onUnmounted } from 'vue'

export function useResizeObserver(
  target: Ref<HTMLElement | null>,
  callback: (entry: ResizeObserverEntry) => void
) {
  let observer: ResizeObserver | null = null

  onMounted(() => {
    if (!target.value) return

    observer = new ResizeObserver((entries) => {
      callback(entries[0])
    })

    observer.observe(target.value)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
}

// Usage: Auto-cleanup on unmount
const mapContainer = ref<HTMLElement | null>(null)
useResizeObserver(mapContainer, (entry) => {
  console.log('New size:', entry.contentRect)
})
```

### 4.2 When to Use Pinia

**Use Case 1: Global State (App-Level)**
```typescript
// stores/raceStore.ts
import { defineStore } from 'pinia'
import type { Race, Track } from '@/types'

export const useRaceStore = defineStore('race', () => {
  // State: Shared across entire app
  const selectedRaceId = ref<number | null>(null)
  const races = ref<Race[]>([])
  const tracks = ref<Track[]>([])

  // Getters
  const selectedRace = computed(() =>
    races.value.find(r => r.id === selectedRaceId.value)
  )

  const trackCount = computed(() => tracks.value.length)

  // Actions
  async function loadRaces() {
    races.value = await fetchRaces()
  }

  async function selectRace(raceId: number) {
    selectedRaceId.value = raceId
    tracks.value = await fetchTracksForRace(raceId)
  }

  return {
    selectedRaceId,
    races,
    tracks,
    selectedRace,
    trackCount,
    loadRaces,
    selectRace
  }
})

// Usage: Same state across all components
const raceStore = useRaceStore()
console.log(raceStore.selectedRace)
```

**Use Case 2: Persisted State**
```typescript
// stores/userPreferences.ts
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export const usePreferencesStore = defineStore('preferences', () => {
  // Persist to localStorage
  const theme = useLocalStorage('theme', 'light')
  const language = useLocalStorage('language', 'zh-TW')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme,
    language,
    toggleTheme
  }
})
```

**Use Case 3: Cross-Feature Communication**
```typescript
// stores/notificationStore.ts
import { defineStore } from 'pinia'

interface Notification {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])

  function add(message: string, type: Notification['type']) {
    const id = Date.now()
    notifications.value.push({ id, message, type })

    // Auto-remove after 5 seconds
    setTimeout(() => remove(id), 5000)
  }

  function remove(id: number) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return { notifications, add, remove }
})

// Used by multiple features
// Filter module emits notifications
// User module emits notifications
// All components show same notifications
```

### 4.3 Decision Matrix

| Criteria | Composable | Pinia Store |
|----------|-----------|-------------|
| **Scope** | Component-level or scoped | App-level global |
| **State** | Local, isolated | Shared across app |
| **Instances** | Multiple instances possible | Singleton only |
| **Persistence** | Manual (via props) | Easy (plugins) |
| **DevTools** | Not visible | Full DevTools support |
| **Server-Side Rendering** | Works out of the box | Requires SSR setup |
| **Testing** | Easy to mock | Requires store setup |
| **Use When** | Logic reuse, side effects | Global state, cross-feature |

### 4.4 Hybrid Pattern (Best Practice)

**Combine Both for Optimal Design:**
```typescript
// Store for global race data
// stores/raceStore.ts
export const useRaceStore = defineStore('race', () => {
  const selectedRaceId = ref<number | null>(null)
  const tracks = ref<Track[]>([])

  async function loadTracks(raceId: number) {
    tracks.value = await fetchTracksForRace(raceId)
  }

  return { selectedRaceId, tracks, loadTracks }
})

// Composable for map-specific logic
// composables/useMapControl.ts
export function useMapControl() {
  const map = ref<L.Map | null>(null)
  const polylines = ref<Record<number, L.Polyline[]>>({})

  function renderTracks(tracks: Track[]) {
    // Leaflet rendering logic
  }

  function highlightTrack(trackId: number) {
    // Highlight specific track
  }

  onUnmounted(() => {
    // Cleanup Leaflet resources
    map.value?.remove()
  })

  return { map, renderTracks, highlightTrack }
}

// Component uses both
<script setup>
const raceStore = useRaceStore()
const { tracks } = storeToRefs(raceStore)

const { renderTracks, highlightTrack } = useMapControl()

watch(tracks, (newTracks) => {
  renderTracks(newTracks)
})
</script>
```

### 4.5 Project Recommendation

**For Pigeon Racing Track Filter:**

**Use Pinia For:**
1. **raceStore** - Selected race, tracks list, auxiliary status
2. **filterStore** - Filter config, execution history, results
3. **visualizationStore** - Selected track IDs, map mode

**Use Composables For:**
4. **useMapControl** - Leaflet instance, polyline rendering
5. **useChartSync** - Chart.js synchronization logic
6. **useTrackSelection** - Track checkbox state (local to component)
7. **useFilterEngine** - Filter execution logic
8. **useResizeObserver** - Map/chart resize handling

---

## 5. Testing Strategies

### 5.1 Component Testing with Vitest

**Setup:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
```

**Basic Component Test:**
```typescript
// tests/component/FilterForm.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterForm from '@/modules/filter/components/FilterForm.vue'

describe('FilterForm', () => {
  it('renders form fields', () => {
    const wrapper = mount(FilterForm, {
      props: {
        config: { minSpeed: 0, maxSpeed: 150 }
      }
    })

    expect(wrapper.find('input[name="minSpeed"]').exists()).toBe(true)
    expect(wrapper.find('input[name="maxSpeed"]').exists()).toBe(true)
  })

  it('emits apply event with config', async () => {
    const wrapper = mount(FilterForm)

    await wrapper.find('input[name="minSpeed"]').setValue(50)
    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.emitted('apply')).toBeTruthy()
    expect(wrapper.emitted('apply')?.[0]).toEqual([
      { minSpeed: 50, maxSpeed: 150 }
    ])
  })

  it('validates expression before emitting', async () => {
    const wrapper = mount(FilterForm)

    await wrapper.find('input[name="expression"]').setValue('invalid syntax')
    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.emitted('apply')).toBeFalsy()
    expect(wrapper.find('.error-message').text()).toContain('Invalid expression')
  })

  it('disables submit when loading', async () => {
    const wrapper = mount(FilterForm, {
      props: { loading: true }
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })
})
```

**Testing with Composables:**
```typescript
// tests/unit/composables/useFilterEngine.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { useFilterEngine } from '@/modules/filter/composables/useFilterEngine'

describe('useFilterEngine', () => {
  it('executes filter and returns results', async () => {
    const { executeFilter, results, isLoading } = useFilterEngine()

    expect(isLoading.value).toBe(false)

    const promise = executeFilter({
      minSpeed: 60,
      maxSpeed: 120
    })

    expect(isLoading.value).toBe(true)

    await promise

    expect(isLoading.value).toBe(false)
    expect(results.value).toHaveLength(5)
  })

  it('handles API errors gracefully', async () => {
    // Mock API failure
    vi.mock('@/modules/filter/api/filterApi', () => ({
      executeFilter: vi.fn().mockRejectedValue(new Error('Network error'))
    }))

    const { executeFilter, error } = useFilterEngine()

    await executeFilter({ minSpeed: 0, maxSpeed: 150 })

    expect(error.value).toBe('Network error')
  })
})
```

**Testing Pinia Stores:**
```typescript
// tests/unit/stores/raceStore.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRaceStore } from '@/modules/race/store/raceStore'

describe('raceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads races', async () => {
    const store = useRaceStore()

    expect(store.races).toEqual([])

    await store.loadRaces()

    expect(store.races.length).toBeGreaterThan(0)
  })

  it('selects race and loads tracks', async () => {
    const store = useRaceStore()

    await store.selectRace(1)

    expect(store.selectedRaceId).toBe(1)
    expect(store.tracks.length).toBeGreaterThan(0)
  })

  it('computes selected race correctly', async () => {
    const store = useRaceStore()

    await store.loadRaces()
    store.selectedRaceId = 1

    expect(store.selectedRace?.id).toBe(1)
  })
})
```

### 5.2 E2E Testing with Cypress

**Setup:**
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720
  }
})
```

**Filter Workflow Test:**
```typescript
// tests/e2e/filter-workflow.cy.ts
describe('Filter Workflow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('completes full filter workflow', () => {
    // Step 1: Select race
    cy.get('select[name="race"]').select('Taiwan Spring Race 2025')

    // Step 2: Wait for tracks to load
    cy.get('.track-list').should('exist')
    cy.get('.track-item').should('have.length.at.least', 1)

    // Step 3: Select tracks
    cy.get('.track-item').first().find('input[type="checkbox"]').check()

    // Step 4: Render tracks on map
    cy.get('button').contains('顯示選中的軌跡').click()

    // Step 5: Verify map displays tracks
    cy.get('.leaflet-container').should('exist')
    cy.get('.leaflet-overlay-pane svg path').should('have.length.at.least', 1)

    // Step 6: Configure filter
    cy.get('input[name="minSpeed"]').clear().type('60')
    cy.get('input[name="maxSpeed"]').clear().type('120')

    // Step 7: Execute filter
    cy.get('button').contains('執行篩選').click()

    // Step 8: Verify results
    cy.get('.results-table').should('exist')
    cy.get('.results-table tbody tr').should('have.length.at.least', 1)

    // Step 9: Click result row
    cy.get('.results-table tbody tr').first().click()

    // Step 10: Verify track highlight
    cy.get('.results-table tbody tr.selected-track').should('exist')

    // Step 11: Verify charts update
    cy.get('#altitudeChart').should('exist')
    cy.get('#speedChart').should('exist')
  })

  it('exports results to CSV', () => {
    // Setup: Execute filter first
    cy.get('select[name="race"]').select('Taiwan Spring Race 2025')
    cy.get('button').contains('執行篩選').click()
    cy.get('.results-table').should('exist')

    // Export CSV
    cy.get('button').contains('匯出 CSV').click()

    // Verify download (Cypress limitation: cannot verify file contents)
    // Manual verification or use cypress-downloadfile plugin
  })
})
```

**Visualization Interaction Test:**
```typescript
// tests/e2e/visualization-interaction.cy.ts
describe('Visualization Interaction', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.get('select[name="race"]').select('Taiwan Spring Race 2025')
  })

  it('synchronizes map and chart interactions', () => {
    // Select track
    cy.get('.track-item').first().find('input[type="checkbox"]').check()
    cy.get('button').contains('顯示選中的軌跡').click()

    // Click on map polyline
    cy.get('.leaflet-overlay-pane svg path').first().click()

    // Verify chart updates
    cy.get('#altitudeChart').should('be.visible')
    cy.get('#speedChart').should('be.visible')

    // Hover over chart
    cy.get('#altitudeChart canvas').trigger('mousemove', { clientX: 200, clientY: 100 })

    // Verify crosshair (if implemented)
    // cy.get('.chart-crosshair').should('exist')
  })

  it('handles responsive resize', () => {
    // Desktop
    cy.viewport(1280, 720)
    cy.get('.map-container').should('be.visible')
    cy.get('.charts-container').should('have.css', 'grid-template-columns')

    // Tablet
    cy.viewport(768, 1024)
    cy.get('.map-container').should('be.visible')

    // Mobile
    cy.viewport(375, 667)
    cy.get('.map-container').should('be.visible')
  })
})
```

### 5.3 Testing Composables in Isolation

**Example: useTrackSelection**
```typescript
// tests/unit/composables/useTrackSelection.spec.ts
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useTrackSelection } from '@/modules/visualization/composables/useTrackSelection'

describe('useTrackSelection', () => {
  it('selects track', () => {
    const tracks = ref([
      { track_id: 1, pigeon_number: 'TW-001' },
      { track_id: 2, pigeon_number: 'TW-002' }
    ])

    const { selectedId, selectedTrack, select } = useTrackSelection(tracks)

    expect(selectedId.value).toBeNull()
    expect(selectedTrack.value).toBeUndefined()

    select(1)

    expect(selectedId.value).toBe(1)
    expect(selectedTrack.value?.pigeon_number).toBe('TW-001')
  })

  it('clears selection', () => {
    const tracks = ref([{ track_id: 1, pigeon_number: 'TW-001' }])
    const { selectedId, clear, select } = useTrackSelection(tracks)

    select(1)
    expect(selectedId.value).toBe(1)

    clear()
    expect(selectedId.value).toBeNull()
  })

  it('handles track not found', () => {
    const tracks = ref([{ track_id: 1, pigeon_number: 'TW-001' }])
    const { selectedTrack, select } = useTrackSelection(tracks)

    select(999) // Non-existent track

    expect(selectedTrack.value).toBeUndefined()
  })
})
```

### 5.4 Mocking External Dependencies

**Mocking API Calls:**
```typescript
// tests/component/RaceSelector.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RaceSelector from '@/modules/race/components/RaceSelector.vue'

// Mock API module
vi.mock('@/modules/race/api/raceApi', () => ({
  fetchRaces: vi.fn().mockResolvedValue([
    { id: 1, name: 'Race A' },
    { id: 2, name: 'Race B' }
  ])
}))

describe('RaceSelector', () => {
  it('loads and displays races', async () => {
    const wrapper = mount(RaceSelector)

    // Wait for async data loading
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('select option').text()).toContain('Race A')
  })
})
```

**Mocking Leaflet:**
```typescript
// tests/component/TrackMap.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TrackMap from '@/modules/visualization/components/TrackMap.vue'

// Mock Leaflet
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    fitBounds: vi.fn()
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn()
  })),
  polyline: vi.fn(() => ({
    addTo: vi.fn(),
    bindPopup: vi.fn(),
    setStyle: vi.fn()
  }))
}))

describe('TrackMap', () => {
  it('renders map container', () => {
    const wrapper = mount(TrackMap)

    expect(wrapper.find('.map-container').exists()).toBe(true)
  })

  it('renders tracks on map', async () => {
    const wrapper = mount(TrackMap, {
      props: {
        tracks: [
          { track_id: 1, points: [{ lat: 25.033, lng: 121.565 }] }
        ]
      }
    })

    await wrapper.vm.$nextTick()

    // Verify Leaflet methods were called
    const L = await import('leaflet')
    expect(L.polyline).toHaveBeenCalled()
  })
})
```

---

## 6. Migration Roadmap

### 6.1 Phase 1: Foundation Setup (Week 1)

**Objective:** Set up build tooling and project structure

**Tasks:**

1. **Initialize Vite Project**
```bash
npm create vite@latest track-filter-app -- --template vue-ts
cd track-filter-app
npm install
```

2. **Install Dependencies**
```bash
# Core dependencies
npm install vue@^3.4 pinia@^2.1

# Leaflet and Chart.js
npm install leaflet@^1.9 chart.js@^4.4 vue-chartjs@^5.3

# VueUse utilities
npm install @vueuse/core@^10.7

# Development dependencies
npm install -D @vitejs/plugin-vue typescript@^5.3
npm install -D vitest@^1.0 @vue/test-utils@^2.4 jsdom@^23.0
npm install -D cypress@^13.6
```

3. **Create Folder Structure**
```bash
mkdir -p src/modules/filter/{components,composables,api,types,store}
mkdir -p src/modules/visualization/{components,composables,store}
mkdir -p src/modules/race/{components,composables,api,types,store}
mkdir -p src/shared/{components,composables,layouts,utils}
mkdir -p tests/{unit,component,e2e}
```

4. **Configure TypeScript**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

5. **Configure Vite**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
```

**Deliverables:**
- ✅ Vite project with TypeScript
- ✅ Folder structure created
- ✅ Dependencies installed
- ✅ Build and test configuration

### 6.2 Phase 2: Extract Core Modules (Week 2-3)

**Objective:** Extract filter, visualization, and race modules from single-file app

**Phase 2A: Extract Filter Module**

1. **Create Filter Types**
```typescript
// src/modules/filter/types/filter.types.ts
export interface FilterConfig {
  minPoints: number
  maxPoints: number
  wingFlapsOp: '<=' | '>='
  wingFlapsValue: number
  altitudeOp: '<=' | '>='
  altitudeValue: number
  speedMin: number
  speedMax: number
}

export interface ComputedField {
  name: string
  expression: string
  description: string
}

export interface FilterResult {
  track_id: number
  pigeon_number: string
  confidence_score: number
  risk_level: 'high' | 'medium' | 'low'
  matched_segments: MatchedSegment[]
  total_matched_points: number
}

export interface MatchedSegment {
  segment_id: number
  location: {
    type: 'LineString'
    coordinates: number[][]
  }
}
```

2. **Create Filter Store**
```typescript
// src/modules/filter/store/filterStore.ts
import { defineStore } from 'pinia'
import type { FilterConfig, FilterResult, ComputedField } from '../types/filter.types'

export const useFilterStore = defineStore('filter', () => {
  const config = ref<FilterConfig>({
    minPoints: 2,
    maxPoints: 200,
    wingFlapsOp: '<=',
    wingFlapsValue: 15,
    altitudeOp: '<=',
    altitudeValue: 30,
    speedMin: 60,
    speedMax: 200
  })

  const computedFields = ref<ComputedField[]>([])
  const results = ref<FilterResult[]>([])
  const isExecuting = ref(false)
  const executionTime = ref(0)

  function addComputedField(field: ComputedField) {
    computedFields.value.push(field)
  }

  function removeComputedField(index: number) {
    computedFields.value.splice(index, 1)
  }

  function setResults(newResults: FilterResult[], timeMs: number) {
    results.value = newResults
    executionTime.value = timeMs
  }

  return {
    config,
    computedFields,
    results,
    isExecuting,
    executionTime,
    addComputedField,
    removeComputedField,
    setResults
  }
})
```

3. **Create Filter Composable**
```typescript
// src/modules/filter/composables/useFilterEngine.ts
import { ref } from 'vue'
import { useFilterStore } from '../store/filterStore'
import { executeFilterAPI } from '../api/filterApi'
import type { FilterConfig, FilterResult } from '../types/filter.types'

export function useFilterEngine() {
  const filterStore = useFilterStore()
  const error = ref<string>('')

  async function executeFilter(raceId: number, config: FilterConfig) {
    filterStore.isExecuting = true
    error.value = ''

    try {
      const startTime = performance.now()
      const results = await executeFilterAPI(raceId, config, filterStore.computedFields)
      const endTime = performance.now()

      filterStore.setResults(results, endTime - startTime)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      filterStore.isExecuting = false
    }
  }

  return {
    executeFilter,
    error
  }
}
```

4. **Extract FilterForm Component**
```vue
<!-- src/modules/filter/components/FilterForm.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilterStore } from '../store/filterStore'
import type { FilterConfig } from '../types/filter.types'

const filterStore = useFilterStore()

const emit = defineEmits<{
  execute: []
}>()

const formValid = computed(() => {
  const { minPoints, maxPoints } = filterStore.config
  return minPoints > 0 && maxPoints >= minPoints
})

function handleSubmit() {
  if (formValid.value) {
    emit('execute')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="filter-form">
    <!-- Extracted from original HTML -->
    <div class="form-group">
      <label>連續點數範圍</label>
      <div class="input-row">
        <input v-model.number="filterStore.config.minPoints" type="number" min="1" />
        至
        <input v-model.number="filterStore.config.maxPoints" type="number" min="1" />
        個點
      </div>
    </div>

    <!-- More form fields... -->

    <button
      type="submit"
      class="btn btn-success"
      :disabled="!formValid || filterStore.isExecuting"
    >
      {{ filterStore.isExecuting ? '執行中...' : '🔍 執行篩選' }}
    </button>
  </form>
</template>

<style scoped>
/* Extracted styles from original CSS */
</style>
```

**Phase 2B: Extract Visualization Module**

1. **Extract TrackMap Component**
```vue
<!-- src/modules/visualization/components/TrackMap.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapControl } from '../composables/useMapControl'
import type { Track, FilterResult } from '@/types'

interface Props {
  tracks?: Track[]
  results?: FilterResult[]
  mode: 'none' | 'tracks' | 'filter_results'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  trackSelected: [trackId: number]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const { map, renderTracks, renderResults, highlightTrack } = useMapControl()

onMounted(() => {
  if (mapContainer.value) {
    map.value = L.map(mapContainer.value).setView([24.75, 121.25], 9)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)
  }
})

onUnmounted(() => {
  map.value?.remove()
})

watch(() => props.tracks, (newTracks) => {
  if (props.mode === 'tracks' && newTracks) {
    renderTracks(newTracks)
  }
}, { deep: true })

watch(() => props.results, (newResults) => {
  if (props.mode === 'filter_results' && newResults) {
    renderResults(newResults)
  }
}, { deep: true })

function handleTrackClick(trackId: number) {
  highlightTrack(trackId)
  emit('trackSelected', trackId)
}
</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-lg);
}
</style>
```

2. **Extract Chart Components**
```vue
<!-- src/modules/visualization/components/AltitudeChart.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js'
import type { TrackPoint } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement)

interface Props {
  points: TrackPoint[]
}

const props = defineProps<Props>()

const chartData = ref({
  labels: [] as number[],
  datasets: [{
    label: '高度變化 (m)',
    data: [] as number[],
    borderColor: '#2196f3',
    backgroundColor: 'rgba(33, 150, 243, 0.1)'
  }]
})

watch(() => props.points, (newPoints) => {
  if (newPoints.length > 0) {
    chartData.value.labels = newPoints.map((_, i) => i + 1)
    chartData.value.datasets[0].data = newPoints.map(p => p.altitude || 0)
  }
}, { immediate: true })
</script>

<template>
  <div class="chart-container">
    <Line :data="chartData" :options="{ responsive: true, maintainAspectRatio: false }" />
  </div>
</template>

<style scoped>
.chart-container {
  height: 100%;
}
</style>
```

**Phase 2C: Extract Race Module**

1. **Extract RaceSelector Component**
```vue
<!-- src/modules/race/components/RaceSelector.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRaceStore } from '../store/raceStore'
import { storeToRefs } from 'pinia'

const raceStore = useRaceStore()
const { races, selectedRaceId } = storeToRefs(raceStore)

const emit = defineEmits<{
  raceChanged: [raceId: number]
}>()

onMounted(() => {
  raceStore.loadRaces()
})

async function handleRaceChange() {
  if (selectedRaceId.value) {
    await raceStore.selectRace(selectedRaceId.value)
    emit('raceChanged', selectedRaceId.value)
  }
}
</script>

<template>
  <div class="race-selector">
    <h3>1. 選擇賽事</h3>
    <select v-model="selectedRaceId" @change="handleRaceChange">
      <option value="">選擇賽事...</option>
      <option v-for="race in races" :key="race.id" :value="race.id">
        {{ race.name }}
      </option>
    </select>
  </div>
</template>
```

**Deliverables:**
- ✅ Filter module extracted (components, composables, store)
- ✅ Visualization module extracted (map, charts)
- ✅ Race module extracted (race selector, track list)

### 6.3 Phase 3: Enhance Functionality (Week 4)

**Objective:** Add performance optimizations and improved UX

**Tasks:**

1. **Add Virtual Scrolling for Track List**
```vue
<script setup>
import { useVirtualList } from '@vueuse/core'

const tracks = ref([]) // 1000+ tracks
const { list, containerProps, wrapperProps } = useVirtualList(
  tracks,
  { itemHeight: 48, overscan: 10 }
)
</script>

<template>
  <div v-bind="containerProps" class="track-list">
    <div v-bind="wrapperProps">
      <div v-for="{ data } in list" :key="data.track_id" class="track-item">
        {{ data.pigeon_number }}
      </div>
    </div>
  </div>
</template>
```

2. **Implement Dark/Light Theme**
```typescript
// composables/useTheme.ts
import { usePreferredDark, useLocalStorage } from '@vueuse/core'

export function useTheme() {
  const prefersDark = usePreferredDark()
  const isDark = useLocalStorage('theme-dark', prefersDark.value)

  watch(isDark, (dark) => {
    document.documentElement.classList.toggle('dark', dark)
  }, { immediate: true })

  return { isDark }
}
```

3. **Add Loading States**
```vue
<!-- components/LoadingSkeleton.vue -->
<template>
  <div class="skeleton">
    <div v-for="i in rows" :key="i" class="skeleton-row">
      <div class="skeleton-cell"></div>
      <div class="skeleton-cell"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-cell {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

4. **Optimize Map Performance**
```typescript
// Use PruneCluster for 50k+ markers
import PruneClusterForLeaflet from 'prunecluster'

const cluster = new PruneClusterForLeaflet()
points.forEach(point => {
  const marker = new PruneCluster.Marker(point.lat, point.lng)
  cluster.RegisterMarker(marker)
})
map.addLayer(cluster)
```

**Deliverables:**
- ✅ Virtual scrolling for large track lists
- ✅ Dark/light theme support
- ✅ Loading skeletons for better perceived performance
- ✅ Optimized map rendering with clustering

### 6.4 Phase 4: Testing & Polish (Week 5)

**Objective:** Comprehensive test coverage and production readiness

**Tasks:**

1. **Write Component Tests** (Target: 80% coverage)
   - FilterForm validation
   - TrackMap rendering
   - Chart interactions

2. **Write E2E Tests**
   - Full filter workflow
   - Track selection and visualization
   - CSV export

3. **Accessibility Audit**
   - Keyboard navigation
   - Screen reader support
   - Color contrast (WCAG AA)

4. **Performance Optimization**
   - Code splitting (lazy load modules)
   - Bundle size analysis
   - Lighthouse score > 90

**Deliverables:**
- ✅ 80%+ test coverage
- ✅ E2E tests pass
- ✅ WCAG AA accessibility compliance
- ✅ Lighthouse performance score > 90

### 6.5 Migration Checklist

**Pre-Migration:**
- [ ] Backup current `frontend/index.html`
- [ ] Document API endpoints used
- [ ] List all external dependencies (CDN scripts)

**Phase 1: Foundation**
- [ ] Vite project created
- [ ] TypeScript configured
- [ ] Folder structure created
- [ ] Dependencies installed
- [ ] Build succeeds (`npm run build`)

**Phase 2: Module Extraction**
- [ ] Filter module extracted and working
- [ ] Visualization module extracted and working
- [ ] Race module extracted and working
- [ ] All features from original app work

**Phase 3: Enhancements**
- [ ] Virtual scrolling added
- [ ] Theme toggle works
- [ ] Loading states implemented
- [ ] Map performance optimized

**Phase 4: Testing & Polish**
- [ ] Unit tests pass
- [ ] Component tests pass
- [ ] E2E tests pass
- [ ] Accessibility audit pass
- [ ] Performance benchmarks met

**Post-Migration:**
- [ ] Documentation updated
- [ ] Deployment configured
- [ ] Team trained on new structure
- [ ] Old `index.html` archived

---

## 7. Current Project Analysis

### 7.1 Existing Single-File Structure

**File:** `frontend/index.html`
**Size:** 1,737 lines
**Architecture:** Monolithic single-file Vue app

**Breakdown:**
- **Styles:** Lines 23-536 (513 lines, 29.5%)
- **Template:** Lines 539-821 (282 lines, 16.2%)
- **Script:** Lines 823-1734 (911 lines, 52.5%)
- **Other:** Lines 1-22, 1735-1737 (38 lines, 2.2%)

**Components Identified:**
1. **Left Panel (Configuration)**
   - Race selector (Lines 548-562)
   - Track selection list (Lines 564-594)
   - Track detail panel (Lines 596-650)
   - Computed fields editor (Lines 652-694)
   - Filter rules form (Lines 696-744)

2. **Right Panel (Visualization)**
   - Altitude chart (Line 751)
   - Speed chart (Line 754)
   - Leaflet map (Line 760)

3. **Results Section**
   - Results table (Lines 765-812)

**Vue Application State:**
```javascript
data() {
  return {
    // Race management
    races: [],
    selectedRaceId: null,
    auxiliaryStatus: {},

    // Track management
    tracks: [],
    selectedTrackIds: [],
    selectedTrackId: null,
    trackColors: [...],

    // Filter configuration
    rule: {...},
    computedFields: [],
    computedField: {...},

    // Results
    results: [],
    isExecuting: false,
    executionTime: 0,

    // UI state
    map: null,
    trackPolylines: {},
    altitudeChart: null,
    speedChart: null,
    trackPointsCache: {},
    walnutMode: false,
    resizeTimeout: null
  }
}
```

### 7.2 Identified Issues

**1. State Management Chaos**
- 15+ reactive properties in a single component
- No clear separation between global and local state
- Difficult to debug state changes

**2. Tight Coupling**
- Map, charts, and forms are all in one component
- Cannot reuse components in other contexts
- Changing one feature risks breaking others

**3. Testing Nightmare**
- Cannot test components in isolation
- Must mock entire app to test a single feature
- E2E tests are the only option (slow and brittle)

**4. Performance Bottlenecks**
- Entire app loads at once (no code splitting)
- Large bundle size (~500KB with dependencies)
- No lazy loading of routes/features

**5. Poor Developer Experience**
- Difficult to find code (search through 1,737 lines)
- Merge conflicts when multiple developers edit
- Long load times for IDE intellisense

### 7.3 Recommended Extraction Plan

**Priority 1: Extract Visualization Module (Highest Impact)**
- **Why:** Most complex, most reusable
- **Effort:** 2 days
- **Benefits:**
  - Isolate Leaflet/Chart.js complexity
  - Enable independent testing
  - Improve map performance

**Components to Extract:**
```
src/modules/visualization/
├── components/
│   ├── TrackMap.vue           # Leaflet map with polylines
│   ├── AltitudeChart.vue      # Chart.js altitude visualization
│   ├── SpeedChart.vue         # Chart.js speed visualization
│   └── ResultsTable.vue       # Filterable results table
├── composables/
│   ├── useMapControl.ts       # Leaflet instance management
│   ├── useChartSync.ts        # Synchronized crosshair
│   └── useTrackSelection.ts   # Track selection logic
└── store/
    └── visualizationStore.ts  # selectedTrackIds, mapMode
```

**Priority 2: Extract Filter Module (Medium Impact)**
- **Why:** Complex business logic, needs testing
- **Effort:** 1.5 days
- **Benefits:**
  - Isolate filter engine complexity
  - Enable unit testing of expressions
  - Improve filter performance

**Priority 3: Extract Race Module (Low Impact)**
- **Why:** Simple data loading, less complexity
- **Effort:** 1 day
- **Benefits:**
  - Clean API layer
  - Simple store for race data
  - Easy to test

### 7.4 Code Smell Examples

**Example 1: God Method**
```javascript
// Current: renderResultsOnMap() does too much (100+ lines)
renderResultsOnMap() {
  // 1. Clear old layers (10 lines)
  // 2. Iterate results (20 lines)
  // 3. Create polylines (30 lines)
  // 4. Bind popups (20 lines)
  // 5. Adjust map bounds (20 lines)
}

// Better: Split into focused functions
function clearMapLayers() { ... }
function createSegmentPolyline(segment) { ... }
function fitMapToSegments(segments) { ... }
```

**Example 2: Prop Drilling**
```vue
<!-- Current: Pass data through multiple layers -->
<FilterDashboard :tracks="tracks" :results="results">
  <FilterForm :tracks="tracks">
    <TrackSelector :tracks="tracks" />
  </FilterForm>
</FilterDashboard>

<!-- Better: Use Pinia store -->
<script setup>
const raceStore = useRaceStore()
const { tracks } = storeToRefs(raceStore)
</script>
```

**Example 3: Unclear Responsibilities**
```javascript
// Current: highlightTrack() does map + charts + table
async highlightTrack(trackId) {
  // Update map polylines (20 lines)
  // Load track points (10 lines)
  // Update charts (30 lines)
  // Update table selection (5 lines)
}

// Better: Separate concerns
// Composable: useMapHighlight()
// Composable: useChartData()
// Store: visualizationStore.selectedTrackId
```

### 7.5 Migration Risk Assessment

**Low Risk:**
- Extract shared components (BaseButton, LoadingSkeleton)
- Setup Vite and TypeScript
- Create folder structure

**Medium Risk:**
- Extract visualization module (complex Leaflet/Chart.js interactions)
- Migrate state to Pinia (ensure reactivity works)
- Update API calls (ensure same behavior)

**High Risk:**
- Remove original `index.html` (do this LAST)
- Change build process (CI/CD updates needed)
- Update deployment (new dist folder structure)

**Mitigation Strategies:**
1. **Incremental Migration:** Keep old and new versions running in parallel
2. **Feature Parity Checklist:** Ensure every feature works before removing old code
3. **E2E Tests:** Write tests for critical workflows BEFORE migration
4. **Rollback Plan:** Keep `index.html` backup for quick revert

---

**End of Component Organization Reference**

**Summary:** This guide provides a comprehensive roadmap for organizing Vue 3 applications, with specific recommendations for migrating the pigeon racing track filter from a single-file monolith to a modular, testable, production-ready architecture. Follow the 4-phase migration plan for a systematic, low-risk transition.
