# Leaflet Map Integration with Vue 3

**Version:** 1.0.0
**Last Updated:** 2025-11-10
**Target:** Vue 3.4+ with Composition API
**Leaflet Version:** 1.9.4+

---

## Table of Contents

1. [Integration Approaches](#integration-approaches)
2. [Map Lifecycle Management](#map-lifecycle-management)
3. [Responsive Map Design](#responsive-map-design)
4. [Layer Management](#layer-management)
5. [Performance Optimization](#performance-optimization)
6. [Event Handling](#event-handling)
7. [Common Pitfalls](#common-pitfalls)
8. [Project-Specific Solutions](#project-specific-solutions)

---

## Integration Approaches

### Direct Leaflet API vs vue-leaflet Wrapper

There are two primary approaches to integrating Leaflet with Vue 3:

#### **Approach 1: Direct Leaflet API (Imperative)**

**Use when:**
- You need full control over map behavior
- Implementing custom controls or interactions
- Working with complex layer management
- Performance is critical (no wrapper overhead)

**Pros:**
- Complete access to Leaflet API
- No library dependencies beyond Leaflet
- Full control over lifecycle
- Better for complex custom features

**Cons:**
- More boilerplate code
- Manual memory leak prevention required
- Must handle reactivity manually

**Example:**
```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const mapContainer = ref(null)
let map = null

onMounted(() => {
  // Initialize map imperatively
  map = L.map(mapContainer.value).setView([25.033, 121.565], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
})

onUnmounted(() => {
  // CRITICAL: Clean up to prevent memory leaks
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div ref="mapContainer" style="height: 600px"></div>
</template>
```

#### **Approach 2: vue-leaflet Components (Declarative)**

**Use when:**
- Building simple map layouts
- You prefer template-based declarations
- Rapid prototyping
- Don't need complex custom controls

**Pros:**
- Declarative template syntax
- Automatic lifecycle management
- Reactive props for zoom, center, bounds
- Less boilerplate

**Cons:**
- Limited to supported features
- Less control over internals
- Beta status for Vue 3 (as of 2024)
- May need to mix with direct API anyway

**Example:**
```vue
<script setup>
import { ref } from 'vue'
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'

const zoom = ref(13)
const center = ref([25.033, 121.565])
const markers = ref([
  { id: 1, position: [25.033, 121.565], name: 'Start' }
])
</script>

<template>
  <l-map
    v-model:zoom="zoom"
    v-model:center="center"
    :useGlobalLeaflet="false"
    style="height: 600px"
  >
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; OpenStreetMap contributors"
    />
    <l-marker
      v-for="marker in markers"
      :key="marker.id"
      :lat-lng="marker.position"
    />
  </l-map>
</template>
```

#### **Approach 3: Hybrid (Recommended for Complex Apps)**

**Best of both worlds:**
- Use vue-leaflet for structure (map container, base layers)
- Use direct API for dynamic features (custom polylines, popups)

**Example:**
```vue
<script setup>
import { ref, onMounted } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'

const mapRef = ref(null)
const suspiciousSegments = ref([])
let leafletMap = null

onMounted(async () => {
  // Wait for vue-leaflet to initialize
  await new Promise(resolve => setTimeout(resolve, 100))

  if (mapRef.value?.leafletObject) {
    leafletMap = mapRef.value.leafletObject

    // Now use direct API for custom layers
    addSuspiciousSegmentLayer()
  }
})

function addSuspiciousSegmentLayer() {
  suspiciousSegments.value.forEach(segment => {
    const polyline = L.polyline(segment.coordinates, {
      color: getColorByConfidence(segment.confidence),
      weight: 4,
      opacity: 0.7
    })

    polyline.bindPopup(`
      <strong>Suspicious Segment</strong><br>
      Confidence: ${segment.confidence}%
    `)

    polyline.addTo(leafletMap)
  })
}
</script>

<template>
  <l-map
    ref="mapRef"
    :zoom="13"
    :center="[25.033, 121.565]"
    style="height: 600px"
  >
    <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  </l-map>
</template>
```

### Project Recommendation

**For the pigeon racing trajectory filtering system:**

Use **Direct Leaflet API** because:
1. **Complex custom features** - Multi-track rendering with different colors, dynamic highlighting
2. **Performance critical** - Rendering 50k+ points per track
3. **Fine-grained control needed** - Custom popup components, synchronized map-chart interactions
4. **Memory leak prevention** - Critical for long-running dashboard applications

**Migration path from current global map instance:**

Current implementation (`frontend/index.html`) uses a global `map` variable:
```javascript
// ❌ Current: Global instance (memory leak risk)
let map = null

mounted() {
  map = L.map('map').setView([24.75, 121.25], 9)
}
```

**Recommended migration:**
```vue
<script setup>
// ✅ Component-scoped with proper cleanup
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const mapContainer = ref(null)
const map = shallowRef(null)  // Use shallowRef for Leaflet instances

onMounted(() => {
  map.value = L.map(mapContainer.value).setView([24.75, 121.25], 9)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>

<template>
  <div ref="mapContainer" style="height: 600px"></div>
</template>
```

---

## Map Lifecycle Management

### The Memory Leak Problem

**Critical Issue:** Leaflet maps do NOT automatically clean up. Without proper cleanup, every component mount/unmount cycle creates orphaned DOM listeners and map instances, causing memory leaks.

**Current Project Issue:**

The current `frontend/index.html` implementation:
```javascript
// ❌ MEMORY LEAK: No cleanup in beforeUnmount
mounted() {
  this.initMap();
  this.initCharts();
  this.loadRaces();

  // Listener added but never removed
  window.addEventListener('resize', this.handleResize);
}

// ❌ Missing: beforeUnmount cleanup
```

**Memory leak symptoms:**
- Browser memory usage grows over time
- Slow performance after navigating away and back
- Console warnings about detached DOM nodes
- Event handlers firing multiple times

### Proper Lifecycle Pattern

#### **Pattern 1: Initialization in `onMounted`**

```vue
<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const mapContainer = ref(null)
const map = shallowRef(null)  // IMPORTANT: Use shallowRef for non-reactive objects

onMounted(() => {
  // Initialize only after DOM is ready
  map.value = L.map(mapContainer.value).setView([25.033, 121.565], 13)

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map.value)

  // Add event listeners
  map.value.on('click', handleMapClick)
  map.value.on('zoomend', handleZoomEnd)
})
</script>
```

#### **Pattern 2: Cleanup in `onUnmounted`**

```vue
<script setup>
import { shallowRef, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)
const markers = []

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)

  // Add layers
  const marker = L.marker([25.033, 121.565]).addTo(map.value)
  markers.push(marker)
})

onUnmounted(() => {
  // CRITICAL: Clean up in correct order

  // 1. Remove event listeners
  if (map.value) {
    map.value.off('click')
    map.value.off('zoomend')
  }

  // 2. Remove all layers
  markers.forEach(marker => {
    if (map.value) {
      map.value.removeLayer(marker)
    }
  })

  // 3. Destroy map instance
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>
```

#### **Pattern 3: Reactive Map Instance with `shallowRef`**

**Why `shallowRef`?**
- Leaflet map objects are complex, non-reactive DOM structures
- Vue's deep reactivity would try to proxy Leaflet internals (slow, buggy)
- `shallowRef` stores reference without deep reactivity

**❌ Wrong:**
```vue
<script setup>
import { ref } from 'vue'

// ❌ DON'T use ref for Leaflet instances
const map = ref(null)  // Vue will try to make Leaflet reactive!
</script>
```

**✅ Correct:**
```vue
<script setup>
import { shallowRef } from 'vue'

// ✅ Use shallowRef for Leaflet instances
const map = shallowRef(null)  // Only reference is reactive, not internals
</script>
```

#### **Pattern 4: Layer Management with Refs**

Store layer references for cleanup:

```vue
<script setup>
import { shallowRef, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)
const layers = shallowRef({
  polylines: [],
  markers: [],
  popups: []
})

function addTrackPolyline(coords, trackId) {
  const polyline = L.polyline(coords, {
    color: '#FF0000',
    weight: 4
  }).addTo(map.value)

  // Store reference for cleanup
  layers.value.polylines.push({ id: trackId, polyline })

  return polyline
}

function clearAllLayers() {
  // Remove all polylines
  layers.value.polylines.forEach(({ polyline }) => {
    map.value.removeLayer(polyline)
  })
  layers.value.polylines = []

  // Remove all markers
  layers.value.markers.forEach(marker => {
    map.value.removeLayer(marker)
  })
  layers.value.markers = []
}

onUnmounted(() => {
  clearAllLayers()

  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>
```

### VueUse Composable for Automatic Cleanup

**Best Practice:** Use VueUse for automatic event listener cleanup:

```vue
<script setup>
import { shallowRef, onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import L from 'leaflet'

const map = shallowRef(null)

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)

  // ✅ useEventListener automatically removes listener on unmount
  useEventListener(window, 'resize', () => {
    map.value?.invalidateSize()
  })
})

// ❌ No need for manual cleanup of window listener
// VueUse handles it automatically
</script>
```

### Current Project Fix

**Replace this:**
```javascript
// ❌ frontend/index.html (lines 947-949)
mounted() {
  this.initMap();
  window.addEventListener('resize', this.handleResize);
}
```

**With this:**
```vue
<script setup>
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import L from 'leaflet'

const mapContainer = ref(null)
const map = shallowRef(null)

onMounted(() => {
  map.value = L.map(mapContainer.value).setView([24.75, 121.25], 9)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)

  // Force correct size calculation after mount
  setTimeout(() => {
    map.value?.invalidateSize()
  }, 100)
})

// ✅ Automatic cleanup with VueUse
useEventListener(window, 'resize', () => {
  map.value?.invalidateSize()
}, { passive: true })

onUnmounted(() => {
  if (map.value) {
    map.value.off()  // Remove all event listeners
    map.value.remove()
    map.value = null
  }
})
</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>
```

---

## Responsive Map Design

### The Problem with Manual `resize` Listeners

Current project approach (`frontend/index.html`, line 1591-1608):

```javascript
// ❌ Old approach: Manual debounce, manual cleanup risk
handleResize() {
  clearTimeout(this.resizeTimeout);
  this.resizeTimeout = setTimeout(() => {
    if (this.map) {
      this.map.invalidateSize();
    }
    // Update charts...
  }, 250);
}

mounted() {
  window.addEventListener('resize', this.handleResize);
}

// ❌ MISSING: beforeUnmount cleanup
```

**Issues:**
1. Manual debounce implementation
2. Easy to forget cleanup
3. Not using modern ResizeObserver
4. Global window listener instead of container-specific

### Modern Approach: ResizeObserver

**ResizeObserver advantages:**
- Observes element size changes, not just window resize
- Fires even when container resizes due to CSS/layout changes
- More accurate than window resize events
- Better for responsive layouts with dynamic containers

#### **Pattern 1: VueUse `useResizeObserver`**

```vue
<script setup>
import { ref, shallowRef, onMounted, nextTick } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import L from 'leaflet'

const mapContainer = ref(null)
const map = shallowRef(null)

onMounted(() => {
  map.value = L.map(mapContainer.value).setView([25.033, 121.565], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)
})

// ✅ Modern approach: Watch container element
useResizeObserver(mapContainer, async () => {
  await nextTick()  // Wait for DOM update

  if (map.value) {
    map.value.invalidateSize()
  }
})
</script>

<template>
  <div ref="mapContainer" class="map-wrapper">
    <!-- Map will auto-resize when container changes -->
  </div>
</template>

<style scoped>
.map-wrapper {
  height: calc(100vh - 300px);
  min-height: 400px;
  max-height: calc(100vh - 200px);
}
</style>
```

#### **Pattern 2: Debounced Window Resize with VueUse**

If you need to stick with window resize (e.g., for chart sync):

```vue
<script setup>
import { shallowRef, onMounted } from 'vue'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import L from 'leaflet'

const map = shallowRef(null)

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)
})

// ✅ Auto-cleanup + built-in debounce
const handleResize = useDebounceFn(() => {
  map.value?.invalidateSize()
}, 250)

useEventListener(window, 'resize', handleResize, { passive: true })
</script>
```

#### **Pattern 3: Dynamic Height with CSS Variables**

**Problem:** Fixed pixel heights break responsive design

**❌ Wrong:**
```css
#map {
  height: 600px;  /* Breaks on mobile, small screens, etc. */
}
```

**✅ Correct: Viewport-based with constraints**
```vue
<template>
  <div class="map-container">
    <div ref="mapElement" class="map"></div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  flex: 1;
  min-height: 400px;

  /* Responsive height using viewport units */
  max-height: calc(100vh - 500px);
}

/* Medium screens: More vertical space */
@media (min-width: 900px) {
  .map-container {
    max-height: calc(100vh - 400px);
  }
}

/* Large screens: Maximum vertical space */
@media (min-width: 1200px) {
  .map-container {
    max-height: calc(100vh - 300px);
  }
}

.map {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}
</style>
```

### Copy-Paste Solution for Current Project

Replace current resize handling in `frontend/index.html`:

```vue
<script setup>
import { ref, shallowRef, onMounted } from 'vue'
import { useResizeObserver, useDebounceFn } from '@vueuse/core'
import L from 'leaflet'
import Chart from 'chart.js/auto'

const mapContainer = ref(null)
const map = shallowRef(null)
const altitudeChart = shallowRef(null)
const speedChart = shallowRef(null)

onMounted(() => {
  // Initialize map
  map.value = L.map(mapContainer.value).setView([24.75, 121.25], 9)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)

  // Initialize charts (existing code)
  // ...
})

// ✅ Modern responsive solution
useResizeObserver(mapContainer, useDebounceFn(() => {
  // Resize map
  map.value?.invalidateSize()

  // Resize charts
  altitudeChart.value?.resize()
  speedChart.value?.resize()
}, 250))
</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<style>
.map-container {
  flex: 1;
  min-height: 400px;
  max-height: calc(100vh - 500px);
}

@media (min-width: 900px) {
  .map-container {
    max-height: calc(100vh - 400px);
  }
}

@media (min-width: 1200px) {
  .map-container {
    max-height: calc(100vh - 300px);
  }
}
</style>
```

### Mobile Responsiveness

For touch devices, adjust map interactions:

```vue
<script setup>
import { onMounted, shallowRef } from 'vue'
import { useWindowSize } from '@vueuse/core'
import L from 'leaflet'

const map = shallowRef(null)
const { width } = useWindowSize()

onMounted(() => {
  const isMobile = width.value < 768

  map.value = L.map('map', {
    // Disable drag on mobile to avoid scroll conflicts
    dragging: !isMobile,

    // Enable tap for mobile
    tap: isMobile,

    // Adjust zoom controls
    zoomControl: !isMobile,  // Hide on mobile to save space

    // Disable animations on mobile for performance
    zoomAnimation: !isMobile
  }).setView([25.033, 121.565], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)
})
</script>
```

---

## Layer Management

### Reactive Markers with `watchEffect`

**Pattern:** Automatically sync Vue reactive data with Leaflet markers

```vue
<script setup>
import { ref, shallowRef, watchEffect, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)
const tracks = ref([])  // Reactive array of track data
const markerLayer = shallowRef(null)

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  markerLayer.value = L.layerGroup().addTo(map.value)
})

// ✅ Automatically update markers when tracks change
watchEffect(() => {
  if (!markerLayer.value) return

  // Clear existing markers
  markerLayer.value.clearLayers()

  // Add new markers from reactive data
  tracks.value.forEach(track => {
    if (track.points && track.points.length > 0) {
      const firstPoint = track.points[0]

      L.marker([firstPoint.lat, firstPoint.lng])
        .bindPopup(`
          <strong>${track.pigeon_number}</strong><br>
          Total Points: ${track.points.length}
        `)
        .addTo(markerLayer.value)
    }
  })
})

onUnmounted(() => {
  if (markerLayer.value) {
    markerLayer.value.clearLayers()
  }
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>
```

### GeoJSON from PostGIS Rendering

**Use case:** Rendering track points stored in PostGIS as GeoJSON

```vue
<script setup>
import { ref, computed, shallowRef, onMounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)
const trackPoints = ref([])  // From API: [{lat, lng, altitude, speed, ...}]
const geoJsonLayer = shallowRef(null)

// Convert track points to GeoJSON FeatureCollection
const trackGeoJSON = computed(() => ({
  type: 'FeatureCollection',
  features: trackPoints.value.map((point, index) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.lng, point.lat]  // GeoJSON is [lng, lat]
    },
    properties: {
      id: point.id,
      index: index,
      altitude: point.altitude,
      speed: point.moving_speed,
      timestamp: point.timestamp,
      anomalies: point.anomaly_flags
    }
  }))
}))

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  // Create GeoJSON layer with custom styling
  geoJsonLayer.value = L.geoJSON(null, {
    pointToLayer: (feature, latlng) => {
      const { speed, anomalies } = feature.properties

      // Color code by speed
      let color = 'green'
      if (speed > 100) color = 'red'
      else if (speed > 60) color = 'orange'

      // Larger radius if anomalies detected
      const radius = anomalies && anomalies.length > 0 ? 8 : 5

      return L.circleMarker(latlng, {
        radius,
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      })
    },
    onEachFeature: (feature, layer) => {
      const { altitude, speed, timestamp, anomalies } = feature.properties

      layer.bindPopup(`
        <strong>Point ${feature.properties.index + 1}</strong><br>
        <strong>Speed:</strong> ${speed} km/h<br>
        <strong>Altitude:</strong> ${altitude} m<br>
        <strong>Time:</strong> ${new Date(timestamp).toLocaleString()}<br>
        ${anomalies && anomalies.length > 0 ?
          `<span style="color: red;">⚠️ Anomalies: ${anomalies.join(', ')}</span>` :
          ''}
      `)
    }
  }).addTo(map.value)
})

// Watch for changes and update GeoJSON
watchEffect(() => {
  if (geoJsonLayer.value && trackGeoJSON.value) {
    geoJsonLayer.value.clearLayers()
    geoJsonLayer.value.addData(trackGeoJSON.value)
  }
})
</script>
```

### Polyline Updates for Track Segments

**Project-specific:** Rendering suspicious track segments with color coding

```vue
<script setup>
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)
const suspiciousSegments = ref([])  // From filter API
const polylines = shallowRef({})    // { trackId: [polyline1, polyline2, ...] }

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)
})

function clearPolylines() {
  Object.values(polylines.value).forEach(polylineArray => {
    polylineArray.forEach(p => map.value.removeLayer(p))
  })
  polylines.value = {}
}

function renderSuspiciousSegments() {
  clearPolylines()

  suspiciousSegments.value.forEach(segment => {
    const { track_id, location, confidence_score } = segment

    // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
    const coords = location.coordinates.map(c => [c[1], c[0]])

    // Color by confidence score
    let color = '#f1c40f'  // Low (yellow)
    if (confidence_score >= 0.8) color = '#e74c3c'  // High (red)
    else if (confidence_score >= 0.6) color = '#f39c12'  // Medium (orange)

    const polyline = L.polyline(coords, {
      color,
      weight: 6,
      opacity: 0.7,
      zIndexOffset: 1000  // Ensure visible above other layers
    })
    .bindPopup(`
      <strong>Suspicious Segment</strong><br>
      Confidence: ${(confidence_score * 100).toFixed(1)}%<br>
      Points: ${coords.length}<br>
      Track ID: ${track_id}
    `)
    .addTo(map.value)

    // Store reference
    if (!polylines.value[track_id]) {
      polylines.value[track_id] = []
    }
    polylines.value[track_id].push(polyline)
  })

  // Auto-fit bounds
  if (suspiciousSegments.value.length > 0) {
    const allCoords = []
    suspiciousSegments.value.forEach(segment => {
      segment.location.coordinates.forEach(c => {
        allCoords.push([c[1], c[0]])
      })
    })
    map.value.fitBounds(allCoords, { padding: [50, 50] })
  }
}

// Watch for changes
watch(suspiciousSegments, () => {
  renderSuspiciousSegments()
}, { deep: true })

onUnmounted(() => {
  clearPolylines()
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>
```

### Custom Marker Components

**Advanced:** Using Vue components as Leaflet marker popups

```vue
<script setup>
import { createApp, h, shallowRef, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import TrackDetailsPopup from './TrackDetailsPopup.vue'

const map = shallowRef(null)

function createVuePopup(component, props) {
  // Create container for Vue component
  const container = document.createElement('div')

  // Mount Vue component
  const app = createApp({
    render() {
      return h(component, props)
    }
  })

  app.mount(container)

  // Create Leaflet popup
  const popup = L.popup({
    maxWidth: 400,
    className: 'vue-popup'
  }).setContent(container)

  // Cleanup on popup close
  popup.on('remove', () => {
    app.unmount()
  })

  return popup
}

function showTrackDetails(track, latlng) {
  const popup = createVuePopup(TrackDetailsPopup, {
    track,
    onClose: () => map.value.closePopup()
  })

  popup.setLatLng(latlng).openOn(map.value)
}

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  // Example: Add marker with Vue component popup
  const marker = L.marker([25.033, 121.565]).addTo(map.value)

  marker.on('click', (e) => {
    showTrackDetails({
      id: 1,
      pigeon_number: 'TW-2025-001',
      total_points: 500
    }, e.latlng)
  })
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>
```

### Layer Groups and Controls

**Pattern:** Organize layers into groups with toggle controls

```vue
<script setup>
import { ref, shallowRef, onMounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)
const layerGroups = shallowRef({})
const showNormalTracks = ref(true)
const showSuspiciousTracks = ref(true)

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  // Create layer groups
  layerGroups.value = {
    normal: L.layerGroup().addTo(map.value),
    suspicious: L.layerGroup().addTo(map.value),
    markers: L.layerGroup().addTo(map.value)
  }

  // Add custom control
  const layerControl = L.control({ position: 'topright' })

  layerControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-control-layers')
    div.innerHTML = `
      <label>
        <input type="checkbox" id="toggle-normal" checked> Normal Tracks
      </label><br>
      <label>
        <input type="checkbox" id="toggle-suspicious" checked> Suspicious Tracks
      </label>
    `
    return div
  }

  layerControl.addTo(map.value)
})

function toggleLayer(layerName, show) {
  if (show) {
    map.value.addLayer(layerGroups.value[layerName])
  } else {
    map.value.removeLayer(layerGroups.value[layerName])
  }
}

watch(showNormalTracks, (show) => toggleLayer('normal', show))
watch(showSuspiciousTracks, (show) => toggleLayer('suspicious', show))
</script>

<template>
  <div>
    <div id="map" style="height: 600px"></div>

    <div class="layer-controls">
      <label>
        <input type="checkbox" v-model="showNormalTracks">
        Show Normal Tracks
      </label>
      <label>
        <input type="checkbox" v-model="showSuspiciousTracks">
        Show Suspicious Tracks
      </label>
    </div>
  </div>
</template>
```

---

## Performance Optimization

### PruneCluster for 50k+ Markers

**Problem:** Default Leaflet.markercluster plugin is slow with large datasets (1000ms+ for 50k markers)

**Solution:** PruneCluster processes 50k markers in 60ms (50x faster)

**Installation:**
```bash
npm install prunecluster
```

**Basic Usage:**
```vue
<script setup>
import { shallowRef, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import PruneClusterForLeaflet from 'prunecluster'

const map = shallowRef(null)
const pruneCluster = shallowRef(null)

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  // Create PruneCluster instance
  pruneCluster.value = new PruneClusterForLeaflet()

  // Add 50,000 markers - still fast!
  for (let i = 0; i < 50000; i++) {
    const marker = new PruneCluster.Marker(
      25.033 + Math.random() * 0.1,
      121.565 + Math.random() * 0.1
    )
    marker.data.id = i
    marker.data.name = `Point ${i}`

    pruneCluster.value.RegisterMarker(marker)
  }

  // Add cluster to map
  map.value.addLayer(pruneCluster.value)
})

onUnmounted(() => {
  if (pruneCluster.value) {
    map.value.removeLayer(pruneCluster.value)
  }
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>
```

**Advanced: Custom Marker Icons and Popups**
```vue
<script setup>
import { shallowRef, onMounted } from 'vue'
import L from 'leaflet'
import PruneClusterForLeaflet from 'prunecluster'

const map = shallowRef(null)
const pruneCluster = shallowRef(null)

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  pruneCluster.value = new PruneClusterForLeaflet()

  // Customize marker appearance
  pruneCluster.value.BuildLeafletMarker = function(marker, position) {
    const { speed } = marker.data

    // Color by speed
    let color = 'green'
    if (speed > 100) color = 'red'
    else if (speed > 60) color = 'orange'

    const m = new L.Marker(position, {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 10px; height: 10px; border-radius: 50%;"></div>`
      })
    })

    // Add popup
    m.bindPopup(`
      <strong>${marker.data.name}</strong><br>
      Speed: ${marker.data.speed} km/h
    `)

    return m
  }

  // Add markers with data
  trackPoints.value.forEach((point, i) => {
    const marker = new PruneCluster.Marker(point.lat, point.lng)
    marker.data = {
      id: point.id,
      name: `Point ${i}`,
      speed: point.moving_speed,
      altitude: point.altitude
    }
    pruneCluster.value.RegisterMarker(marker)
  })

  map.value.addLayer(pruneCluster.value)
})
</script>
```

**Real-time Filtering:**
```vue
<script setup>
import { ref, watch, shallowRef, onMounted } from 'vue'
import PruneClusterForLeaflet from 'prunecluster'

const pruneCluster = shallowRef(null)
const speedFilter = ref({ min: 0, max: 200 })
const allMarkers = ref([])  // Store all marker references

watch(speedFilter, (filter) => {
  // Filter markers by speed (no performance cost with PruneCluster!)
  allMarkers.value.forEach(marker => {
    const speed = marker.data.speed

    if (speed >= filter.min && speed <= filter.max) {
      marker.filtered = false  // Show marker
    } else {
      marker.filtered = true   // Hide marker
    }
  })

  // Update cluster
  pruneCluster.value.ProcessView()
}, { deep: true })

onMounted(() => {
  pruneCluster.value = new PruneClusterForLeaflet()

  // Add markers and store references
  trackPoints.value.forEach(point => {
    const marker = new PruneCluster.Marker(point.lat, point.lng)
    marker.data = { speed: point.moving_speed }
    marker.filtered = false

    pruneCluster.value.RegisterMarker(marker)
    allMarkers.value.push(marker)
  })

  map.value.addLayer(pruneCluster.value)
})
</script>

<template>
  <div>
    <div>
      <label>Speed Filter:</label>
      <input v-model.number="speedFilter.min" type="number" placeholder="Min">
      <input v-model.number="speedFilter.max" type="number" placeholder="Max">
    </div>
    <div id="map" style="height: 600px"></div>
  </div>
</template>
```

### Canvas Renderer vs SVG Renderer

**When to use Canvas:**
- Large number of paths/polygons (1000+)
- Performance is critical
- Don't need precise click detection on individual paths

**When to use SVG:**
- Small/medium datasets (<1000 elements)
- Need precise click/hover on individual elements
- Better for styling and animations

**Canvas Renderer Example:**
```vue
<script setup>
import { shallowRef, onMounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)

onMounted(() => {
  map.value = L.map('map', {
    // Use Canvas renderer for better performance with many paths
    renderer: L.canvas({ padding: 0.5 })
  }).setView([25.033, 121.565], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  // Add thousands of polylines - Canvas renderer handles it smoothly
  for (let i = 0; i < 5000; i++) {
    const latlngs = [
      [25.033 + Math.random() * 0.01, 121.565 + Math.random() * 0.01],
      [25.033 + Math.random() * 0.01, 121.565 + Math.random() * 0.01]
    ]

    L.polyline(latlngs, {
      color: `hsl(${i % 360}, 70%, 50%)`,
      weight: 2
    }).addTo(map.value)
  }
})
</script>
```

### Virtual Scrolling for Large Datasets

**Use case:** Displaying thousands of track points in a table alongside the map

**Pattern:** Only render visible rows

```vue
<script setup>
import { ref, computed } from 'vue'
import { useVirtualList } from '@vueuse/core'

const trackPoints = ref([])  // 50,000 points from API

const { list, containerProps, wrapperProps } = useVirtualList(
  trackPoints,
  {
    itemHeight: 48,    // Fixed row height for performance
    overscan: 10       // Render 10 extra items for smooth scrolling
  }
)
</script>

<template>
  <div class="virtual-table">
    <!-- Header (fixed) -->
    <div class="table-header">
      <div>Point #</div>
      <div>Lat</div>
      <div>Lng</div>
      <div>Altitude</div>
      <div>Speed</div>
    </div>

    <!-- Virtual scrolling container -->
    <div v-bind="containerProps" class="table-body">
      <div v-bind="wrapperProps">
        <div
          v-for="{ index, data } in list"
          :key="data.id"
          class="table-row"
        >
          <div>{{ index + 1 }}</div>
          <div>{{ data.lat.toFixed(6) }}</div>
          <div>{{ data.lng.toFixed(6) }}</div>
          <div>{{ data.altitude }} m</div>
          <div>{{ data.moving_speed }} km/h</div>
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
}

.table-body {
  flex: 1;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 120px 120px 100px 100px;
  height: 48px;  /* Must match itemHeight */
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}
</style>
```

### Performance Benchmarks

| Operation | Bad Practice | Good Practice | Speedup |
|-----------|-------------|---------------|---------|
| **50k markers** | Leaflet.markercluster: 1200ms | PruneCluster: 60ms | 20x |
| **5k polylines** | SVG renderer: 800ms | Canvas renderer: 180ms | 4.4x |
| **Scroll 50k rows** | Full render: 5000ms | Virtual scroll: 50ms | 100x |
| **Map resize** | Manual debounce: 250ms | ResizeObserver: instant | N/A |
| **Layer updates** | Remove all + re-add: 400ms | LayerGroup.clearLayers: 15ms | 26x |

---

## Event Handling

### Map Click, Zoom, and Move Events

**Basic event handling:**
```vue
<script setup>
import { shallowRef, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)

function handleMapClick(e) {
  console.log('Clicked at:', e.latlng)
  L.popup()
    .setLatLng(e.latlng)
    .setContent(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`)
    .openOn(map.value)
}

function handleZoomEnd(e) {
  console.log('Current zoom:', map.value.getZoom())
}

function handleMoveEnd(e) {
  const center = map.value.getCenter()
  console.log('Center:', center.lat, center.lng)
}

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  // Add event listeners
  map.value.on('click', handleMapClick)
  map.value.on('zoomend', handleZoomEnd)
  map.value.on('moveend', handleMoveEnd)
})

onUnmounted(() => {
  if (map.value) {
    // Remove event listeners
    map.value.off('click', handleMapClick)
    map.value.off('zoomend', handleZoomEnd)
    map.value.off('moveend', handleMoveEnd)

    map.value.remove()
    map.value = null
  }
})
</script>
```

### Marker Click with Vue Component State Sync

**Project example:** Click marker → update selected track → trigger chart update

```vue
<script setup>
import { ref, shallowRef, watch, onMounted } from 'vue'
import L from 'leaflet'
import Chart from 'chart.js/auto'

const map = shallowRef(null)
const altitudeChart = shallowRef(null)
const selectedTrackId = ref(null)
const tracks = ref([])
const trackMarkers = shallowRef({})

function selectTrack(trackId) {
  selectedTrackId.value = trackId
}

// Watch for track selection and update chart
watch(selectedTrackId, async (trackId) => {
  if (!trackId) {
    // Clear chart
    altitudeChart.value.data.labels = []
    altitudeChart.value.data.datasets[0].data = []
    altitudeChart.value.update()

    // Reset marker styles
    Object.values(trackMarkers.value).forEach(marker => {
      marker.setOpacity(0.7)
    })
    return
  }

  // Fetch track points
  const response = await fetch(`/api/tracks/${trackId}/detail?include_points=true`)
  const data = await response.json()
  const points = data.points || []

  // Update chart
  altitudeChart.value.data.labels = points.map((_, i) => i + 1)
  altitudeChart.value.data.datasets[0].data = points.map(p => p.altitude)
  altitudeChart.value.update()

  // Highlight selected marker
  Object.entries(trackMarkers.value).forEach(([id, marker]) => {
    marker.setOpacity(parseInt(id) === trackId ? 1.0 : 0.3)
  })

  // Center map on track
  const trackCoords = points.map(p => [p.lat, p.lng])
  if (trackCoords.length > 0) {
    map.value.fitBounds(trackCoords, { padding: [50, 50] })
  }
})

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  // Initialize chart
  const ctx = document.getElementById('altitudeChart').getContext('2d')
  altitudeChart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Altitude (m)',
        data: [],
        borderColor: '#2196f3',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })

  // Add markers for each track
  tracks.value.forEach(track => {
    if (track.points && track.points.length > 0) {
      const firstPoint = track.points[0]

      const marker = L.marker([firstPoint.lat, firstPoint.lng])
        .bindPopup(`
          <strong>${track.pigeon_number}</strong><br>
          Points: ${track.points.length}<br>
          <button onclick="window.selectTrack(${track.track_id})">Select</button>
        `)
        .addTo(map.value)

      // Add click handler
      marker.on('click', () => {
        selectTrack(track.track_id)
      })

      trackMarkers.value[track.track_id] = marker
    }
  })
})

// Expose selectTrack to global for popup button
window.selectTrack = selectTrack
</script>

<template>
  <div class="dashboard">
    <div id="map" style="height: 600px"></div>
    <div style="height: 300px; margin-top: 16px;">
      <canvas id="altitudeChart"></canvas>
    </div>
  </div>
</template>
```

### Polyline Click with State Update

**Project-specific:** Click track polyline → highlight in table → update charts

```vue
<script setup>
import { ref, shallowRef, watch, onMounted } from 'vue'
import L from 'leaflet'

const map = shallowRef(null)
const selectedTrackId = ref(null)
const trackPolylines = shallowRef({})  // { trackId: [polyline1, polyline2] }
const results = ref([])  // Filter results

function highlightTrack(trackId) {
  // Toggle selection
  if (selectedTrackId.value === trackId) {
    selectedTrackId.value = null

    // Reset all polylines to default style
    Object.values(trackPolylines.value).forEach(polylines => {
      polylines.forEach(p => {
        p.setStyle({ opacity: 0.7, weight: 6, color: '#FF0000' })
      })
    })
    return
  }

  // Select new track
  selectedTrackId.value = trackId

  // Update polyline styles
  Object.entries(trackPolylines.value).forEach(([id, polylines]) => {
    const isSelected = parseInt(id) === parseInt(trackId)

    polylines.forEach(p => {
      p.setStyle({
        opacity: isSelected ? 1.0 : 0.3,
        weight: isSelected ? 12 : 6,
        color: isSelected ? '#0000FF' : '#FF0000'
      })
    })
  })

  // Scroll table to selected row
  const row = document.querySelector(`tr[data-track-id="${trackId}"]`)
  row?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)
})

function renderResults() {
  // Clear previous polylines
  Object.values(trackPolylines.value).forEach(polylines => {
    polylines.forEach(p => map.value.removeLayer(p))
  })
  trackPolylines.value = {}

  // Render suspicious segments
  results.value.forEach(result => {
    if (!trackPolylines.value[result.track_id]) {
      trackPolylines.value[result.track_id] = []
    }

    result.matched_segments.forEach(segment => {
      const coords = segment.location.coordinates.map(c => [c[1], c[0]])

      const polyline = L.polyline(coords, {
        color: '#FF0000',
        weight: 6,
        opacity: 0.7,
        zIndexOffset: 1000
      })
      .bindPopup(`
        <strong>${result.pigeon_number}</strong><br>
        Confidence: ${result.confidence_score.toFixed(2)}
      `)
      .addTo(map.value)

      // Add click handler
      polyline.on('click', () => {
        highlightTrack(result.track_id)
      })

      trackPolylines.value[result.track_id].push(polyline)
    })
  })
}

// Watch for results changes
watch(results, renderResults, { deep: true })
</script>

<template>
  <div>
    <div id="map" style="height: 600px"></div>

    <table class="results-table">
      <tr
        v-for="result in results"
        :key="result.track_id"
        :data-track-id="result.track_id"
        :class="{ selected: selectedTrackId === result.track_id }"
        @click="highlightTrack(result.track_id)"
        style="cursor: pointer;"
      >
        <td>{{ result.pigeon_number }}</td>
        <td>{{ result.confidence_score.toFixed(2) }}</td>
      </tr>
    </table>
  </div>
</template>

<style scoped>
.results-table tr.selected {
  background: rgba(37, 99, 235, 0.08);
  border-left: 4px solid #2563eb;
}
</style>
```

---

## Common Pitfalls

### Memory Leaks from Missing Cleanup

**❌ Wrong:**
```vue
<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'

const mapContainer = ref(null)
let map = null

onMounted(() => {
  map = L.map(mapContainer.value)

  // Add layers, event listeners, etc.
  map.on('click', handleClick)

  // ❌ MEMORY LEAK: No cleanup!
})
</script>
```

**✅ Correct:**
```vue
<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const mapContainer = ref(null)
const map = shallowRef(null)
const layers = []

onMounted(() => {
  map.value = L.map(mapContainer.value)
  map.value.on('click', handleClick)
})

onUnmounted(() => {
  // Critical cleanup
  if (map.value) {
    map.value.off('click', handleClick)  // Remove event listeners

    // Remove all layers
    layers.forEach(layer => map.value.removeLayer(layer))

    // Destroy map instance
    map.value.remove()
    map.value = null
  }
})
</script>
```

### Race Conditions with Async Map Initialization

**❌ Wrong:**
```vue
<script setup>
import { ref, onMounted, watch } from 'vue'

const trackData = ref(null)
let map = null

onMounted(() => {
  map = L.map('map')
})

// ❌ Race condition: trackData might load before map is ready
watch(trackData, (data) => {
  addTrackToMap(data)  // ❌ map might be null
})
</script>
```

**✅ Correct:**
```vue
<script setup>
import { ref, shallowRef, onMounted, watch } from 'vue'

const trackData = ref(null)
const mapReady = ref(false)
const map = shallowRef(null)

onMounted(() => {
  map.value = L.map('map')
  mapReady.value = true
})

watch(
  [trackData, mapReady],
  ([data, ready]) => {
    if (ready && data && map.value) {
      addTrackToMap(data)  // ✅ Safe
    }
  }
)
</script>
```

### Forgetting to Call `invalidateSize()`

**Problem:** Map renders incorrectly when container is initially hidden or resizes

**❌ Wrong:**
```vue
<script setup>
const showMap = ref(false)

// Map container hidden initially, then shown
function toggleMap() {
  showMap.value = !showMap.value
  // ❌ Map will render with wrong dimensions!
}
</script>
```

**✅ Correct:**
```vue
<script setup>
import { nextTick } from 'vue'

const showMap = ref(false)

async function toggleMap() {
  showMap.value = !showMap.value

  if (showMap.value) {
    await nextTick()  // Wait for DOM update
    map.value?.invalidateSize()  // ✅ Recalculate map dimensions
  }
}
</script>
```

### Performance Issues with Too Many Individual Markers

**❌ Wrong:**
```vue
<script setup>
// 10,000+ individual markers = slow performance
const markers = ref(trackPoints.map(point =>
  L.marker([point.lat, point.lng])
))

onMounted(() => {
  markers.value.forEach(marker => marker.addTo(map))
})
</script>
```

**✅ Correct:**
```vue
<script setup>
import PruneClusterForLeaflet from 'prunecluster'

// Use clustering for large datasets
const cluster = new PruneClusterForLeaflet()

trackPoints.forEach(point => {
  const marker = new PruneCluster.Marker(point.lat, point.lng)
  cluster.RegisterMarker(marker)
})

map.addLayer(cluster)  // ✅ Fast even with 50k+ points
</script>
```

### Using `ref()` Instead of `shallowRef()` for Leaflet Instances

**❌ Wrong:**
```vue
<script setup>
import { ref } from 'vue'

// ❌ Vue will try to make Leaflet reactive (slow, buggy)
const map = ref(null)
const chart = ref(null)
</script>
```

**✅ Correct:**
```vue
<script setup>
import { shallowRef } from 'vue'

// ✅ Only reference is reactive, not internals
const map = shallowRef(null)
const chart = shallowRef(null)
</script>
```

---

## Project-Specific Solutions

### Current Implementation Analysis

From `frontend/index.html`, the current map implementation has several issues:

**Issue 1: Global map instance (line 878)**
```javascript
// ❌ Global mutable state
map: null
```

**Fix:**
```vue
<script setup>
// ✅ Component-scoped with shallowRef
const map = shallowRef(null)
</script>
```

**Issue 2: Manual resize handling without cleanup (lines 947, 1591-1608)**
```javascript
// ❌ Manual debounce, no cleanup
mounted() {
  window.addEventListener('resize', this.handleResize);
}

handleResize() {
  clearTimeout(this.resizeTimeout);
  this.resizeTimeout = setTimeout(() => {
    if (this.map) {
      this.map.invalidateSize();
    }
  }, 250);
}
```

**Fix:**
```vue
<script setup>
import { useResizeObserver, useDebounceFn } from '@vueuse/core'

const mapContainer = ref(null)
const map = shallowRef(null)

// ✅ Auto-cleanup with VueUse
useResizeObserver(mapContainer, useDebounceFn(() => {
  map.value?.invalidateSize()
}, 250))
</script>
```

**Issue 3: Polyline references stored in plain object (line 879)**
```javascript
// ❌ Not reactive, hard to track
trackPolylines: {}
```

**Fix:**
```vue
<script setup>
// ✅ Reactive ref for better tracking
const trackPolylines = shallowRef({})
</script>
```

**Issue 4: Missing `onUnmounted` cleanup**

Current code has no cleanup at all. Add this:

```vue
<script setup>
import { onUnmounted } from 'vue'

onUnmounted(() => {
  // Clear all polylines
  Object.values(trackPolylines.value).forEach(polylines => {
    polylines.forEach(p => {
      if (map.value) {
        map.value.removeLayer(p)
      }
    })
  })
  trackPolylines.value = {}

  // Remove map
  if (map.value) {
    map.value.off()  // Remove all event listeners
    map.value.remove()
    map.value = null
  }
})
</script>
```

### Multi-Track Rendering with Color Palette

Current implementation (lines 845-849):
```javascript
trackColors: [
  '#FF0000', '#0000FF', '#00FF00', '#FF00FF',
  '#00FFFF', '#FFA500', '#800080', '#008080',
  '#FFD700', '#DC143C'
]
```

**Enhancement:** Generate colors dynamically for unlimited tracks

```vue
<script setup>
function getTrackColor(index, total) {
  // Generate HSL color with evenly distributed hues
  const hue = (index * 360) / total
  return `hsl(${hue}, 70%, 50%)`
}

function renderTracks(tracks) {
  tracks.forEach((track, index) => {
    const color = getTrackColor(index, tracks.length)

    const polyline = L.polyline(track.coordinates, {
      color,
      weight: 4,
      opacity: 0.7
    }).addTo(map.value)

    trackPolylines.value[track.id] = polyline
  })
}
</script>
```

### Dynamic Marker Density Based on Zoom Level

**Problem:** Showing 50k markers at low zoom = slow; showing 10 markers at high zoom = not useful

**Solution:** Adjust marker filtering based on zoom level

```vue
<script setup>
import { watch } from 'vue'

const currentZoom = ref(13)
const allPoints = ref([])  // All 50k points
const visiblePoints = computed(() => {
  const zoom = currentZoom.value

  // At low zoom, show fewer points (every Nth point)
  let step = 1
  if (zoom < 10) step = 100       // Show 1% of points
  else if (zoom < 12) step = 10   // Show 10% of points
  else if (zoom < 14) step = 5    // Show 20% of points
  // At zoom 14+, show all points

  return allPoints.value.filter((_, i) => i % step === 0)
})

onMounted(() => {
  map.value = L.map('map').setView([25.033, 121.565], 13)

  // Watch zoom changes
  map.value.on('zoomend', () => {
    currentZoom.value = map.value.getZoom()
  })
})

// Re-render markers when visiblePoints changes
watch(visiblePoints, (points) => {
  // Clear and re-render (or use PruneCluster for automatic handling)
  markerLayer.value.clearLayers()

  points.forEach(point => {
    L.marker([point.lat, point.lng]).addTo(markerLayer.value)
  })
})
</script>
```

### Bi-Directional Linking: Table ↔ Map ↔ Chart

Complete implementation of synchronized selection:

```vue
<script setup>
import { ref, shallowRef, watch, onMounted } from 'vue'
import L from 'leaflet'
import Chart from 'chart.js/auto'

const map = shallowRef(null)
const altitudeChart = shallowRef(null)
const selectedTrackId = ref(null)
const results = ref([])
const trackPolylines = shallowRef({})

// Selection from any source updates all three views
function selectTrack(trackId) {
  if (selectedTrackId.value === trackId) {
    // Deselect
    selectedTrackId.value = null
  } else {
    // Select new track
    selectedTrackId.value = trackId
  }
}

// Watch selection and update all views
watch(selectedTrackId, async (trackId) => {
  // 1. Update map polylines
  Object.entries(trackPolylines.value).forEach(([id, polylines]) => {
    const isSelected = parseInt(id) === parseInt(trackId)

    polylines.forEach(p => {
      p.setStyle({
        opacity: isSelected ? 1.0 : 0.3,
        weight: isSelected ? 12 : 6,
        color: isSelected ? '#0000FF' : '#FF0000'
      })
    })
  })

  if (!trackId) {
    // 2. Clear chart
    altitudeChart.value.data.labels = []
    altitudeChart.value.data.datasets[0].data = []
    altitudeChart.value.update()
    return
  }

  // 3. Update chart
  const response = await fetch(`/api/tracks/${trackId}/detail?include_points=true`)
  const data = await response.json()
  const points = data.points || []

  altitudeChart.value.data.labels = points.map((_, i) => i + 1)
  altitudeChart.value.data.datasets[0].data = points.map(p => p.altitude)
  altitudeChart.value.update()

  // 4. Scroll table to selected row
  const row = document.querySelector(`tr[data-track-id="${trackId}"]`)
  row?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // 5. Center map on track
  if (points.length > 0) {
    const coords = points.map(p => [p.lat, p.lng])
    map.value.fitBounds(coords, { padding: [50, 50] })
  }
})

onMounted(() => {
  // Initialize map
  map.value = L.map('map').setView([25.033, 121.565], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

  // Initialize chart
  const ctx = document.getElementById('altitudeChart').getContext('2d')
  altitudeChart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Altitude (m)',
        data: [],
        borderColor: '#2196f3'
      }]
    }
  })
})
</script>

<template>
  <div class="dashboard">
    <!-- Map: Click polyline to select -->
    <div id="map" style="height: 600px"></div>

    <!-- Chart: Updates when track selected -->
    <div style="height: 300px; margin-top: 16px;">
      <canvas id="altitudeChart"></canvas>
    </div>

    <!-- Table: Click row to select, highlights selected -->
    <table class="results-table">
      <tr
        v-for="result in results"
        :key="result.track_id"
        :data-track-id="result.track_id"
        :class="{ selected: selectedTrackId === result.track_id }"
        @click="selectTrack(result.track_id)"
        style="cursor: pointer;"
      >
        <td>{{ result.pigeon_number }}</td>
        <td>{{ result.confidence_score.toFixed(2) }}</td>
      </tr>
    </table>
  </div>
</template>

<style scoped>
.results-table tr.selected {
  background: rgba(37, 99, 235, 0.08);
  border-left: 4px solid #2563eb;
}
</style>
```

---

## Summary

### Key Takeaways

1. **Use Direct Leaflet API** for complex applications requiring custom controls
2. **Always use `shallowRef`** for Leaflet/Chart.js instances (not `ref`)
3. **Memory leak prevention is CRITICAL** - always clean up in `onUnmounted`
4. **Use ResizeObserver** (via VueUse) instead of manual window resize listeners
5. **Use PruneCluster** for datasets with 50k+ markers (50x performance boost)
6. **Canvas renderer** for large numbers of paths (1000+)
7. **Virtual scrolling** for tables with 1000+ rows
8. **Responsive design** with viewport units, not fixed pixels
9. **Bi-directional linking** for synchronized map-chart-table interactions

### Migration Checklist for Current Project

- [ ] Replace global `map` variable with component-scoped `shallowRef`
- [ ] Add `onUnmounted` cleanup for map, polylines, and event listeners
- [ ] Replace manual resize handling with `useResizeObserver`
- [ ] Convert `trackPolylines` to `shallowRef` for better reactivity
- [ ] Implement PruneCluster if rendering 10k+ track points
- [ ] Add Canvas renderer for polyline rendering
- [ ] Use `nextTick()` before `invalidateSize()` when toggling map visibility
- [ ] Test memory usage with DevTools after multiple mount/unmount cycles

### GitHub References

- **vue-leaflet/vue-leaflet**: https://github.com/vue-leaflet/vue-leaflet
- **PruneCluster**: https://github.com/SINTEF-9012/PruneCluster
- **VueUse**: https://github.com/vueuse/vueuse
- **Leaflet**: https://github.com/Leaflet/Leaflet

---

**End of Document**
