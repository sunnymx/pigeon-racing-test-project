/**
 * Report Generator - Playwright vs DevTools MCP 對比報告產生器
 *
 * 輸出格式：
 * - Markdown 報告
 * - JSON 數據
 */

import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkSummary } from './benchmark-runner';
import { ComparisonMetrics } from './metrics-collector';

// ============================================================================
// Report Generator 類別
// ============================================================================

export class ReportGenerator {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * 產生 Markdown 報告
   */
  generateMarkdownReport(
    metrics: ComparisonMetrics,
    benchmarkSummary: BenchmarkSummary
  ): string {
    const report = `# Playwright vs DevTools MCP 最終對比報告

**產生日期**: ${new Date().toLocaleString('zh-TW')}
**測試環境**: macOS Darwin 24.6.0
**測試迭代**: ${benchmarkSummary.config.iterations} 次

---

## 執行摘要

| 面向 | Playwright | DevTools MCP | 勝者 |
|------|-----------|--------------|------|
| 速度 | ${metrics.speed.playwright}ms | ${metrics.speed.devtools}ms | ${metrics.speed.winner === 'tie' ? '平手' : metrics.speed.winner} |
| 穩定性 | ${metrics.stability.playwright.passRate.toFixed(1)}% | ${metrics.stability.devtools.passRate.toFixed(1)}% | ${metrics.stability.playwright.passRate >= metrics.stability.devtools.passRate ? 'playwright' : 'devtools'} |
| 程式碼行數 | ${metrics.codeComplexity.playwright.totalLines} | ${metrics.codeComplexity.devtools.totalLines} | ${metrics.codeComplexity.playwright.totalLines <= metrics.codeComplexity.devtools.totalLines ? 'playwright' : 'devtools'} |

---

## 速度對比

| 測試套件 | Playwright | DevTools MCP | 差異 |
|---------|-----------|--------------|------|
${benchmarkSummary.playwrightResults
  .map((pw, i) => {
    const dt = benchmarkSummary.devtoolsResults[i];
    const diff = dt?.avgDuration && pw.avgDuration
      ? ((dt.avgDuration - pw.avgDuration) / pw.avgDuration * 100).toFixed(1)
      : 'N/A';
    return `| ${pw.testSuite} | ${pw.avgDuration}ms | ${dt?.avgDuration || 'N/A'}ms | ${diff}% |`;
  })
  .join('\n')}

**總體差異**: ${metrics.speed.difference}

---

## 穩定性對比

### Playwright
- 總執行次數: ${metrics.stability.playwright.totalRuns}
- 通過: ${metrics.stability.playwright.passed}
- 失敗: ${metrics.stability.playwright.failed}
- 通過率: ${metrics.stability.playwright.passRate.toFixed(1)}%

### DevTools MCP
- 總執行次數: ${metrics.stability.devtools.totalRuns}
- 通過: ${metrics.stability.devtools.passed}
- 失敗: ${metrics.stability.devtools.failed}
- 通過率: ${metrics.stability.devtools.passRate.toFixed(1)}%

---

## 程式碼複雜度

| 指標 | Playwright | DevTools MCP |
|------|-----------|--------------|
| 總行數 | ${metrics.codeComplexity.playwright.totalLines} | ${metrics.codeComplexity.devtools.totalLines} |
| 檔案數 | ${metrics.codeComplexity.playwright.files} | ${metrics.codeComplexity.devtools.files} |
| 平均每檔行數 | ${metrics.codeComplexity.playwright.avgLinesPerFile} | ${metrics.codeComplexity.devtools.avgLinesPerFile} |

**複雜度增加**: ${metrics.codeComplexity.increase}

---

## 獨特功能對比

### Playwright 獨有
${metrics.uniqueFeatures.playwright.map(f => `- ${f}`).join('\n')}

### DevTools MCP 獨有
${metrics.uniqueFeatures.devtools.map(f => `- ${f}`).join('\n')}

---

## 建議

### 使用 Playwright 當：
1. 需要完整的測試報告（HTML、截圖、錄影）
2. 需要 CI/CD 整合
3. 需要平行執行多個測試
4. 需要跨瀏覽器測試

### 使用 DevTools MCP 當：
1. 需要即時除錯
2. 需要效能追蹤分析
3. 需要詳細的網路請求資訊
4. 進行互動式探索測試
5. 快速驗證功能

---

## 結論

${this.generateConclusion(metrics)}

---

*報告由 Phase 4 對比工具自動產生*
`;

    return report;
  }

  /**
   * 產生結論
   */
  private generateConclusion(metrics: ComparisonMetrics): string {
    const conclusions: string[] = [];

    // 速度結論
    if (metrics.speed.winner === 'playwright') {
      conclusions.push('- Playwright 在執行速度上表現較佳');
    } else if (metrics.speed.winner === 'devtools') {
      conclusions.push('- DevTools MCP 在執行速度上表現較佳');
    } else {
      conclusions.push('- 兩者在執行速度上表現相近');
    }

    // 程式碼複雜度結論
    const increase = parseFloat(metrics.codeComplexity.increase);
    if (increase > 30) {
      conclusions.push(`- DevTools MCP 版本程式碼增加 ${metrics.codeComplexity.increase}，超過 30% 目標`);
    } else {
      conclusions.push(`- DevTools MCP 版本程式碼增加 ${metrics.codeComplexity.increase}，在可接受範圍內`);
    }

    // 功能結論
    conclusions.push('- Playwright 適合正式測試環境（報告完整）');
    conclusions.push('- DevTools MCP 適合開發除錯環境（即時互動）');

    return conclusions.join('\n');
  }

  /**
   * 儲存報告
   */
  saveReport(
    metrics: ComparisonMetrics,
    benchmarkSummary: BenchmarkSummary
  ): { markdownPath: string; jsonPath: string } {
    // Markdown 報告
    const markdownContent = this.generateMarkdownReport(metrics, benchmarkSummary);
    const markdownPath = path.join(this.outputDir, 'final-comparison-report.md');
    fs.writeFileSync(markdownPath, markdownContent, 'utf-8');

    // JSON 數據
    const jsonData = {
      metrics,
      benchmarkSummary,
      generatedAt: new Date().toISOString(),
    };
    const jsonPath = path.join(this.outputDir, 'results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

    console.log(`報告已產生:`);
    console.log(`  - Markdown: ${markdownPath}`);
    console.log(`  - JSON: ${jsonPath}`);

    return { markdownPath, jsonPath };
  }
}
