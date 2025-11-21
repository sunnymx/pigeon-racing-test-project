# 測試策略指南

**快速參考**: [CLAUDE.md](../../CLAUDE.md)
**架構背景**: [Test Framework](../architecture/test-framework.md)

---

## 三重驗證策略

### Layer 1: DOM 驗證
檢查元素存在性、可見性、文字內容

```typescript
// 檢查按鈕可見
await expect(page.getByRole('button', { name: '視角1' })).toBeVisible();

// 檢查文字內容
await expect(page.locator('.trajectory-info')).toContainText('平均速度');
```

### Layer 2: Canvas 驗證
截圖對比，驗證視覺輸出

```typescript
const canvas = page.locator('canvas.amap-layer');
await expect(canvas).toHaveScreenshot('2d-trajectory-baseline.png', {
  maxDiffPixels: 100
});
```

### Layer 3: Network 驗證
監控 API 請求和響應

```typescript
const response = await page.waitForResponse(/ugetPigeonAllJsonInfo/);
const data = await response.json();
expect(data.gpx3d).toBeDefined();
```

---

## 等待策略

### 基礎等待
```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000-3000);
```

### 地圖瓦片等待
```typescript
const tileCount = await page.locator('.amap-container img').count();
expect(tileCount).toBeGreaterThan(50);
```

### Cesium 3D 等待
```typescript
await page.waitForFunction(() => window.Cesium !== undefined);
await page.waitForFunction(() => window.viewer?.scene.globe.tilesLoaded);
```

---

## 數據驗證

### 驗證規則
```typescript
const RULES = {
  avgSpeed: { min: 800, max: 2000 },        // m/Min
  maxSpeed: { min: 1000, max: 2500 },
  avgAltitude: { min: 0, max: 3000 },       // meters
  maxAltitude: { min: 0, max: 5000 },
  actualDistance: { min: 1, max: 1000 },    // km
  straightDistance: { min: 1, max: 800 }
};
```

### 異常檢測
```typescript
function detectAnomaly(data) {
  if (data.actual_distance > 1000) {
    return `異常距離: ${data.actual_distance} km`;
  }
  if (data.actual_speed > 10000) {
    return `異常速度: ${data.actual_speed} m/Min`;
  }
  return null;
}
```

---

**最後更新**: 2025-11-18
