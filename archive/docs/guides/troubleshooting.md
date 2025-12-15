# 問題排解指南

**快速參考**: [CLAUDE.md](../../CLAUDE.md#critical-gotchas)
**詳細文檔**: [Known Issues Solutions](../test-plan/KNOWN_ISSUES_SOLUTIONS.md)

本指南提供 MVP 測試發現的 5 個關鍵問題的快速排解方法。

---

## 問題 #1: 2D 軌跡首次加載失敗 (HIGH)

### 症狀
- 首次查看軌跡時，軌跡數據未完全加載
- 控制台錯誤: `ERROR Error: pigeon.gpx2d undefined`
- AMap 顯示空白或不完整的紅線
- 軌跡標記可能缺失

### 快速解決
**唯一有效方法**: 重新加載軌跡
```typescript
// 重新執行「選擇鴿子 → 查看軌跡」流程

// 0. ⚠️ 確保 2D 偏好被選中（關鍵！否則會進入 3D 模式）
const toggle3D = page.getByRole('button', { name: '3D', exact: true });
if (await toggle3D.isVisible()) {
  const is3DSelected = await toggle3D.evaluate((el) =>
    el.classList.contains('mat-button-toggle-checked')
  );
  if (is3DSelected) {
    await page.getByRole('button', { name: '2D', exact: true }).click();
  }
}

// 1. 返回鴿子列表（使用 menu 按鈕）
await page.getByRole('button').filter({ hasText: 'menu' }).first().click({ force: true });

// 2. 取消之前的選擇
await page.locator('input[type="checkbox"]:checked').first().click();

// 3. 重新選擇並查看軌跡
await page.locator('input[type="checkbox"]').first().click();
await page.getByRole('button', { name: '查看軌跡' }).click();
await page.waitForTimeout(3000);
```

💡 **推薦**: 使用 `reload2DTrajectory()` helper 函數，已內建所有修復邏輯。

⚠️ **注意**: 3D→2D 切換或靜態/動態切換**無法**解決此問題，必須回到軌跡列表重新選取鴿子。

📖 完整方案：[Known Issues #1](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-1-2d軌跡初次加載失敗)

---

## 問題 #2: 靜態/動態模式混淆 (MEDIUM)

### 症狀
- 不確定當前是靜態還是動態播放模式
- 2D 有兩種模式容易混淆

### 快速辨別
```typescript
// 計算可見標記點
// ⚠️ 選擇器更新 (2025-11-26): 使用 .amap-icon > img
const markers = await page.locator('.amap-icon > img').count();

if (markers >= 15) {
  console.log('靜態模式 - 顯示完整軌跡');
} else if (markers < 5) {
  console.log('動態模式 - 播放動畫');
}
```

📖 完整說明：[Known Issues #2](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#problem-2)

---

## 問題 #3: 軌跡點點擊無響應 (MEDIUM)

### 症狀
- 直接點擊軌跡點無反應
- Canvas 遮擋問題

### 快速解決
使用 DOM 結構定位：
```typescript
// ⚠️ 選擇器更新 (2025-11-26): 使用 .amap-icon > img
await page.locator('.amap-icon > img').first().click({ force: true });
```

📖 完整方案：[Known Issues #3](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#problem-3)

---

## 問題 #4: 數據加載時序問題 (MEDIUM)

### 症狀
- 軌跡數據未立即加載
- 模式切換後數據缺失

### 快速解決
增加等待時間：
```typescript
// 模式切換後等待
await page.waitForTimeout(2000-3000);

// 或等待特定元素
// ⚠️ 選擇器更新 (2025-11-26): 使用 .amap-icon > img
await page.waitForSelector('.amap-icon > img', { timeout: 5000 });
```

📖 完整策略：[Wait Strategies](testing-strategies.md#wait-strategies)

---

## 問題 #5: page.goto networkidle 超時 (HIGH)

### 症狀
- `TimeoutError: page.goto: Timeout 30000ms exceeded`
- 錯誤顯示 `waiting until "networkidle"`
- 頁面實際上已載入完成，但測試仍超時

### 根本原因
網站首頁右側地圖持續載入瓦片，導致 `networkidle` 永遠無法達到。

### 快速解決
使用 `domcontentloaded` 替代 `networkidle`：
```typescript
// ❌ 錯誤：可能因地圖瓦片持續載入導致超時
await page.goto('/', { waitUntil: 'networkidle' });

// ✅ 正確：使用 domcontentloaded + 元素等待
await page.goto('/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('mat-card', { timeout: 10000 });
```

### 影響檔案
- `tests/helpers/navigation.ts` - `enterRace()` 函數
- `tests/helpers/trajectory-reload.ts` - 重載軌跡邏輯

📖 **解決方案已實施**: 2025-11-26

---

## 故障排除檢查清單

遇到測試失敗時：

- [ ] 確認使用正確的模式選擇方法（按鈕文字）
- [ ] 檢查是否等待足夠時間（2-3秒）
- [ ] 驗證網路連接穩定
- [ ] 檢查 API 請求是否成功
- [ ] 查看瀏覽器控制台錯誤
- [ ] 參考已知問題解決方案
- [ ] **確認未使用已棄用的選擇器**（見下方）

---

## ⚠️ 棄用選擇器警告 (2025-11-26)

以下選擇器**已失效**，請勿使用：

| 棄用選擇器 | 原因 | 替代方案 |
|-----------|------|---------|
| `.amap-container img` | AMap v2.0+ 改用 Canvas 渲染 | `canvas.amap-layer` 或 UI 元素檢測 |
| `.amap-layer img` | 同上 | `canvas.amap-layer` |
| `[title*="2025-"]` | 軌跡標記 DOM 結構變更 | `.amap-icon > img`（codegen 確認） |
| `[title*="2025-26-"]` | 同上 | `.amap-icon > img` |

**推薦的 2D 模式檢測方法**：
```typescript
// 方法1: 檢測 2D 特有 UI 元素
const timelineButton = page.getByRole('button').filter({ hasText: 'timeline' });
await timelineButton.waitFor({ state: 'visible' });

// 方法2: 檢測 3D 元素消失
const view1Button = page.getByRole('button', { name: /[视視]角1/ });
await view1Button.waitFor({ state: 'hidden' });
```

---

**完整文檔**: [Known Issues Solutions](../test-plan/KNOWN_ISSUES_SOLUTIONS.md)
**最後更新**: 2025-11-26
