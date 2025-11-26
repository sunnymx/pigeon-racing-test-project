# 選擇器參考指南

**快速參考**: [CLAUDE.md](../../CLAUDE.md)
**最後更新**: 2025-11-26

本文檔詳細說明測試中使用的 DOM 選擇器，包括最新更新和棄用警告。

---

## 選擇器用途對照表

| 用途 | 選擇器 | 說明 | 範例用法 |
|-----|-------|------|---------|
| **軌跡標記點** | `.amap-icon > img` | codegen 確認，支援多顏色 | `page.locator('.amap-icon > img')` |
| **Canvas 圖層** | `canvas.amap-layer` | 2D 軌跡線渲染 | `page.locator('canvas.amap-layer')` |
| **地圖容器** | `.amap-container` | 2D 模式檢測 | `page.locator('.amap-container')` |
| **Timeline 按鈕** | `button:has(img[alt="timeline"])` | 靜態/動態切換 | `page.locator('button:has(img[alt="timeline"])')` |
| **3D 視角按鈕** | `button:has-text("視角1")` | 3D 模式檢測 | `page.getByRole('button', { name: /視角1/ })` |

---

## ⚠️ 棄用選擇器警告 (2025-11-26)

以下選擇器**已失效**，請勿使用：

| 棄用選擇器 | 狀態 | 原因 | 替代方案 |
|-----------|------|------|---------|
| `[title*="2025-"]` | ❌ 失效 | DOM 結構變更 | `.amap-icon > img` |
| `[title*="2025-26-"]` | ❌ 失效 | 同上 | `.amap-icon > img` |
| `.amap-container img` | ❌ 失效 | AMap v2.0+ 改用 Canvas | `canvas.amap-layer` |
| `.amap-layer img` | ❌ 失效 | 同上 | `canvas.amap-layer` |
| `.amap-marker:has(img[src*="ff0000"])` | ❌ 失效 | 多顏色軌跡不適用 | `.amap-icon > img` |

---

## DOM 結構說明

### 高德地圖 (AMap) v2.0+ 標記點結構

```html
<div class="amap-container">
  <div class="amap-overlays">
    <!-- 軌跡標記點 DOM 結構 -->
    <div class="amap-marker">
      <div class="amap-icon">
        <img src="...">  <!-- ← 使用 .amap-icon > img 選擇器 -->
      </div>
    </div>
  </div>
</div>
```

### Canvas 渲染層

```html
<div class="amap-container">
  <!-- 軌跡線渲染層 -->
  <canvas class="amap-layer"></canvas>
</div>
```

---

## 選擇器使用範例

### 獲取軌跡標記點

```typescript
// ✅ 正確方式 (2025-11-26 更新)
const markers = page.locator('.amap-icon > img');
const count = await markers.count();
console.log(`找到 ${count} 個軌跡標記點`);

// ❌ 錯誤方式（已棄用）
// const markers = page.locator('[title*="2025-"]');
```

### 點擊軌跡標記點

```typescript
// ✅ 正確方式（使用 force: true 避免 canvas 遮擋）
await page.locator('.amap-icon > img').first().click({ force: true });

// ❌ 錯誤方式
// await page.locator('.amap-container').click({ position: { x: 600, y: 400 } });
```

### 偵測 2D 模式

```typescript
// ✅ 推薦方法 1: 檢測 2D 特有 UI 元素（timeline 按鈕）
const timelineButton = page.getByRole('button').filter({ hasText: 'timeline' });
const is2D = await timelineButton.isVisible();

// ✅ 推薦方法 2: 檢查地圖容器 + Canvas
const mapVisible = await page.locator('.amap-container').isVisible();
const canvas = await page.locator('canvas.amap-layer').count();

// ❌ 錯誤方式（已棄用）
// const tileCount = await page.locator('.amap-container img').count();
```

### 判斷靜態/動態模式

```typescript
// ✅ 正確方式：計算標記點數量
const markerCount = await page.locator('.amap-icon > img').count();

if (markerCount >= 15) {
  console.log('靜態模式 - 顯示完整軌跡');
} else if (markerCount < 5) {
  console.log('動態模式 - 播放動畫');
}
```

---

## 版本變更歷史

### 2025-11-26
- **軌跡標記點選擇器更新**: `[title*="2025-"]` → `.amap-icon > img`
- **原因**: DOM 結構變更，title 屬性不再可靠
- **來源**: Playwright codegen 確認

### 2025-11-24
- **地圖瓦片檢測棄用**: `.amap-container img` 不再有效
- **原因**: AMap v2.0+ 改用 Canvas 渲染
- **替代方案**: 使用 UI 元素檢測或 Canvas 存在性

---

## 相關文檔

- [Troubleshooting Guide](troubleshooting.md)
- [Known Issues Solutions](../test-plan/KNOWN_ISSUES_SOLUTIONS.md)
- [Helper Functions](../architecture/helper-functions.md)
