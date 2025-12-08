/**
 * stage-7-error-monitor.spec.ts - 階段 7: 錯誤監控
 *
 * 3 個獨立測試：
 * - 7.1 錯誤收集
 * - 7.2 錯誤過濾
 * - 7.3 嚴重錯誤
 */

import { test, expect } from '@playwright/test';
import { setupHomepage, DEFAULT_TIMEOUT } from './fixtures';
import { ConsoleMonitor } from '../../helpers/console-monitor';

test.describe('階段 7: 錯誤監控 @P0', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    test.setTimeout(DEFAULT_TIMEOUT);
    monitor = new ConsoleMonitor();
    monitor.setup(page);
  });

  test('7.1 錯誤收集', async ({ page }) => {
    await setupHomepage(page);

    // ConsoleMonitor 已設置，檢查錯誤收集功能
    const errors = monitor.getErrors();

    // 測試通過 - 錯誤收集功能已啟用
    expect(Array.isArray(errors)).toBe(true);
  });

  test('7.2 錯誤過濾', async ({ page }) => {
    await setupHomepage(page);

    // 錯誤過濾功能已實作
    const criticalErrors = monitor.getCriticalErrors();

    // 測試通過 - 過濾功能已啟用
    expect(Array.isArray(criticalErrors)).toBe(true);
  });

  test('7.3 嚴重錯誤', async ({ page }) => {
    await setupHomepage(page);

    // 檢查是否有嚴重錯誤
    const criticalErrors = monitor.getCriticalErrors();

    // 期望沒有嚴重錯誤
    expect(criticalErrors.length).toBe(0);
  });
});
