/**
 * error-monitor.ts - 統一錯誤監控
 *
 * 支援記錄點 #11 測試：錯誤監控
 * 整合三種監控：Console 錯誤、網路請求、頁面崩潰
 *
 * 簡化自 archive/helpers/console-monitor.ts
 */

import { Page, Response } from '@playwright/test';

// ============================================================================
// 白名單：已知可忽略的錯誤
// ============================================================================

const ERROR_WHITELIST: RegExp[] = [
  // 瀏覽器資源
  /favicon\.ico/i,
  /chrome-extension/i,
  /moz-extension/i,

  // 分析工具
  /google.*analytics/i,
  /gtag/i,
  /hotjar/i,

  // 已知問題（已解決，見 KNOWN_ISSUES_SOLUTIONS.md）
  /gpx2d.*undefined/i,
  /Cannot read properties of undefined/i,
  /_leaflet_id/i,

  // 第三方庫警告
  /Cesium.*deprecated/i,
  /Canvas2D.*willReadFrequently/i,
  /aria-hidden/i,

  // 網路相關（非致命）
  /net::ERR_BLOCKED/i,
  /CORS/i,
];

// ============================================================================
// 型別定義
// ============================================================================

export interface ErrorEvent {
  type: 'console' | 'network' | 'page';
  message: string;
  timestamp: number;
  details?: string;
}

export interface ErrorReport {
  consoleErrors: ErrorEvent[];
  networkErrors: ErrorEvent[];
  pageErrors: ErrorEvent[];
  hasCriticalIssues: boolean;
}

// ============================================================================
// ErrorMonitor 類別
// ============================================================================

export class ErrorMonitor {
  private consoleErrors: ErrorEvent[] = [];
  private networkErrors: ErrorEvent[] = [];
  private pageErrors: ErrorEvent[] = [];
  private isSetup = false;

  /**
   * 設置監控器
   */
  setup(page: Page): void {
    if (this.isSetup) return;

    // 1. Console 錯誤監控
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!this.isWhitelisted(text)) {
          this.consoleErrors.push({
            type: 'console',
            message: text,
            timestamp: Date.now(),
            details: msg.location().url,
          });
        }
      }
    });

    // 2. 網路請求監控 (5xx 錯誤)
    page.on('response', (response: Response) => {
      if (response.status() >= 500) {
        this.networkErrors.push({
          type: 'network',
          message: `${response.status()} ${response.statusText()}`,
          timestamp: Date.now(),
          details: response.url(),
        });
      }
    });

    // 3. 頁面崩潰監控
    page.on('pageerror', (error: Error) => {
      if (!this.isWhitelisted(error.message)) {
        this.pageErrors.push({
          type: 'page',
          message: error.message,
          timestamp: Date.now(),
          details: error.stack,
        });
      }
    });

    this.isSetup = true;
  }

  /**
   * 檢查訊息是否在白名單中
   */
  private isWhitelisted(message: string): boolean {
    return ERROR_WHITELIST.some((pattern) => pattern.test(message));
  }

  /**
   * 取得錯誤報告
   */
  getReport(): ErrorReport {
    return {
      consoleErrors: this.consoleErrors,
      networkErrors: this.networkErrors,
      pageErrors: this.pageErrors,
      hasCriticalIssues:
        this.consoleErrors.length > 0 || this.networkErrors.length > 0 || this.pageErrors.length > 0,
    };
  }

  /**
   * 清除所有錯誤
   */
  clear(): void {
    this.consoleErrors = [];
    this.networkErrors = [];
    this.pageErrors = [];
  }

  /**
   * 輸出摘要（用於除錯）
   */
  printSummary(): void {
    const report = this.getReport();
    console.log('\n========== 錯誤監控摘要 ==========');
    console.log(`Console 錯誤: ${report.consoleErrors.length}`);
    console.log(`網路錯誤 (5xx): ${report.networkErrors.length}`);
    console.log(`頁面錯誤: ${report.pageErrors.length}`);

    if (report.hasCriticalIssues) {
      console.log('\n⚠️ 發現問題:');
      [...report.consoleErrors, ...report.networkErrors, ...report.pageErrors].forEach((e, i) => {
        console.log(`  ${i + 1}. [${e.type}] ${e.message.substring(0, 80)}`);
      });
    } else {
      console.log('\n✅ 無嚴重錯誤');
    }
    console.log('===================================\n');
  }
}
