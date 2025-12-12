/**
 * checkbox-panel.ts - 勾選清單面板相關 helper 函數
 *
 * 支援記錄點 #09 測試：勾選清單面板
 * 測試項目：面板展開、清單內容、單個刪除、全部刪除、數量更新
 */

import { Page } from '@playwright/test';

// ============================================================================
// 常量定義
// ============================================================================

const QUICK_WAIT = 500;
const PANEL_ANIMATION_WAIT = 800;

// 支援簡繁體的正則表達式
const PANEL_BUTTON_REGEX = /勾[选選]清[单單]/;

// ============================================================================
// 面板按鈕操作
// ============================================================================

/**
 * 取得「勾選清單 N」按鈕
 */
export function getCheckboxPanelButton(page: Page) {
  return page.locator('button').filter({ hasText: PANEL_BUTTON_REGEX });
}

/**
 * 取得勾選清單的數量（從按鈕文字解析）
 *
 * @returns 數量，若按鈕不存在返回 0
 */
export async function getPanelCount(page: Page): Promise<number> {
  const button = getCheckboxPanelButton(page);

  if (!(await button.isVisible().catch(() => false))) {
    return 0;
  }

  const text = (await button.textContent()) || '';
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 檢查勾選清單面板是否已展開
 */
export async function isCheckboxPanelExpanded(page: Page): Promise<boolean> {
  const button = getCheckboxPanelButton(page);

  if (!(await button.isVisible().catch(() => false))) {
    return false;
  }

  // 使用 aria-expanded 屬性判斷（從 DOM 觀察到展開時有 [expanded] 屬性）
  const expanded = await button.getAttribute('aria-expanded');
  return expanded === 'true';
}

/**
 * 展開勾選清單面板
 *
 * @returns 是否成功展開
 */
export async function expandCheckboxPanel(page: Page): Promise<boolean> {
  const button = getCheckboxPanelButton(page);

  if (!(await button.isVisible().catch(() => false))) {
    return false;
  }

  // 檢查是否已展開
  if (await isCheckboxPanelExpanded(page)) {
    return true;
  }

  await button.click();
  await page.waitForTimeout(PANEL_ANIMATION_WAIT);

  return await isCheckboxPanelExpanded(page);
}

/**
 * 收起勾選清單面板
 */
export async function collapseCheckboxPanel(page: Page): Promise<boolean> {
  const button = getCheckboxPanelButton(page);

  if (!(await button.isVisible().catch(() => false))) {
    return false;
  }

  // 檢查是否已收起
  if (!(await isCheckboxPanelExpanded(page))) {
    return true;
  }

  await button.click();
  await page.waitForTimeout(PANEL_ANIMATION_WAIT);

  return !(await isCheckboxPanelExpanded(page));
}

// ============================================================================
// 面板內容操作
// ============================================================================

/**
 * 取得面板內的鴿子列表項目
 *
 * @returns 列表項目的 Locator
 */
export function getPanelPigeonItems(page: Page) {
  // 面板內的列表項目，包含環號格式 XX-XXXXXXX
  return page.locator('[class*="panel"] [class*="item"], [class*="list"] [class*="item"]').filter({
    hasText: /\d{2}-\d{7}/,
  });
}

/**
 * 取得單個刪除按鈕（排除「全部刪除」）
 */
function getDeleteButtons(page: Page) {
  // 使用 getByRole 精確匹配「删除」或「刪除」
  return page.getByRole('button', { name: /^[删刪]除$/ });
}

/**
 * 取得「全部刪除」按鈕
 */
function getDeleteAllButton(page: Page) {
  return page.getByRole('button', { name: /全部[删刪]除/ });
}

/**
 * 取得面板內的鴿子數量
 */
export async function getPanelPigeonCount(page: Page): Promise<number> {
  // 方法 1：計算列表項目
  const items = getPanelPigeonItems(page);
  const itemCount = await items.count().catch(() => 0);

  if (itemCount > 0) {
    return itemCount;
  }

  // 方法 2：計算刪除按鈕數量（每隻鴿子一個）
  const deleteButtons = getDeleteButtons(page);
  return await deleteButtons.count().catch(() => 0);
}

/**
 * 取得面板內所有鴿子的環號
 */
export async function getPanelPigeonRings(page: Page): Promise<string[]> {
  const rings: string[] = [];

  // 從面板內容中提取環號
  const panelText = await page.locator('[class*="panel"], [class*="list"]').textContent() || '';
  const matches = panelText.match(/\d{2}-\d{7}/g);

  if (matches) {
    rings.push(...matches);
  }

  return rings;
}

// ============================================================================
// 刪除操作
// ============================================================================

/**
 * 刪除面板內第一隻鴿子
 *
 * @returns 刪除前的數量
 */
export async function deleteFirstPigeonFromPanel(page: Page): Promise<number> {
  const beforeCount = await getPanelCount(page);

  // 確保面板已展開
  await expandCheckboxPanel(page);

  // 點擊第一個刪除按鈕
  const deleteButton = getDeleteButtons(page).first();

  if (await deleteButton.isVisible().catch(() => false)) {
    await deleteButton.click();
    await page.waitForTimeout(QUICK_WAIT);
  }

  return beforeCount;
}

/**
 * 刪除面板內指定索引的鴿子
 *
 * @param index - 鴿子索引（0-based）
 * @returns 是否成功刪除
 */
export async function deletePigeonByIndex(page: Page, index: number): Promise<boolean> {
  // 確保面板已展開
  await expandCheckboxPanel(page);

  const deleteButtons = getDeleteButtons(page);
  const count = await deleteButtons.count();

  if (index >= count) {
    return false;
  }

  await deleteButtons.nth(index).click();
  await page.waitForTimeout(QUICK_WAIT);

  return true;
}

/**
 * 刪除面板內所有鴿子
 *
 * @returns 刪除前的數量
 */
export async function deleteAllFromPanel(page: Page): Promise<number> {
  const beforeCount = await getPanelCount(page);

  // 確保面板已展開
  await expandCheckboxPanel(page);

  // 點擊「全部刪除」按鈕
  const deleteAllButton = getDeleteAllButton(page);

  if (await deleteAllButton.isVisible().catch(() => false)) {
    await deleteAllButton.click();
    await page.waitForTimeout(QUICK_WAIT);
  }

  return beforeCount;
}

// ============================================================================
// 驗證函數
// ============================================================================

/**
 * 驗證面板數量與實際選擇數一致
 */
export async function verifyPanelCountMatchesSelection(page: Page): Promise<boolean> {
  const panelCount = await getPanelCount(page);
  const pigeonCount = await getPanelPigeonCount(page);

  // 面板數量應該與內部鴿子數量一致
  return panelCount === pigeonCount;
}
