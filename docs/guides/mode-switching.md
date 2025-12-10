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

### 關鍵概念 ⚠️ **CORRECTED 2025-11-24**

**⚠️ CRITICAL**: 模式按鈕是**偏好設定開關**，而非當前狀態指示器！

```
重要更正：
❌ 錯誤理解：按鈕文字 = 當前模式
✅ 正確理解：按鈕文字 = 偏好設定（下次軌跡使用的模式）

按鈕行為：
- 按鈕顯示 "2D模式" 或 "3D模式" = 模式選擇器（可隨時切換）
- 按鈕狀態與當前已顯示的地圖**完全獨立**
- 切換按鈕不會影響當前已渲染的地圖

工作流程：
1. 在選擇鴿子前，設定按鈕到想要的模式（2D 或 3D）
2. 選擇鴿子
3. 點擊「查看軌跡」
4. 地圖將以按鈕所設定的模式渲染
```

### 視覺化說明

#### 場景 1: 設定為 3D 模式

```
┌────────────────────────────────┐
│ 名次&環號搜尋                    │
│                                │
│ ☐ 03-3662791                   │  ← 1. 先設定模式
│                                │
│ [  3D模式  ] [查看軌跡]         │  ← 2. 按鈕設為 "3D模式"
│      ↑                         │     （這是偏好設定，不是當前狀態）
│      └─ 這設定下次軌跡使用 3D    │
└────────────────────────────────┘

選擇鴿子 → 點擊「查看軌跡」後：
  ✓ 地圖以 3D 模式渲染（Cesium）
  ✓ 看到「視角1」「視角2」按鈕
  ✓ 看到 3D 播放控制

注意：此時按鈕可能仍顯示 "3D模式" 或已切換為其他值
      按鈕狀態與當前地圖無關！
```

#### 場景 2: 設定為 2D 模式

```
┌────────────────────────────────┐
│ 名次&環號搜尋                    │
│                                │
│ ☑ 03-3662791                   │  ← 1. 先設定模式
│                                │
│ [  2D模式  ] [查看軌跡]         │  ← 2. 按鈕設為 "2D模式"
│      ↑                         │     （這是偏好設定）
│      └─ 這設定下次軌跡使用 2D    │
└────────────────────────────────┘

選擇鴿子 → 點擊「查看軌跡」後：
  ✓ 地圖以 2D 模式渲染（AMap 高德地圖）
  ✓ 看到紅色虛線軌跡
  ✗ 沒有「視角1」「視角2」按鈕

注意：按鈕狀態可能已改變，但不影響當前地圖
```

---

## 為什麼容易誤解 ⚠️ **UPDATED 2025-11-24**

### 誤解來源

1. **UI 設計非常規**:
   - 按鈕顯示的文字看起來像"當前狀態"
   - 實際上是"偏好設定"（與當前地圖無關）
   - 這與常見的"狀態指示按鈕"設計相反

2. **按鈕與地圖狀態分離**:
   - 按鈕可以隨時切換，不影響已渲染的地圖
   - 只在**下次查看軌跡時**才生效
   - 無法通過按鈕判斷當前地圖是 2D 還是 3D

3. **初期文檔的錯誤**:
   - 早期文檔誤認為「按鈕文字 = 將進入的模式」
   - 實際上「按鈕文字 = 偏好設定」（與當前狀態完全獨立）
   - 於 2025-11-24 經實際驗證後更正

### 正確理解

```
❌ 錯誤理解 #1: Checkbox 決定模式
❌ 錯誤理解 #2: 按鈕文字 = 當前模式
❌ 錯誤理解 #3: 按鈕文字 = 點擊後將進入的模式

✅ 正確理解：
   - 按鈕 = 偏好設定（模式選擇器）
   - 按鈕狀態與當前地圖無關
   - 要檢測當前模式，必須檢查地圖類型：
     * 2D = AMap 容器 (.amap-container)
     * 3D = Cesium 控制按鈕（視角1/視角2）
```

### 檢測當前模式的正確方法

```typescript
// ✅ 正確：檢查地圖實際渲染的類型
async function getCurrentMode(page) {
  // 檢查 3D 特徵元素
  const view1Button = page.getByRole('button', { name: '視角1' });
  if (await view1Button.isVisible().catch(() => false)) {
    return '3D';
  }

  // 檢查 2D 特徵元素
  const mapContainer = page.locator('.amap-container');
  if (await mapContainer.isVisible().catch(() => false)) {
    return '2D';
  }

  return 'unknown';
}

// ❌ 錯誤：檢查按鈕文字（按鈕與當前狀態無關！）
async function getCurrentMode_WRONG(page) {
  const modeButton = page.getByRole('button', { name: /[23]D模式/ });
  const buttonText = await modeButton.textContent();
  // 這個方法完全不可靠！
}
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

### 🚨 關鍵：確保 2D 偏好被選中 (2025-12-10 新增)

在點擊「查看軌跡」前，必須確保 2D/3D 偏好按鈕選中正確的模式！

**問題背景**：
- 「查看軌跡」按鈕旁邊有 2D/3D 切換開關
- 如果是 3D 偏好（紅色標籤），點擊「查看軌跡」會進入 Cesium 3D 模式
- 3D 模式沒有 `.amap-icon` 標記點，導致 2D 測試失敗

**解決方案 - 檢查並設定 2D 偏好**：

```typescript
// 在點擊「查看軌跡」前，確保 2D 偏好被選中
async function ensure2DPreference(page: Page): Promise<void> {
  const toggle3D = page.getByRole('button', { name: '3D', exact: true });

  if (await toggle3D.isVisible().catch(() => false)) {
    // 檢查 3D 是否被選中
    const is3DSelected = await toggle3D.evaluate((el) =>
      el.classList.contains('mat-button-toggle-checked')
    ).catch(() => false);

    if (is3DSelected) {
      console.log('⚠️ 當前為 3D 偏好，切換到 2D...');
      const toggle2D = page.getByRole('button', { name: '2D', exact: true });
      await toggle2D.click();
      await page.waitForTimeout(300);
    }
  }
}

// 使用示例
await selectPigeon(page, 0);
await ensure2DPreference(page);  // ← 關鍵步驟！
await page.getByRole('button', { name: '查看軌跡' }).click();
```

**推薦方式**：使用 `reload2DTrajectory()` helper 函數，已內建此邏輯。

---

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

  // 方法 3: 檢查 AMap 容器可見性
  // ⚠️ 注意 (2025-11-26): .amap-container img 已棄用，改用容器可見性檢查
  const mapVisible = await page.locator('.amap-container').isVisible().catch(() => false);

  return switch3DVisible && noView1 && noView2 && mapVisible;
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
    // ⚠️ 已棄用: .amap-container img (AMap v2.0+ 改用 Canvas 渲染)
    // 建議改用: await page.locator('.amap-icon > img').count() 檢測軌跡標記
    const markerCount = await page.locator('.amap-icon > img').count();
    expect(markerCount).toBeGreaterThan(10);
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
