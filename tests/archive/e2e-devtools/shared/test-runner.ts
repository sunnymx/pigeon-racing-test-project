/**
 * DevTools MCP 測試執行器基礎類別
 *
 * 提供統一的測試執行邏輯，各測試套件只需實作具體測試方法。
 */

import { TestContext, TestResult, TestSummary, TestMethodResult } from './test-types';
import { TrajectoryContext } from '../../helpers-devtools/trajectory-utils';

/**
 * 測試定義
 */
export interface TestDefinition {
  /** 測試名稱 */
  name: string;
  /** 測試方法 */
  method: () => Promise<TestMethodResult>;
}

/**
 * 基礎測試執行器
 *
 * 提供：
 * - 統一的上下文管理
 * - 測試執行與結果收集
 * - 格式化輸出
 */
export abstract class BaseTestRunner {
  protected ctx: TestContext;
  protected trajectoryCtx: TrajectoryContext;

  constructor(ctx: TestContext) {
    this.ctx = ctx;
    this.trajectoryCtx = {
      evaluateScript: ctx.evaluateScript,
    };
  }

  /**
   * 取得測試清單（由子類別實作）
   */
  protected abstract getTests(): TestDefinition[];

  /**
   * 執行所有測試
   */
  async runAll(): Promise<TestSummary> {
    const tests = this.getTests();
    const results: TestResult[] = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`\n========== 測試 ${i + 1}/${tests.length} ==========`);

      try {
        const result = await test.method();
        results.push({
          name: test.name,
          passed: result.passed,
          errors: result.errors,
        });
      } catch (error) {
        results.push({
          name: test.name,
          passed: false,
          errors: [`測試執行錯誤：${(error as Error).message}`],
        });
      }
    }

    // 統計
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    // 輸出結果
    this.printSummary(results, passed, failed);

    return { total: results.length, passed, failed, results };
  }

  /**
   * 輸出測試摘要
   */
  private printSummary(results: TestResult[], passed: number, failed: number): void {
    console.log('\n========== 測試結果 ==========');
    console.log(`總計：${results.length} | 通過：${passed} | 失敗：${failed}`);

    results.forEach((r, i) => {
      const status = r.passed ? '✅' : '❌';
      console.log(`${status} [${i + 1}] ${r.name}`);
      if (!r.passed && r.errors.length > 0) {
        r.errors.forEach((e) => console.log(`    - ${e}`));
      }
    });
  }

  /**
   * 執行單一測試（帶錯誤處理）
   */
  protected async runTest(
    testName: string,
    testFn: () => Promise<void>,
    errors: string[]
  ): Promise<TestMethodResult> {
    console.log(`🚀 開始測試：${testName}`);

    try {
      await testFn();

      if (errors.length === 0) {
        console.log(`✅ 測試通過：${testName}`);
      }

      return { passed: errors.length === 0, errors };
    } catch (error) {
      errors.push(`測試執行錯誤：${(error as Error).message}`);
      return { passed: false, errors };
    }
  }
}
