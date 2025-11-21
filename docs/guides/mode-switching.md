# 2D/3D 模式切換完整指南

**快速參考**: [CLAUDE.md](../../CLAUDE.md#critical-gotchas)
**架構背景**: [Test Framework](../architecture/test-framework.md#2d3d-mode-architecture)
**相關測試案例**: [TC-03-008](../test-plan/TEST_CASES.md#tc-03-008)

---

## 目錄

1. [理解模式選擇機制](#理解模式選擇機制)
2. [為什麼容易誤解](#為什麼容易誤解)
3. [互動式測試步驟](#互動式測試步驟)
4. [自動化測試實作](#自動化測試實作)
5. [模式驗證方法](#模式驗證方法)
6. [常見錯誤與解決](#常見錯誤與解決)
7. [完整測試案例](#完整測試案例)

---

## 理解模式選擇機制

### 關鍵概念

**⚠️ CRITICAL**: 按鈕的**顯示文字**（不是 checkbox 狀態）決定進入的模式

```
按鈕顯示 "3D" → 點擊「查看軌跡」→ 進入 3D 模式
按鈕顯示 "2D" → 點擊「查看軌跡」→ 進入 2D 模式
```

###視覺化說明

#### 狀態 1: 按鈕顯示 "3D"

```
┌────────────────────────────────┐
│ 名次&環號搜尋                    │
│                                │
│ ☐ 03-3662791                   │  ← 選擇鴿子
│                                │
│ [  3D  ] [查看軌跡]             │  ← 按鈕顯示 "3D"
│   ↑                            │
│   └─ 這個文字決定模式！          │
└────────────────────────────────┘

點擊「查看軌跡」後 → 進入 3D 模式
  ✓ 看到 Cesium 3D 地球
  ✓ 看到「視角1」「視角2」按鈕
  ✓ 看到 3D 播放控制
```

#### 狀態 2: 按鈕顯示 "2D"

```
┌────────────────────────────────┐
│ 名次&環號搜尋                    │
│                                │
│ ☑ 03-3662791                   │  ← 選擇鴿子
│                                │
│ [  2D  ] [查看軌跡]             │  ← 按鈕顯示 "2D"
│   ↑                            │
│   └─ 這個文字決定模式！          │
└────────────────────────────────┘

點擊「查看軌跡」後 → 進入 2D 模式
  ✓ 看到 AMap 平面地圖
  ✓ 看到紅色虛線軌跡
  ✓ 看到「view_in_ar 3D模式」切換按鈕
  ✗ 沒有「視角1」「視角2」按鈕
```

---

## 為什麼容易誤解

### 誤解來源

1. **直覺錯誤**:
   - 容易認為 checkbox 勾選 = 當前模式
   - 實際上按鈕文字 = 目標模式

2. **UI 設計不直觀**:
   - 按鈕文字指示"將要進入的模式"而非"當前模式"
   - 這種設計與常見 UI 模式相反

3. **初次測試的錯誤假設**:
   - TC-03-008 最初被誤解
   - 以為是 checkbox 狀態控制模式
   - 實際測試後才發現按鈕文字是關鍵

### 正確理解

```
❌ 錯誤: Checkbox 勾選狀態決定模式
✅ 正確: 按鈕顯示的文字決定模式

❌ 錯誤: "3D" 表示當前在 3D 模式
✅ 正確: "3D" 表示點擊後將進入 3D 模式
```

---

## 互動式測試步驟

### 使用 Playwright MCP 測試

#### 測試 1: 驗證 "3D" 按鈕 → 3D 模式

```typescript
// 1. 導航到網站並進入賽事
await page.goto('https://skyracing.com.cn/');
await page.getByRole('button', { name: '進入' }).first().click();

// 2. 檢查按鈕狀態（在選擇鴿子之前）
const modeButton = page.getByRole('button', { name: /2D|3D/ });
const buttonText = await modeButton.textContent();
console.log('按鈕顯示:', buttonText); // 應該看到 "3D" 或 "2D"

// 3. 如果按鈕顯示 "3D"，選擇鴿子並查看軌跡
if (buttonText.includes('3D')) {
  // 選擇第一隻鴿子
  await page.locator('input[type="checkbox"]').first().click();

  // 點擊「查看軌跡」
  await page.getByRole('button', { name: '查看軌跡' }).click();

  // 等待加載
  await page.waitForTimeout(3000);

  // 4. 驗證進入 3D 模式
  const view1Button = page.getByRole('button', { name: '視角1' });
  const view2Button = page.getByRole('button', { name: '視角2' });

  if (await view1Button.isVisible() && await view2Button.isVisible()) {
    console.log('✅ 成功進入 3D 模式');
  } else {
    console.log('❌ 未進入 3D 模式');
  }
}
```

#### 測試 2: 切換按鈕並驗證 "2D" → 2D 模式

```typescript
// 1. 先退出當前軌跡視圖
await page.getByRole('button', { name: '退出賽事' }).click();

// 2. 重新進入賽事
await page.getByRole('button', { name: '進入' }).first().click();

// 3. 點擊模式按鈕切換到 "2D" 狀態
await modeButton.click();
await page.waitForTimeout(500);

// 4. 確認按鈕現在顯示 "2D"
const newButtonText = await modeButton.textContent();
console.log('切換後按鈕顯示:', newButtonText);  // 應該是 "2D"

// 5. 選擇鴿子並查看軌跡
await page.locator('input[type="checkbox"]').first().click();
await page.getByRole('button', { name: '查看軌跡' }).click();
await page.waitForTimeout(3000);

// 6. 驗證進入 2D 模式
const switch3DButton = page.getByRole('button', { name: 'view_in_ar 3D模式' });
const view1Exists = await page.getByRole('button', { name: '視角1' }).count();

if (await switch3DButton.isVisible() && view1Exists === 0) {
  console.log('✅ 成功進入 2D 模式');
} else {
  console.log('❌ 未進入 2D 模式');
}
```

---

## 自動化測試實作

### Helper 函數: ensureModeByText()

```typescript
/**
 * 確保按鈕顯示指定的模式文字
 * @param page - Playwright Page 對象
 * @param targetMode - 目標模式 "2D" 或 "3D"
 */
async function ensureModeByText(
  page: Page,
  targetMode: '2D' | '3D'
): Promise<void> {
  const modeButton = page.getByRole('button', { name: /2D|3D/ });

  // 獲取當前按鈕文字
  const currentText = await modeButton.textContent();

  // 如果不匹配目標，點擊切換
  if (!currentText?.includes(targetMode)) {
    await modeButton.click();
    await page.waitForTimeout(500);

    // 驗證切換成功
    const newText = await modeButton.textContent();
    if (!newText?.includes(targetMode)) {
      throw new Error(`無法切換到 ${targetMode} 狀態`);
    }
  }
}
```

### 完整測試流程函數

```typescript
/**
 * 測試進入指定模式
 * @param page - Playwright Page 對象
 * @param mode - 要測試的模式 "2D" 或 "3D"
 */
async function testModeEntry(
  page: Page,
  mode: '2D' | '3D'
): Promise<boolean> {
  // 1. 導航到賽事
  await page.goto('https://skyracing.com.cn/');
  await page.waitForLoadState('networkidle');

  // 2. 進入第一個賽事
  await page.getByRole('button', { name: '進入' }).first().click();
  await page.waitForTimeout(2000);

  // 3. 確保按鈕顯示目標模式
  await ensureModeByText(page, mode);

  // 4. 選擇第一隻鴿子
  await page.locator('input[type="checkbox"]').first().click();

  // 5. 點擊查看軌跡
  await page.getByRole('button', { name: '查看軌跡' }).click();
  await page.waitForTimeout(3000);

  // 6. 驗證模式
  if (mode === '3D') {
    const view1 = await page.getByRole('button', { name: '視角1' }).isVisible();
    const view2 = await page.getByRole('button', { name: '視角2' }).isVisible();
    return view1 && view2;
  } else {
    const switch3D = await page.getByRole('button', { name: 'view_in_ar 3D模式' }).isVisible();
    const noView1 = await page.getByRole('button', { name: '視角1' }).count() === 0;
    return switch3D && noView1;
  }
}
```

---

## 模式驗證方法

### 3D 模式驗證

```typescript
async function verify3DMode(page: Page): Promise<boolean> {
  // 方法 1: DOM 驗證 - 檢查特徵元素
  const view1Visible = await page.getByRole('button', { name: '視角1' }).isVisible();
  const view2Visible = await page.getByRole('button', { name: '視角2' }).isVisible();

  // 方法 2: JavaScript 驗證 - 檢查 Cesium 引擎
  const cesiumLoaded = await page.evaluate(() => {
    return typeof window.Cesium !== 'undefined';
  });

  // 方法 3: 元素計數
  const playbackControls = await page.locator('button').filter({
    hasText: /fast_forward|play_arrow|fast_rewind/
  }).count();

  return view1Visible && view2Visible && cesiumLoaded && playbackControls >= 3;
}
```

### 2D 模式驗證

```typescript
async function verify2DMode(page: Page): Promise<boolean> {
  // 方法 1: DOM 驗證 - 檢查 3D 切換按鈕
  const switch3DVisible = await page.getByRole('button', {
    name: 'view_in_ar 3D模式'
  }).isVisible();

  // 方法 2: 確認沒有 3D 特徵元素
  const noView1 = await page.getByRole('button', { name: '視角1' }).count() === 0;
  const noView2 = await page.getByRole('button', { name: '視角2' }).count() === 0;

  // 方法 3: 檢查 AMap 瓦片
  const mapTiles = await page.locator('.amap-container img').count();

  return switch3DVisible && noView1 && noView2 && mapTiles > 10;
}
```

---

## 常見錯誤與解決

### 錯誤 1: 使用 checkbox 狀態判斷模式

❌ **錯誤代碼**:
```typescript
// 錯誤: 檢查 checkbox 是否勾選
const checkbox = page.getByRole('checkbox');
const isChecked = await checkbox.isChecked();
if (isChecked) {
  // 假設會進入 3D 模式 - 錯誤！
}
```

✅ **正確代碼**:
```typescript
// 正確: 檢查按鈕文字
const modeButton = page.getByRole('button', { name: /2D|3D/ });
const buttonText = await modeButton.textContent();
if (buttonText?.includes('3D')) {
  // 確定會進入 3D 模式
}
```

### 錯誤 2: 假設按鈕文字表示當前模式

❌ **錯誤理解**:
```
按鈕顯示 "3D" → 當前在 3D 模式 (錯誤！)
```

✅ **正確理解**:
```
按鈕顯示 "3D" → 點擊後將進入 3D 模式
```

### 錯誤 3: 沒有等待模式完全加載

❌ **錯誤代碼**:
```typescript
await page.getByRole('button', { name: '查看軌跡' }).click();
// 立即驗證 - 可能失敗！
const view1 = await page.getByRole('button', { name: '視角1' }).isVisible();
```

✅ **正確代碼**:
```typescript
await page.getByRole('button', { name: '查看軌跡' }).click();
// 等待加載
await page.waitForTimeout(2000-3000);
// 或使用特定元素等待
await page.waitForSelector('button:has-text("視角1")', { timeout: 5000 });
const view1 = await page.getByRole('button', { name: '視角1' }).isVisible();
```

---

## 完整測試案例

### TC-03-008 實作範例

基於今天 (2025-11-18) 驗證的測試案例：

```typescript
import { test, expect } from '@playwright/test';

test.describe('2D/3D 模式選擇測試', () => {

  test('TC-03-008-1: 按鈕顯示 "3D" 進入 3D 模式', async ({ page }) => {
    // 1. 導航並進入賽事
    await page.goto('https://skyracing.com.cn/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '進入' }).first().click();
    await page.waitForTimeout(2000);

    // 2. 檢查並確保按鈕顯示 "3D"
    const modeButton = page.getByRole('button', { name: /2D|3D/ });
    const buttonText = await modeButton.textContent();

    if (!buttonText?.includes('3D')) {
      await modeButton.click();
      await page.waitForTimeout(500);
    }

    // 3. 選擇鴿子並查看軌跡
    await page.locator('input[type="checkbox"]').first().click();
    await page.getByRole('button', { name: '查看軌跡' }).click();
    await page.waitForTimeout(3000);

    // 4. 驗證進入 3D 模式
    await expect(page.getByRole('button', { name: '視角1' })).toBeVisible();
    await expect(page.getByRole('button', { name: '視角2' })).toBeVisible();

    // 5. 驗證 Cesium 引擎加載
    const cesiumLoaded = await page.evaluate(() =>
      typeof window.Cesium !== 'undefined'
    );
    expect(cesiumLoaded).toBe(true);
  });

  test('TC-03-008-2: 按鈕顯示 "2D" 進入 2D 模式', async ({ page }) => {
    // 1. 導航並進入賽事
    await page.goto('https://skyracing.com.cn/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '進入' }).first().click();
    await page.waitForTimeout(2000);

    // 2. 確保按鈕顯示 "2D"
    const modeButton = page.getByRole('button', { name: /2D|3D/ });
    let buttonText = await modeButton.textContent();

    if (!buttonText?.includes('2D')) {
      await modeButton.click();
      await page.waitForTimeout(500);
    }

    // 3. 選擇鴿子並查看軌跡
    await page.locator('input[type="checkbox"]').first().click();
    await page.getByRole('button', { name: '查看軌跡' }).click();
    await page.waitForTimeout(3000);

    // 4. 驗證進入 2D 模式
    await expect(page.getByRole('button', {
      name: 'view_in_ar 3D模式'
    })).toBeVisible();

    // 5. 驗證沒有 3D 控制
    const view1Count = await page.getByRole('button', { name: '視角1' }).count();
    expect(view1Count).toBe(0);

    // 6. 驗證 AMap 瓦片加載
    const tileCount = await page.locator('.amap-container img').count();
    expect(tileCount).toBeGreaterThan(10);
  });
});
```

---

## 總結

### 關鍵要點

1. ✅ **按鈕文字決定模式**，不是 checkbox 狀態
2. ✅ "3D" on button → 進入 3D 模式
3. ✅ "2D" on button → 進入 2D 模式
4. ✅ 模式切換需要等待 2-3 秒
5. ✅ 使用特徵元素驗證模式（視角1/2 vs 3D模式切換按鈕）

### 最佳實踐

- 總是在選擇鴿子**之前**檢查按鈕文字
- 點擊「查看軌跡」後等待足夠時間
- 使用多重驗證（DOM + JavaScript + 元素計數）
- 截圖記錄測試過程以便調試

### 相關資源

- **測試案例**: [TC-03-008](../test-plan/TEST_CASES.md#tc-03-008)
- **架構文檔**: [Test Framework](../architecture/test-framework.md#2d3d-mode-architecture)
- **已知問題**: [Troubleshooting Guide](troubleshooting.md)

---

**最後更新**: 2025-11-18
**測試驗證**: ✅ 已在 Playwright MCP 中完整驗證
**狀態**: 生產就緒
