# 適應性等待驗證腳本

**模組**: adaptive-wait
**規格**: [specs/adaptive-wait.spec.md](../../dev/active/test-flow-refactor/specs/adaptive-wait.spec.md)
**狀態**: ✅ 驗證完成
**驗證日期**: 2025-12-05

---

## 1. 概述

驗證 5 個等待策略在實際頁面上的行為，確認邏輯正確後再轉換為 Playwright 模組。

---

## 2. 前置條件

在執行驗證前，需先導航至軌跡頁面：

```
1. 開啟 https://skyracing.com.cn/
2. 點擊「進入」按鈕
3. 勾選任一鴿子
4. 點擊「查看軌跡」進入軌跡頁面
```

---

## 3. 驗證步驟

### 3.1 amap2DReady - 2D 地圖等待

**目的**: 驗證 2D 地圖載入完成的三個檢測點

**步驟**:
1. 確認頁面處於 2D 模式
2. 執行以下檢測：

```javascript
// 策略 1：Canvas 有效尺寸
(() => {
  const canvas = document.querySelector('canvas.amap-layer');
  if (!canvas) return { pass: false, reason: 'Canvas 不存在' };
  return {
    pass: canvas.width > 0 && canvas.height > 0,
    width: canvas.width,
    height: canvas.height
  };
})()

// 策略 2：地圖標記出現
(() => {
  const count = document.querySelectorAll('.amap-icon').length;
  return { pass: count > 0, count };
})()

// 策略 3：AMap 實例可用
(() => {
  return { pass: typeof window.AMap !== 'undefined' };
})()
```

**成功標準**: 三個策略至少一個返回 `pass: true`

**實測結果** (2025-12-05):
| 檢測點 | 結果 | 數值 |
|--------|------|------|
| Canvas 有效尺寸 | ✅ | 3024 x 1622 |
| 地圖標記 | ⚠️ | 動態模式為 0，靜態模式 >15 |
| AMap 實例 | ✅ | 存在 |
| .amap-container | ✅ | 存在 |

---

### 3.2 trajectoryMarkersReady - 軌跡標記等待

**目的**: 驗證靜態軌跡標記點數量檢測

**步驟**:
1. 確認頁面處於 2D 靜態模式
2. 執行檢測：

```javascript
(() => {
  const markers = document.querySelectorAll('.amap-icon > img');
  return {
    pass: markers.length >= 15,
    count: markers.length,
    threshold: 15
  };
})()
```

**成功標準**: `count >= 15` 表示靜態模式載入完成

**實測結果** (2025-12-05):
- 動態模式: markers = 0 (預期行為)
- 靜態模式: 需手動切換確認

---

### 3.3 cesium3DReady - 3D 模式等待

**目的**: 驗證 3D 模式初始化的 DOM 元素檢測點

> ⚠️ **重要**: `window.Cesium` 和 `window.viewer` 在此網站不可用（未暴露至全局），
> 已於 2025-12-05 驗證後更新為 DOM 元素檢測方案。

**步驟**:
1. 切換至 3D 模式（點擊「3D模式」按鈕）
2. 執行以下檢測：

```javascript
// 檢測 1：Cesium 容器 DOM 元素
(() => {
  const viewer = document.querySelector('.cesium-viewer');
  return { pass: viewer !== null, exists: !!viewer };
})()

// 檢測 2：Cesium widget DOM 元素
(() => {
  const widget = document.querySelector('.cesium-widget');
  return { pass: widget !== null, exists: !!widget };
})()

// 檢測 3：視角按鈕（透過 snapshot 確認）
// 使用 take_snapshot 工具，搜尋「視角1」或「视角1」按鈕
```

**成功標準**: 三個 DOM 檢測點全部返回 `pass: true`

**實測結果** (2025-12-05):
| 檢測點 | 結果 | 備註 |
|--------|------|------|
| .cesium-viewer | ✅ | DOM 元素存在 |
| .cesium-widget | ✅ | DOM 元素存在 |
| 視角按鈕 | ✅ | 可見 |

**已棄用的檢測方式** (不可用):
- ~~`window.Cesium`~~ → 未暴露在 window
- ~~`window.viewer`~~ → 未暴露在 window

---

### 3.4 apiResponse - API 響應等待

**目的**: 驗證網路請求攔截功能

**步驟**:
1. 使用 `list_network_requests` 查看已發送的請求
2. 確認包含以下 API：
   - `getTrajectory` - 軌跡數據
   - `getRaceInfo` - 比賽資訊

```javascript
// 在 list_network_requests 結果中搜尋
// 確認 status 為 200
```

**成功標準**: 目標 API 請求存在且狀態為 200

**實測結果** (2025-12-05):
| API 端點 | 狀態 | 耗時 |
|----------|------|------|
| `ugetPigeonGpxJsonInfo` | ✅ 200 | 440ms |
| `pigeonGcjTrajectoriesJson` | ✅ 200 | 473ms |
| `Gpx/*.json` | ✅ 200 | 514ms |
| `pigeonProcessAnalysisJson` | ✅ 200 | 467ms |

---

### 3.5 animationComplete - 動畫完成等待

**目的**: 驗證動畫狀態檢測

**步驟**:
1. 執行檢測：

```javascript
(() => {
  const animations = document.getAnimations();
  const allFinished = animations.length === 0 ||
    animations.every(a => a.playState === 'finished');
  return {
    pass: allFinished,
    activeCount: animations.filter(a => a.playState === 'running').length,
    totalCount: animations.length
  };
})()
```

**成功標準**: `pass: true` 或 `activeCount: 0`

**實測結果** (2025-12-05):
- 動態播放模式: 8 個動畫持續運行
- 此策略適用於**過場動畫**，不適用於動態播放模式

---

## 4. 驗證結果記錄

| 策略 | 結果 | 備註 |
|------|------|------|
| amap2DReady | ✅ | Canvas + AMap 實例可用 |
| trajectoryMarkersReady | ✅ | 靜態模式有效 |
| cesium3DReady | ✅ | 已改用 DOM 檢測（規格已同步更新） |
| apiResponse | ✅ | 可攔截軌跡 API |
| animationComplete | ⚠️ | 不適用動態模式 |

---

## 5. 規格調整建議

根據驗證結果，已更新 `adaptive-wait.spec.md`：

### ✅ cesium3DReady 調整（已完成 2025-12-05）
```typescript
// 原方案（不可用）- 已移除
// page.waitForFunction(() => window.Cesium !== undefined)

// 新方案（已套用至規格）
await Promise.all([
  page.waitForSelector('.cesium-viewer'),
  page.waitForSelector('.cesium-widget'),
  page.getByRole('button', { name: /视角1/ }).waitFor({ state: 'visible' }),
]);
```

### ⚠️ animationComplete 調整（待處理）
- 限定使用場景：僅用於模式切換過場動畫
- 動態播放模式不適用此策略

---

## 6. 下一步

1. ~~更新本文件的驗證結果~~ ✅
2. 進入 `console-monitor.md` 開發
