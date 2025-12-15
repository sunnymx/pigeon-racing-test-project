/**
 * Metrics Collector - Playwright vs DevTools MCP 指標收集
 *
 * 收集四大面向：
 * - 速度：執行時間
 * - 穩定性：通過率、Flaky 率
 * - 偵錯：效能追蹤可用性
 * - 開發體驗：程式碼行數
 */

import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkResult, BenchmarkSummary } from './benchmark-runner';

// ============================================================================
// 型別定義
// ============================================================================

export interface SpeedMetrics {
  playwright: number;
  devtools: number;
  difference: string;
  winner: 'playwright' | 'devtools' | 'tie';
}

export interface StabilityMetrics {
  playwright: { passRate: number; totalRuns: number; passed: number; failed: number };
  devtools: { passRate: number; totalRuns: number; passed: number; failed: number };
}

export interface CodeComplexityMetrics {
  playwright: { totalLines: number; files: number; avgLinesPerFile: number };
  devtools: { totalLines: number; files: number; avgLinesPerFile: number };
  increase: string;
}

export interface UniqueFeatures {
  playwright: string[];
  devtools: string[];
}

export interface ComparisonMetrics {
  speed: SpeedMetrics;
  stability: StabilityMetrics;
  codeComplexity: CodeComplexityMetrics;
  uniqueFeatures: UniqueFeatures;
  collectedAt: string;
}

// ============================================================================
// Metrics Collector 類別
// ============================================================================

export class MetricsCollector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * 計算速度指標
   */
  calculateSpeedMetrics(
    playwrightResults: BenchmarkResult[],
    devtoolsResults: BenchmarkResult[]
  ): SpeedMetrics {
    const pwAvg = this.calculateOverallAverage(playwrightResults);
    const dtAvg = this.calculateOverallAverage(devtoolsResults);

    if (pwAvg === 0 || dtAvg === 0) {
      return {
        playwright: pwAvg,
        devtools: dtAvg,
        difference: 'N/A (缺少數據)',
        winner: 'tie',
      };
    }

    const diff = ((dtAvg - pwAvg) / pwAvg) * 100;
    const diffStr = diff > 0 ? `+${diff.toFixed(1)}% slower` : `${Math.abs(diff).toFixed(1)}% faster`;

    return {
      playwright: pwAvg,
      devtools: dtAvg,
      difference: diffStr,
      winner: diff > 5 ? 'playwright' : diff < -5 ? 'devtools' : 'tie',
    };
  }

  /**
   * 計算穩定性指標
   */
  calculateStabilityMetrics(
    playwrightResults: BenchmarkResult[],
    devtoolsResults: BenchmarkResult[]
  ): StabilityMetrics {
    const pwStats = this.aggregateResults(playwrightResults);
    const dtStats = this.aggregateResults(devtoolsResults);

    return {
      playwright: {
        passRate: pwStats.total > 0 ? (pwStats.passed / pwStats.total) * 100 : 0,
        totalRuns: pwStats.total,
        passed: pwStats.passed,
        failed: pwStats.failed,
      },
      devtools: {
        passRate: dtStats.total > 0 ? (dtStats.passed / dtStats.total) * 100 : 0,
        totalRuns: dtStats.total,
        passed: dtStats.passed,
        failed: dtStats.failed,
      },
    };
  }

  /**
   * 計算程式碼複雜度
   */
  async calculateCodeComplexity(): Promise<CodeComplexityMetrics> {
    const pwLines = await this.countLines('tests/e2e');
    const dtLines = await this.countLines('tests/e2e-devtools');
    const dtHelperLines = await this.countLines('tests/helpers-devtools');

    const pwTotal = pwLines.totalLines;
    const dtTotal = dtLines.totalLines + dtHelperLines.totalLines;

    const increase = pwTotal > 0 ? ((dtTotal - pwTotal) / pwTotal) * 100 : 0;

    return {
      playwright: {
        totalLines: pwTotal,
        files: pwLines.files,
        avgLinesPerFile: pwLines.files > 0 ? Math.round(pwTotal / pwLines.files) : 0,
      },
      devtools: {
        totalLines: dtTotal,
        files: dtLines.files + dtHelperLines.files,
        avgLinesPerFile:
          dtLines.files + dtHelperLines.files > 0
            ? Math.round(dtTotal / (dtLines.files + dtHelperLines.files))
            : 0,
      },
      increase: `${increase > 0 ? '+' : ''}${increase.toFixed(1)}%`,
    };
  }

  /**
   * 取得獨特功能列表
   */
  getUniqueFeatures(): UniqueFeatures {
    return {
      playwright: [
        'HTML 報告 (內建)',
        '錄影功能 (自動)',
        'Trace Viewer',
        '截圖 (自動失敗時)',
        '平行測試執行',
        'CI/CD 整合',
      ],
      devtools: [
        '效能追蹤 (Performance Trace)',
        '網路請求詳情',
        'Console 訊息存取',
        'DOM 快照 (a11y 樹)',
        '即時除錯',
        'JavaScript 執行',
      ],
    };
  }

  /**
   * 收集所有指標
   */
  async collectAll(benchmarkSummary: BenchmarkSummary): Promise<ComparisonMetrics> {
    return {
      speed: this.calculateSpeedMetrics(
        benchmarkSummary.playwrightResults,
        benchmarkSummary.devtoolsResults
      ),
      stability: this.calculateStabilityMetrics(
        benchmarkSummary.playwrightResults,
        benchmarkSummary.devtoolsResults
      ),
      codeComplexity: await this.calculateCodeComplexity(),
      uniqueFeatures: this.getUniqueFeatures(),
      collectedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // 輔助方法
  // ============================================================================

  private calculateOverallAverage(results: BenchmarkResult[]): number {
    const validResults = results.filter((r) => r.avgDuration > 0);
    if (validResults.length === 0) return 0;
    const sum = validResults.reduce((a, b) => a + b.avgDuration, 0);
    return Math.round(sum / validResults.length);
  }

  private aggregateResults(results: BenchmarkResult[]): {
    total: number;
    passed: number;
    failed: number;
  } {
    return results.reduce(
      (acc, r) => ({
        total: acc.total + r.passed + r.failed,
        passed: acc.passed + r.passed,
        failed: acc.failed + r.failed,
      }),
      { total: 0, passed: 0, failed: 0 }
    );
  }

  private async countLines(relativePath: string): Promise<{ totalLines: number; files: number }> {
    const fullPath = path.join(this.projectRoot, relativePath);

    if (!fs.existsSync(fullPath)) {
      return { totalLines: 0, files: 0 };
    }

    let totalLines = 0;
    let files = 0;

    const entries = fs.readdirSync(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(path.join(fullPath, entry.name), 'utf-8');
        totalLines += content.split('\n').length;
        files++;
      } else if (entry.isDirectory()) {
        const subResult = await this.countLines(path.join(relativePath, entry.name));
        totalLines += subResult.totalLines;
        files += subResult.files;
      }
    }

    return { totalLines, files };
  }
}
