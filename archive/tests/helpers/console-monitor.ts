/**
 * console-monitor.ts - 控制台監控
 *
 * 規格來源: dev/active/test-flow-refactor/specs/console-monitor.spec.md
 * 優先級: 🔴 必做
 *
 * 功能：統一的錯誤收集、白名單過濾、分階段報告
 */

import { Page } from '@playwright/test';

// ============================================================================
// 型別定義
// ============================================================================

export type ConsoleEventType = 'error' | 'warn' | 'log' | 'info' | 'debug';

export interface ConsoleEvent {
  type: ConsoleEventType;
  message: string;
  stack?: string;
  url?: string;
  lineNumber?: number;
  timestamp: number;
  stage: number;
}

export interface ConsoleReport {
  totalEvents: number;
  criticalErrors: ConsoleEvent[];
  warningsByStage: Map<number, number>;
  errorsByType: Map<string, number>;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  stage: number;
  type: ConsoleEventType;
  time: string;
  preview: string;
}

export interface MonitorConfig {
  captureWarnings?: boolean;
  captureLogs?: boolean;
  maxEvents?: number;
}

// ============================================================================
// 白名單與嚴重錯誤模式
// ============================================================================

export const ERROR_WHITELIST: RegExp[] = [
  /favicon\.ico/i,
  /chrome-extension/i,
  /moz-extension/i,
  /google.*analytics/i,
  /gtag/i,
  /hotjar/i,
  /gpx2d.*undefined/i,
  /Cesium.*deprecated/i,
  /net::ERR_BLOCKED/i,
  /CORS/i,
  /AMap.*BINDbindbindbindbindbindbin/i,
  /Canvas2D.*willReadFrequently/i,
  /aria-hidden/i,
];

export const CRITICAL_PATTERNS: RegExp[] = [
  /uncaught.*error/i,
  /unhandled.*rejection/i,
  /fatal/i,
  /crash/i,
];

// ============================================================================
// 核心類別
// ============================================================================

export class ConsoleMonitor {
  private events: ConsoleEvent[] = [];
  private currentStage: number = 1;
  private config: Required<MonitorConfig>;
  private isSetup: boolean = false;

  constructor(config: MonitorConfig = {}) {
    this.config = {
      captureWarnings: config.captureWarnings ?? false,
      captureLogs: config.captureLogs ?? false,
      maxEvents: config.maxEvents ?? 1000,
    };
  }

  setup(page: Page): void {
    if (this.isSetup) {
      console.warn('ConsoleMonitor 已設置，跳過重複設置');
      return;
    }

    page.on('console', (msg) => {
      const type = msg.type() as ConsoleEventType;
      if (type === 'log' && !this.config.captureLogs) return;
      if (type === 'warn' && !this.config.captureWarnings) return;

      this.addEvent({
        type,
        message: msg.text(),
        url: msg.location().url,
        lineNumber: msg.location().lineNumber,
        timestamp: Date.now(),
        stage: this.currentStage,
      });
    });

    page.on('pageerror', (error) => {
      this.addEvent({
        type: 'error',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        stage: this.currentStage,
      });
    });

    this.isSetup = true;
  }

  private addEvent(event: ConsoleEvent): void {
    if (this.events.length >= this.config.maxEvents) {
      this.events.shift();
    }
    this.events.push(event);
  }

  setStage(stageId: number): void {
    this.currentStage = stageId;
  }

  clear(): void {
    this.events = [];
  }

  getEventsByStage(stageId: number): ConsoleEvent[] {
    return this.events.filter((e) => e.stage === stageId);
  }

  getErrors(): ConsoleEvent[] {
    return this.events.filter((e) => e.type === 'error');
  }

  getCriticalErrors(): ConsoleEvent[] {
    return this.getErrors().filter((e) => {
      if (CRITICAL_PATTERNS.some((p) => p.test(e.message))) return true;
      if (ERROR_WHITELIST.some((p) => p.test(e.message))) return false;
      return true;
    });
  }

  getReport(): ConsoleReport {
    const criticalErrors = this.getCriticalErrors();

    const warningsByStage = new Map<number, number>();
    this.events
      .filter((e) => e.type === 'warn')
      .forEach((e) => {
        warningsByStage.set(e.stage, (warningsByStage.get(e.stage) || 0) + 1);
      });

    const errorsByType = new Map<string, number>();
    this.getErrors().forEach((e) => {
      const type = this.categorizeError(e.message);
      errorsByType.set(type, (errorsByType.get(type) || 0) + 1);
    });

    const timeline = this.events.map((e) => ({
      stage: e.stage,
      type: e.type,
      time: new Date(e.timestamp).toISOString(),
      preview: e.message.substring(0, 80) + (e.message.length > 80 ? '...' : ''),
    }));

    return { totalEvents: this.events.length, criticalErrors, warningsByStage, errorsByType, timeline };
  }

  private categorizeError(message: string): string {
    if (/network|fetch|xhr/i.test(message)) return 'Network';
    if (/syntax|parse/i.test(message)) return 'Syntax';
    if (/type.*error|undefined|null/i.test(message)) return 'TypeError';
    if (/reference/i.test(message)) return 'ReferenceError';
    return 'Other';
  }

  printSummary(): void {
    const report = this.getReport();
    console.log('\n========================================');
    console.log('控制台監控摘要');
    console.log('========================================');
    console.log(`總事件數: ${report.totalEvents}`);
    console.log(`嚴重錯誤: ${report.criticalErrors.length}`);

    if (report.criticalErrors.length > 0) {
      console.log('\n⚠️ 嚴重錯誤詳情:');
      report.criticalErrors.forEach((e, i) => {
        console.log(`  ${i + 1}. [階段 ${e.stage}] ${e.message.substring(0, 100)}`);
      });
    }

    console.log('\n各階段警告數:');
    report.warningsByStage.forEach((count, stage) => {
      console.log(`  階段 ${stage}: ${count} 個警告`);
    });
    console.log('========================================\n');
  }
}
