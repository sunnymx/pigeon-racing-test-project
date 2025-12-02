/**
 * DevTools MCP 測試共用型別定義
 *
 * 統一管理所有 DevTools MCP 測試的型別定義，
 * 避免在各測試檔案中重複定義相同的介面。
 */

import { DevToolsContext } from '../../helpers-devtools/navigation';

/**
 * 測試上下文接口
 *
 * 擴展 DevToolsContext，包含測試所需的所有 MCP 工具方法。
 * DevToolsContext 包含：
 * - navigatePage(url) - 導航到指定 URL
 * - takeSnapshot() - 取得 a11y 快照
 * - click(uid) - 點擊元素
 * - waitFor(text, timeout) - 等待文字出現
 */
export interface TestContext extends DevToolsContext {
  /** 執行 JavaScript 腳本 */
  evaluateScript: (script: string) => Promise<unknown>;
  /** 列出控制台訊息 */
  listConsoleMessages?: () => Promise<Array<{ type: string; text: string }>>;
  /** 列出網路請求 */
  listNetworkRequests?: () => Promise<Array<{ url: string; status?: number }>>;
  /** 截圖到檔案（可選） */
  takeScreenshotToFile?: (options?: { filePath?: string }) => Promise<void>;
}

/**
 * 單一測試結果
 */
export interface TestResult {
  /** 測試名稱 */
  name: string;
  /** 是否通過 */
  passed: boolean;
  /** 錯誤訊息列表 */
  errors: string[];
}

/**
 * 測試套件摘要
 */
export interface TestSummary {
  /** 測試總數 */
  total: number;
  /** 通過數量 */
  passed: number;
  /** 失敗數量 */
  failed: number;
  /** 各測試詳細結果 */
  results: TestResult[];
}

/**
 * 測試方法執行結果
 */
export interface TestMethodResult {
  passed: boolean;
  errors: string[];
}
