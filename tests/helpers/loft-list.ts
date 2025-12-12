/**
 * loft-list.ts - 鴿舍列表 Tab 相關 helper 函數
 *
 * 支援記錄點 #08 測試：鴿舍列表 Tab
 * 測試項目：Tab 切換、鴿舍選擇器、鴿舍切換、舍內搜尋、選擇查看
 */

import { Page } from '@playwright/test';

// ============================================================================
// 常量定義
// ============================================================================

const QUICK_WAIT = 500;
const IS_CI = !!process.env.CI;
const LOAD_TIMEOUT = IS_CI ? 30000 : 15000;

// ============================================================================
// Tab 切換
// ============================================================================

/**
 * 切換到鴿舍列表 Tab
 *
 * @param page - Playwright Page 物件
 * @returns Tab 是否成功啟用
 */
export async function switchToLoftListTab(page: Page): Promise<boolean> {
  // 支援簡繁體：鴿/鸽 舍 列表
  const loftTab = page.getByRole('tab', { name: /鴿舍列表|鸽舍列表/ });

  if (!(await loftTab.isVisible().catch(() => false))) {
    return false;
  }

  await loftTab.click();
  await page.waitForTimeout(1000);

  // 驗證 Tab 已啟用（aria-selected="true"）
  const isSelected = await loftTab.getAttribute('aria-selected');
  return isSelected === 'true';
}

/**
 * 檢查鴿舍列表 Tab 是否處於啟用狀態
 */
export async function isLoftListTabActive(page: Page): Promise<boolean> {
  const loftTab = page.getByRole('tab', { name: /鴿舍列表|鸽舍列表/ });

  if (!(await loftTab.isVisible().catch(() => false))) {
    return false;
  }

  const isSelected = await loftTab.getAttribute('aria-selected');
  return isSelected === 'true';
}

// ============================================================================
// 鴿舍選擇器操作
// ============================================================================

/**
 * 取得鴿舍選擇器（combobox）
 */
export function getLoftSelector(page: Page) {
  return page.getByRole('combobox');
}

/**
 * 取得鴿舍選擇器的選項數量
 *
 * 注意：這是原生 HTML select 元素，選項直接在 DOM 中
 */
export async function getLoftSelectorOptionsCount(page: Page): Promise<number> {
  const combobox = getLoftSelector(page);

  if (!(await combobox.isVisible().catch(() => false))) {
    return 0;
  }

  // 原生 select 的選項直接在 DOM 中，不需要點擊
  // 排除 disabled 的 placeholder 選項
  const options = combobox.locator('option:not([disabled])');
  return await options.count();
}

/**
 * 取得當前選中的鴿舍名稱
 */
export async function getCurrentLoftName(page: Page): Promise<string> {
  const combobox = getLoftSelector(page);

  if (!(await combobox.isVisible().catch(() => false))) {
    return '';
  }

  // 嘗試多種選擇器取得當前值
  // 1. mat-select-value-text（Angular Material）
  const valueText = page.locator('.mat-mdc-select-value-text, .mat-select-value-text');
  if (await valueText.isVisible().catch(() => false)) {
    return ((await valueText.textContent()) || '').trim();
  }

  // 2. 直接從 combobox 取得文字
  const comboboxText = (await combobox.textContent()) || '';
  return comboboxText.trim();
}

/**
 * 選擇指定索引的鴿舍
 *
 * @param page - Playwright Page 物件
 * @param index - 鴿舍索引（0-based，排除 disabled placeholder）
 * @returns 選擇的鴿舍 ID
 */
export async function selectLoftByIndex(
  page: Page,
  index: number
): Promise<string> {
  const combobox = getLoftSelector(page);

  if (!(await combobox.isVisible().catch(() => false))) {
    throw new Error('找不到鴿舍選擇器');
  }

  // 取得非 disabled 的選項
  const options = combobox.locator('option:not([disabled])');
  const count = await options.count();

  if (count === 0) {
    throw new Error('鴿舍選擇器沒有可用選項');
  }

  if (index >= count) {
    throw new Error(`索引 ${index} 超出範圍（共 ${count} 個選項）`);
  }

  // 取得選項值
  const optionValue = await options.nth(index).getAttribute('value') ||
                      await options.nth(index).textContent() || '';

  // 使用 selectOption 選擇（原生 select 元素）
  await combobox.selectOption({ index: index + 1 }); // +1 因為 index 0 是 disabled placeholder

  // 等待列表更新
  await page.waitForTimeout(1000);

  return optionValue.trim();
}

/**
 * 選擇不同的鴿舍（切換到非當前鴿舍）
 *
 * @returns 新選擇的鴿舍 ID
 */
export async function switchToAnotherLoft(page: Page): Promise<string> {
  // 選擇第二個鴿舍（index 1）
  return await selectLoftByIndex(page, 1);
}

// ============================================================================
// 舍內搜尋
// ============================================================================

/**
 * 取得舍內搜尋輸入框
 */
export function getLoftSearchBox(page: Page) {
  // 支援簡繁體：请/請 输入/輸入 该/該 鸽舍/鴿舍 内/內 环号/環號
  return page.getByRole('textbox', { name: /[请請][输輸]入.*[环環][号號]/ });
}

/**
 * 在鴿舍內搜尋環號
 *
 * @param page - Playwright Page 物件
 * @param ringNumber - 環號（部分或完整）
 * @returns 搜尋結果行數
 */
export async function searchInLoft(
  page: Page,
  ringNumber: string
): Promise<number> {
  const searchBox = getLoftSearchBox(page);

  if (!(await searchBox.isVisible().catch(() => false))) {
    return -1; // 搜尋框不存在
  }

  // 清空並輸入搜尋關鍵字
  await searchBox.clear();
  await searchBox.fill(ringNumber);
  await page.waitForTimeout(1000);

  // 計算結果行數
  const rows = page.locator('table tbody tr');
  return await rows.count();
}

/**
 * 清除搜尋
 */
export async function clearLoftSearch(page: Page): Promise<void> {
  const searchBox = getLoftSearchBox(page);

  if (await searchBox.isVisible().catch(() => false)) {
    await searchBox.clear();
    await page.waitForTimeout(500);
  }
}

// ============================================================================
// 鴿子選擇與軌跡查看
// ============================================================================

/**
 * 取得鴿舍內鴿子列表的行數
 */
export async function getPigeonRowCount(page: Page): Promise<number> {
  const rows = page.locator('table tbody tr');
  return await rows.count();
}

/**
 * 選擇鴿舍內的鴿子並查看軌跡
 *
 * @param page - Playwright Page 物件
 * @param pigeonIndex - 鴿子索引（0-based，預設 0）
 */
export async function selectPigeonAndViewTrajectory(
  page: Page,
  pigeonIndex: number = 0
): Promise<void> {
  // 先取消之前的選擇
  const checkedBoxes = page.locator('input[type="checkbox"]:checked');
  const checkedCount = await checkedBoxes.count();
  for (let i = 0; i < checkedCount; i++) {
    await checkedBoxes.first().click();
    await page.waitForTimeout(200);
  }

  // 選擇鴿子（checkbox）
  const checkboxes = page.locator('table').getByRole('checkbox');
  const count = await checkboxes.count();

  if (count === 0) {
    throw new Error('找不到任何鴿子 checkbox');
  }

  if (pigeonIndex >= count) {
    throw new Error(`索引 ${pigeonIndex} 超出範圍（共 ${count} 隻鴿子）`);
  }

  await checkboxes.nth(pigeonIndex).click();
  await page.waitForTimeout(QUICK_WAIT);

  // 確保 2D 偏好選中（避免進入 3D）
  // 先檢查 3D toggle 是否被選中
  const toggle3D = page.getByRole('button', { name: '3D', exact: true });
  if (await toggle3D.isVisible().catch(() => false)) {
    const is3DSelected = await toggle3D
      .evaluate((el) => el.classList.contains('mat-button-toggle-checked'))
      .catch(() => false);
    if (is3DSelected) {
      // 切換到 2D
      const toggle2D = page.getByRole('button', { name: '2D', exact: true });
      await toggle2D.click({ force: true });
      await page.waitForTimeout(QUICK_WAIT);
    }
  }

  // 點擊查看軌跡
  const viewButton = page.getByRole('button', { name: /查看[轨軌][迹跡]/ });
  await viewButton.first().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500); // 等待按鈕狀態更新
  await viewButton.first().click();

  // 等待軌跡載入
  await waitForTrajectoryLoaded(page);

  // 如果進入了 3D 模式，切換回 2D
  const is3DMode = await page
    .getByRole('button', { name: /[视視]角1/ })
    .isVisible()
    .catch(() => false);
  if (is3DMode) {
    const switch2D = page.getByRole('button', { name: '2D模式' });
    if (await switch2D.isVisible().catch(() => false)) {
      await switch2D.click();
      await page.waitForTimeout(3000);
    }
  }
}

/**
 * 等待軌跡載入完成
 */
async function waitForTrajectoryLoaded(page: Page): Promise<void> {
  // 等待載入提示出現
  const loadingIndicator = page.locator('text=/載入|加载|Loading/i');
  await loadingIndicator
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});

  // 等待載入提示消失
  await loadingIndicator
    .waitFor({ state: 'hidden', timeout: LOAD_TIMEOUT })
    .catch(() => {});

  // 額外等待渲染
  await page.waitForTimeout(2000);
}

// ============================================================================
// 驗證函數
// ============================================================================

/**
 * 驗證鴿舍列表頁面已載入
 */
export async function isLoftListLoaded(page: Page): Promise<boolean> {
  // 檢查：Tab 啟用 + combobox 可見 + 表格可見
  const tabActive = await isLoftListTabActive(page);
  const comboboxVisible = await getLoftSelector(page)
    .isVisible()
    .catch(() => false);
  const tableVisible = await page
    .locator('table')
    .isVisible()
    .catch(() => false);

  return tabActive && comboboxVisible && tableVisible;
}
