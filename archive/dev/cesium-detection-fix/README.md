# Cesium 初始化偵測修復計畫

## 問題摘要

**測試案例**：TC-04-001: Cesium 引擎應該正確初始化
**位置**：`tests/e2e/tc-04-001-3d-mode.spec.ts:81-113`
**狀態**：失敗

## 根本原因分析

測試檢查 `window.Cesium` 和 `window.viewer` 全域變數，但網站**未暴露這些變數**。

### 實際暴露的全域變數

透過 DOM 分析發現網站有暴露：

```javascript
window.CESIUM_VERSION  // Cesium 版本號
window.CESIUM_BASE_URL // Cesium 資源路徑
```

### DOM 特徵

| 特徵 | 值 |
|------|-----|
| `cesium` class 元素數量 | 159 個 |
| Timeline canvas class | `cesium-timeline-tracks` |
| Canvas 總數 | 5 個 |

## 修改計畫

### 檔案

`tests/e2e/tc-04-001-3d-mode.spec.ts`

### 修改位置

第 92-110 行

### 原始代碼

```typescript
const cesiumDetails = await page.evaluate(() => {
  const cesium = (window as any).Cesium;
  const viewer = (window as any).viewer;

  return {
    hasCesium: typeof cesium !== 'undefined',
    hasViewer: typeof viewer !== 'undefined',
    hasScene: viewer && typeof viewer.scene !== 'undefined',
    hasGlobe: viewer && viewer.scene && typeof viewer.scene.globe !== 'undefined',
    tilesLoaded: viewer?.scene?.globe?.tilesLoaded || false,
  };
});

expect(cesiumDetails.hasCesium).toBe(true);
expect(cesiumDetails.hasViewer).toBe(true);
expect(cesiumDetails.hasScene).toBe(true);
expect(cesiumDetails.hasGlobe).toBe(true);
```

### 修改後代碼

```typescript
const cesiumDetails = await page.evaluate(() => {
  return {
    // Cesium 全域變數（網站有暴露這兩個）
    hasCesiumVersion: typeof (window as any).CESIUM_VERSION !== 'undefined',
    hasCesiumBaseUrl: typeof (window as any).CESIUM_BASE_URL !== 'undefined',
    cesiumVersion: (window as any).CESIUM_VERSION || null,
    // DOM 特徵
    cesiumWidgetCount: document.querySelectorAll('[class*="cesium"]').length,
    hasTimelineCanvas: document.querySelector('canvas.cesium-timeline-tracks') !== null,
  };
});

console.log('Cesium 初始化詳情：', cesiumDetails);

expect(cesiumDetails.hasCesiumVersion).toBe(true);
expect(cesiumDetails.hasCesiumBaseUrl).toBe(true);
expect(cesiumDetails.cesiumWidgetCount).toBeGreaterThan(0);
```

## 預期結果

- 測試通過
- 使用更可靠的技術特徵偵測 Cesium 初始化狀態

## 影響範圍

僅影響 `tc-04-001-3d-mode.spec.ts` 中的單一測試案例。

## 驗證步驟

1. 執行修改
2. 運行 `npm run test:p0`
3. 確認 "Cesium 引擎應該正確初始化" 測試通過
