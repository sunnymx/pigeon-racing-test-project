/**
 * trajectory-validator.ts - 軌跡詳情驗證
 *
 * 規格來源: dev/active/test-flow-refactor/specs/trajectory-validator.spec.md
 * 優先級: 🔴 必做
 *
 * 功能：摘要數據提取、航點提取、Layer 2 驗證、報告生成
 */

import { Page } from '@playwright/test';

// ============================================================================
// 型別定義
// ============================================================================

export interface SummaryData {
  ringNumber: string;
  startTime: string;
  endTime: string;
  duration: string;
  avgSpeed: number;
  maxSpeed: number;
  avgAltitude: number;
  maxAltitude: number;
  actualDistance: number;
  straightDistance: number;
}

export interface WaypointData {
  waypoint: number | '🏁';
  time: string;
  duration: string;
  distance: number;
  altitude: number;
  speed: number;
}

export interface CalculatedStats {
  totalWaypoints: number;
  maxSpeed: number;
  avgSpeed: number;
  maxAltitude: number;
  avgAltitude: number;
  totalDistance: number;
  finalDuration: string;
}

export interface ValidationResult {
  name: string;
  expected: number | string;
  actual: number | string;
  diff?: number;
  passed: boolean;
  tolerance: string;
}

export interface TrajectoryValidationReport {
  testName: string;
  timestamp: string;
  pigeonInfo: { ringNumber: string; startTime: string; endTime: string };
  summary: SummaryData;
  calculated: CalculatedStats;
  validations: ValidationResult[];
  passed: boolean;
  passedCount: number;
  failedCount: number;
  totalTests: number;
}

// ============================================================================
// 核心類別
// ============================================================================

export class TrajectoryValidator {
  constructor(private page: Page) {}

  async extractSummaryData(): Promise<SummaryData> {
    return await this.page.evaluate(() => {
      const container = document.querySelector('.info-container');
      if (!container) throw new Error('info-container not found');

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent?.trim();
        if (t) texts.push(t);
      }

      const getValue = (label: string): string | null => {
        const idx = texts.findIndex((t) => t.includes(label));
        return idx !== -1 && idx + 1 < texts.length ? texts[idx + 1] : null;
      };

      return {
        ringNumber: getValue('公环号') || '',
        startTime: getValue('起点时间') || '',
        endTime: getValue('终点时间') || '',
        duration: getValue('持续时间') || '',
        avgSpeed: parseFloat(getValue('平均分速') || '0'),
        maxSpeed: parseFloat(getValue('最高分速') || '0'),
        avgAltitude: parseFloat(getValue('平均高度') || '0'),
        maxAltitude: parseFloat(getValue('最大高度') || '0'),
        actualDistance: parseFloat(getValue('实际距离') || '0'),
        straightDistance: parseFloat(getValue('直线距离') || '0'),
      };
    });
  }

  async extractWaypoints(): Promise<WaypointData[]> {
    return await this.page.evaluate(() => {
      const container = document.querySelector('.info-container');
      if (!container) return [];

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const t = node.textContent?.trim();
        if (t) texts.push(t);
      }

      const speedIdx = texts.findIndex((t) => t === '速度');
      if (speedIdx === -1) return [];

      const wpTexts = texts
        .slice(speedIdx + 1)
        .filter((t) => !['2d', '2D模式', '切换图资', '版权所有', '备案号'].some((k) => t.includes(k)));

      const waypoints: any[] = [];
      for (let i = 0; i < wpTexts.length; i += 6) {
        if (i + 5 < wpTexts.length) {
          const wp = wpTexts[i];
          if (/^\d+$/.test(wp) || wp === '🏁') {
            waypoints.push({
              waypoint: wp === '🏁' ? '🏁' : parseInt(wp),
              time: wpTexts[i + 1],
              duration: wpTexts[i + 2],
              distance: parseFloat(wpTexts[i + 3]),
              altitude: parseFloat(wpTexts[i + 4]),
              speed: parseFloat(wpTexts[i + 5]),
            });
          }
        }
      }
      return waypoints;
    });
  }

  calculateStats(waypoints: WaypointData[]): CalculatedStats {
    const numeric = waypoints.filter((w) => typeof w.waypoint === 'number');
    const speeds = numeric.map((w) => w.speed).filter((s) => s > 0);
    const alts = numeric.map((w) => w.altitude);
    const finish = waypoints.find((w) => w.waypoint === '🏁');
    const last = numeric[numeric.length - 1];

    return {
      totalWaypoints: waypoints.length,
      maxSpeed: speeds.length ? Math.max(...speeds) : 0,
      avgSpeed: speeds.length ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0,
      maxAltitude: alts.length ? Math.max(...alts) : 0,
      avgAltitude: alts.length ? Math.round(alts.reduce((a, b) => a + b, 0) / alts.length) : 0,
      totalDistance: finish?.altitude || last?.distance || 0,
      finalDuration: finish?.duration || last?.duration || '',
    };
  }

  async validate(): Promise<TrajectoryValidationReport> {
    const summary = await this.extractSummaryData();
    const waypoints = await this.extractWaypoints();
    const calculated = this.calculateStats(waypoints);

    const validations: ValidationResult[] = [
      { name: '最高分速', expected: summary.maxSpeed, actual: calculated.maxSpeed, passed: summary.maxSpeed === calculated.maxSpeed, tolerance: '精確匹配' },
      { name: '最大高度', expected: summary.maxAltitude, actual: calculated.maxAltitude, passed: summary.maxAltitude === calculated.maxAltitude, tolerance: '精確匹配' },
    ];

    const avgSpeedDiff = Math.abs(summary.avgSpeed - calculated.avgSpeed);
    validations.push({ name: '平均分速', expected: summary.avgSpeed, actual: calculated.avgSpeed, diff: avgSpeedDiff, passed: avgSpeedDiff <= summary.avgSpeed * 0.15, tolerance: '±15%' });

    const avgAltDiff = Math.abs(summary.avgAltitude - calculated.avgAltitude);
    validations.push({ name: '平均高度', expected: summary.avgAltitude, actual: calculated.avgAltitude, diff: avgAltDiff, passed: avgAltDiff <= summary.avgAltitude * 0.10, tolerance: '±10%' });

    const passed = validations.every((v) => v.passed);

    return {
      testName: '軌跡詳情數據一致性驗證',
      timestamp: new Date().toISOString(),
      pigeonInfo: { ringNumber: summary.ringNumber, startTime: summary.startTime, endTime: summary.endTime },
      summary,
      calculated,
      validations,
      passed,
      passedCount: validations.filter((v) => v.passed).length,
      failedCount: validations.filter((v) => !v.passed).length,
      totalTests: validations.length,
    };
  }

  printReport(report: TrajectoryValidationReport): void {
    console.log('\n========================================');
    console.log('軌跡詳情數據驗證報告');
    console.log('========================================');
    console.log(`鴿子: ${report.pigeonInfo.ringNumber}`);
    console.log(`航點數: ${report.calculated.totalWaypoints}`);
    console.log('----------------------------------------');
    for (const v of report.validations) {
      const status = v.passed ? '✅' : '❌';
      const diffStr = v.diff !== undefined ? ` (差異: ${v.diff})` : '';
      console.log(`${status} ${v.name}: 期望 ${v.expected}, 實際 ${v.actual}${diffStr}`);
    }
    console.log('----------------------------------------');
    console.log(`結果: ${report.passed ? '✅ PASSED' : '❌ FAILED'} (${report.passedCount}/${report.totalTests})`);
    console.log('========================================\n');
  }
}
