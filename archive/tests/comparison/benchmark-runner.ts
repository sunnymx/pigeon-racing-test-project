/**
 * Benchmark Runner - Playwright vs DevTools MCP 效能對比
 *
 * 功能：
 * - 執行 Playwright 測試並計時
 * - 執行 DevTools MCP 測試並計時
 * - 收集執行結果
 * - 支援多次執行取平均值
 */

import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';

// ============================================================================
// 型別定義
// ============================================================================

export interface BenchmarkConfig {
  /** 執行次數 */
  iterations: number;
  /** 預熱次數 (不計入統計) */
  warmupRuns: number;
  /** 要執行的測試套件 */
  testSuites: TestSuiteConfig[];
  /** 專案根目錄 */
  projectRoot: string;
}

export interface TestSuiteConfig {
  /** 測試套件名稱 */
  name: string;
  /** Playwright 測試檔案路徑 (相對於 projectRoot) */
  playwrightPath: string;
  /** DevTools MCP 測試檔案路徑 (相對於 projectRoot) */
  devtoolsPath: string;
}

export interface BenchmarkResult {
  /** 測試框架 */
  framework: 'playwright' | 'devtools';
  /** 測試套件名稱 */
  testSuite: string;
  /** 每次執行時間 (ms) */
  durations: number[];
  /** 平均執行時間 (ms) */
  avgDuration: number;
  /** 最短執行時間 (ms) */
  minDuration: number;
  /** 最長執行時間 (ms) */
  maxDuration: number;
  /** 通過次數 */
  passed: number;
  /** 失敗次數 */
  failed: number;
  /** 執行時間戳 */
  timestamp: string;
}

export interface BenchmarkSummary {
  /** 執行設定 */
  config: BenchmarkConfig;
  /** Playwright 結果 */
  playwrightResults: BenchmarkResult[];
  /** DevTools MCP 結果 */
  devtoolsResults: BenchmarkResult[];
  /** 執行時間 */
  executedAt: string;
}

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 執行命令並計時
 */
async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<{ duration: number; success: boolean; output: string }> {
  const startTime = performance.now();

  return new Promise((resolve) => {
    const options: SpawnOptions = {
      cwd,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    };

    const proc = spawn(command, args, options);
    let output = '';

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      const endTime = performance.now();
      resolve({
        duration: endTime - startTime,
        success: code === 0,
        output,
      });
    });

    proc.on('error', (err) => {
      const endTime = performance.now();
      resolve({
        duration: endTime - startTime,
        success: false,
        output: err.message,
      });
    });
  });
}

/**
 * 計算統計數據
 */
function calculateStats(durations: number[]): {
  avg: number;
  min: number;
  max: number;
} {
  if (durations.length === 0) {
    return { avg: 0, min: 0, max: 0 };
  }
  const sum = durations.reduce((a, b) => a + b, 0);
  return {
    avg: Math.round(sum / durations.length),
    min: Math.round(Math.min(...durations)),
    max: Math.round(Math.max(...durations)),
  };
}

// ============================================================================
// Benchmark Runner 類別
// ============================================================================

export class BenchmarkRunner {
  private config: BenchmarkConfig;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  /**
   * 執行 Playwright 測試
   */
  async runPlaywright(testPath: string): Promise<{ duration: number; success: boolean }> {
    const result = await runCommand(
      'npx',
      ['playwright', 'test', testPath, '--reporter=list'],
      this.config.projectRoot
    );
    return { duration: result.duration, success: result.success };
  }

  /**
   * 執行單一測試套件的 Playwright benchmark
   */
  async benchmarkPlaywright(suite: TestSuiteConfig): Promise<BenchmarkResult> {
    console.log(`\n[Playwright] ${suite.name} - 開始 benchmark...`);

    // 預熱
    for (let i = 0; i < this.config.warmupRuns; i++) {
      console.log(`  預熱 ${i + 1}/${this.config.warmupRuns}...`);
      await this.runPlaywright(suite.playwrightPath);
    }

    // 正式執行
    const durations: number[] = [];
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < this.config.iterations; i++) {
      console.log(`  執行 ${i + 1}/${this.config.iterations}...`);
      const result = await this.runPlaywright(suite.playwrightPath);
      durations.push(result.duration);
      if (result.success) passed++;
      else failed++;
    }

    const stats = calculateStats(durations);

    return {
      framework: 'playwright',
      testSuite: suite.name,
      durations,
      avgDuration: stats.avg,
      minDuration: stats.min,
      maxDuration: stats.max,
      passed,
      failed,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 執行所有 benchmark
   */
  async runAll(): Promise<BenchmarkSummary> {
    console.log('========================================');
    console.log('Playwright vs DevTools MCP Benchmark');
    console.log('========================================');
    console.log(`迭代次數: ${this.config.iterations}`);
    console.log(`預熱次數: ${this.config.warmupRuns}`);
    console.log(`測試套件: ${this.config.testSuites.length} 個`);

    const playwrightResults: BenchmarkResult[] = [];
    const devtoolsResults: BenchmarkResult[] = [];

    for (const suite of this.config.testSuites) {
      // Playwright benchmark
      const pwResult = await this.benchmarkPlaywright(suite);
      playwrightResults.push(pwResult);
      console.log(`  [Playwright] ${suite.name}: ${pwResult.avgDuration}ms (avg)`);

      // DevTools MCP - 由於是互動式，這裡只記錄結構
      // 實際執行需要手動或透過其他機制
      devtoolsResults.push({
        framework: 'devtools',
        testSuite: suite.name,
        durations: [],
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        passed: 0,
        failed: 0,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      config: this.config,
      playwrightResults,
      devtoolsResults,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * 手動記錄 DevTools MCP 結果
   */
  recordDevToolsResult(
    suiteName: string,
    duration: number,
    passed: boolean
  ): BenchmarkResult {
    return {
      framework: 'devtools',
      testSuite: suiteName,
      durations: [duration],
      avgDuration: duration,
      minDuration: duration,
      maxDuration: duration,
      passed: passed ? 1 : 0,
      failed: passed ? 0 : 1,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// 預設設定
// ============================================================================

export const defaultConfig: BenchmarkConfig = {
  iterations: 3,
  warmupRuns: 1,
  projectRoot: path.resolve(__dirname, '../..'),
  testSuites: [
    {
      name: 'TC-02-001 (2D 靜態)',
      playwrightPath: 'tests/e2e/tc-02-001-2d-static.spec.ts',
      devtoolsPath: 'tests/e2e-devtools/tc-02-001-2d-static.devtools.ts',
    },
    {
      name: 'TC-03-001 (模式切換)',
      playwrightPath: 'tests/e2e/tc-03-001-mode-switch.spec.ts',
      devtoolsPath: 'tests/e2e-devtools/tc-03-001-mode-switch.devtools.ts',
    },
    {
      name: 'TC-04-001 (3D 模式)',
      playwrightPath: 'tests/e2e/tc-04-001-3d-mode.spec.ts',
      devtoolsPath: 'tests/e2e-devtools/tc-04-001-3d-mode.devtools.ts',
    },
  ],
};

// ============================================================================
// CLI 入口
// ============================================================================

async function main() {
  const runner = new BenchmarkRunner(defaultConfig);
  const results = await runner.runAll();

  console.log('\n========================================');
  console.log('Benchmark 完成');
  console.log('========================================');

  // 輸出 Playwright 結果
  console.log('\nPlaywright 結果:');
  for (const r of results.playwrightResults) {
    console.log(`  ${r.testSuite}: ${r.avgDuration}ms (${r.passed}/${r.passed + r.failed} passed)`);
  }

  return results;
}

// 如果直接執行此檔案
if (require.main === module) {
  main().catch(console.error);
}
