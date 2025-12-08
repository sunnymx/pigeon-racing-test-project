# 選擇器參考指南

**快速參考**: [CLAUDE.md](../../CLAUDE.md)
**最後更新**: 2025-11-26

本文檔詳細說明測試中使用的 DOM 選擇器，包括最新更新和棄用警告。

---

## 首頁 UI 選擇器

| 用途 | 選擇器 | 說明 | 範例用法 |
|-----|-------|------|---------|
| **搜尋框** | `textbox[name="搜寻赛事"]` | 首頁賽事搜尋 | `page.getByRole('textbox', { name: '搜寻赛事' })` |
| **年份下拉選單** | `mat-select` | 年份篩選 | `page.locator('mat-select')` |
| **賽事卡片** | `mat-card` | 賽事列表項 | `page.locator('mat-card')` |
| **進入按鈕** | `button:has-text("進入")` | 進入賽事詳情 | `page.getByRole('button', { name: /進入\|进入/ })` |

⚠️ **等待策略**: 首頁搜尋框需等待賽事列表載入後才可用：
```typescript
// ✅ 正確方式：先等待頁面載入
await page.goto('/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('mat-card', { timeout: 10000 });
await page.getByRole('textbox', { name: '搜寻赛事' }).fill('2024');
```

---

## 軌跡視圖選擇器對照表

| 用途 | 選擇器 | 說明 | 範例用法 |
|-----|-------|------|---------|
| **軌跡標記點** | `.amap-icon > img` | codegen 確認，支援多顏色 | `page.locator('.amap-icon > img')` |
| **Canvas 圖層** | `canvas.amap-layer` | 2D 軌跡線渲染 | `page.locator('canvas.amap-layer')` |
| **地圖容器** | `.amap-container` | 2D 模式檢測 | `page.locator('.amap-container')` |
| **Timeline 按鈕** | `button:has(img[alt="timeline"])` | 靜態/動態切換 | `page.locator('button:has(img[alt="timeline"])')` |
| **3D 視角按鈕** | `button:has-text("視角1")` | 3D 模式檢測 | `page.getByRole('button', { name: /視角1/ })` |

---

## 🎮 播放控制選擇器 (2025-12-05)

### 2D 動態模式播放控制

| 用途 | 選擇器 | description 屬性 | 範例用法 |
|-----|-------|-----------------|---------|
| **播放按鈕** | `button:has-text("play_arrow")` | `播放` 或 `播放/暂停` | `page.getByRole('button').filter({ hasText: 'play_arrow' })` |
| **暫停按鈕** | `button:has-text("pause")` | `暫停` 或 `播放/暂停` | `page.getByRole('button').filter({ hasText: 'pause' })` |
| **進度滑桿** | `mat-slider` | - | `page.locator('mat-slider')` |

**檢測方式**:
```typescript
// ✅ 使用 innerText 檢測按鈕狀態
const playButton = page.getByRole('button').filter({ hasText: 'play_arrow' });
const pauseButton = page.getByRole('button').filter({ hasText: 'pause' });

// 判斷當前狀態
const isPlaying = await pauseButton.isVisible().catch(() => false);
const isPaused = await playButton.isVisible().catch(() => false);
```

### 3D 模式速度控制

| 用途 | 選擇器 | aria-label | 範例用法 |
|-----|-------|-----------|---------|
| **減速按鈕** | `button:has-text("fast_rewind")` | `減速` 或 `减速` | `page.getByRole('button').filter({ hasText: 'fast_rewind' })` |
| **加速按鈕** | `button:has-text("fast_forward")` | `加速` | `page.getByRole('button').filter({ hasText: 'fast_forward' })` |
| **播放/暫停** | `button:has-text("play_arrow")` | `播放` | `page.getByRole('button').filter({ hasText: 'play_arrow' })` |
| **速度顯示** | `span.speed-display` | - | `page.locator('span.speed-display')` |

**檢測方式**:
```typescript
// ✅ 使用 Material Icon 文字檢測
const speedDown = page.getByRole('button').filter({ hasText: 'fast_rewind' });
const speedUp = page.getByRole('button').filter({ hasText: 'fast_forward' });

// 驗證按鈕存在
await expect(speedDown).toBeVisible({ timeout: 5000 });
await expect(speedUp).toBeVisible({ timeout: 5000 });
```

⚠️ **注意**: 3D 速度控制按鈕僅在 3D 動態播放模式下可見。

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

### 2025-12-05
- **新增首頁 UI 選擇器**: 搜尋框、年份選單、賽事卡片、進入按鈕
- **新增播放控制選擇器**: 2D 動態模式播放/暫停按鈕
- **新增 3D 速度控制選擇器**: 減速/加速按鈕 (fast_rewind/fast_forward)
- **來源**: DevTools MCP 測試驗證

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
