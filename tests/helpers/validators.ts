/**
 * validators.ts - 數據驗證框架
 *
 * 職責：飛行數據質量保證
 * - 驗證數據範圍
 * - 檢測異常數據
 * - 驗證關係一致性
 *
 * 參考文檔：
 * - docs/guides/testing-strategies.md#data-validation
 * - docs/architecture/test-framework.md#data-validation-framework
 */

import { TrajectoryData } from './trajectory-utils';

/**
 * 驗證規則接口
 */
export interface ValidationRule {
  min: number;
  max: number;
  typical?: string;
}

/**
 * 驗證結果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: any;
}

/**
 * 飛行數據驗證規則
 *
 * 基於實際觀察的合理範圍
 */
export const FLIGHT_DATA_RULES: Record<string, ValidationRule> = {
  avgSpeed: {
    min: 800,
    max: 2000,
    typical: '1200-1500 m/Min',
  },
  maxSpeed: {
    min: 1000,
    max: 2500,
    typical: '1500-2000 m/Min',
  },
  avgAltitude: {
    min: 0,
    max: 3000,
    typical: '100-500 m',
  },
  maxAltitude: {
    min: 0,
    max: 5000,
    typical: '500-1000 m',
  },
  actualDistance: {
    min: 1,
    max: 1000,
    typical: '50-300 km',
  },
  straightDistance: {
    min: 1,
    max: 800,
    typical: '50-250 km',
  },
};

/**
 * 驗證飛行數據
 *
 * @param data - 軌跡數據
 * @returns 驗證結果
 */
export function validateFlightData(data: TrajectoryData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证必填栏位
  if (!data.ringNumber) {
    errors.push('❌ 缺少公环号');
  }

  // 验证速度
  if (!validateRange(data.avgSpeed, FLIGHT_DATA_RULES.avgSpeed)) {
    errors.push(
      `❌ 平均分速超出范围：${data.avgSpeed} (预期 ${FLIGHT_DATA_RULES.avgSpeed.min}-${FLIGHT_DATA_RULES.avgSpeed.max})`
    );
  }

  if (!validateRange(data.maxSpeed, FLIGHT_DATA_RULES.maxSpeed)) {
    errors.push(
      `❌ 最高分速超出范围：${data.maxSpeed} (预期 ${FLIGHT_DATA_RULES.maxSpeed.min}-${FLIGHT_DATA_RULES.maxSpeed.max})`
    );
  }

  // 验证高度
  if (!validateRange(data.avgAltitude, FLIGHT_DATA_RULES.avgAltitude)) {
    warnings.push(
      `⚠️ 平均高度超出常见范围：${data.avgAltitude} (常见 ${FLIGHT_DATA_RULES.avgAltitude.typical})`
    );
  }

  if (!validateRange(data.maxAltitude, FLIGHT_DATA_RULES.maxAltitude)) {
    warnings.push(
      `⚠️ 最大高度超出常见范围：${data.maxAltitude} (常见 ${FLIGHT_DATA_RULES.maxAltitude.typical})`
    );
  }

  // 验证距离
  if (!validateRange(data.actualDistance, FLIGHT_DATA_RULES.actualDistance)) {
    errors.push(
      `❌ 实际距离超出范围：${data.actualDistance} (预期 ${FLIGHT_DATA_RULES.actualDistance.min}-${FLIGHT_DATA_RULES.actualDistance.max})`
    );
  }

  if (!validateRange(data.straightDistance, FLIGHT_DATA_RULES.straightDistance)) {
    errors.push(
      `❌ 直线距离超出范围：${data.straightDistance} (预期 ${FLIGHT_DATA_RULES.straightDistance.min}-${FLIGHT_DATA_RULES.straightDistance.max})`
    );
  }

  // 验证关系一致性
  if (data.maxSpeed < data.avgSpeed) {
    errors.push(
      `❌ 逻辑错误：最高分速 (${data.maxSpeed}) < 平均分速 (${data.avgSpeed})`
    );
  }

  if (data.maxAltitude < data.avgAltitude) {
    errors.push(
      `❌ 逻辑错误：最大高度 (${data.maxAltitude}) < 平均高度 (${data.avgAltitude})`
    );
  }

  if (data.actualDistance < data.straightDistance) {
    warnings.push(
      `⚠️ 异常：实际距离 (${data.actualDistance}) < 直线距离 (${data.straightDistance})`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data,
  };
}

/**
 * 檢測異常數據
 *
 * 基於 MVP 測試發現的實際異常案例
 *
 * @param data - 軌跡數據
 * @returns 異常描述（無異常返回 null）
 */
export function detectAnomaly(data: TrajectoryData): string | null {
  // 检测超大距离异常（实际案例：46,168 km）
  if (data.actualDistance > 10000) {
    return `🚨 严重异常：实际距离 ${data.actualDistance} km（可能是数据错误）`;
  }

  // 检测超高速度异常（实际案例：106,529 m/Min）
  if (data.avgSpeed > 10000) {
    return `🚨 严重异常：平均分速 ${data.avgSpeed} m/Min（可能是单位错误）`;
  }

  // 检测零值异常
  if (data.actualDistance === 0 || data.avgSpeed === 0) {
    return `⚠️ 数据异常：关键栏位为零（可能未载入完成）`;
  }

  return null;
}

/**
 * 驗證數值範圍
 *
 * @param value - 數值
 * @param rule - 驗證規則
 * @returns 是否在範圍內
 */
function validateRange(value: number, rule: ValidationRule): boolean {
  return value >= rule.min && value <= rule.max;
}

/**
 * 驗證速度範圍
 *
 * @param speed - 速度值（m/Min）
 * @returns 是否合理
 */
export function validateSpeedRange(speed: number): boolean {
  return validateRange(speed, FLIGHT_DATA_RULES.avgSpeed);
}

/**
 * 驗證高度範圍
 *
 * @param altitude - 高度值（m）
 * @returns 是否合理
 */
export function validateAltitudeRange(altitude: number): boolean {
  return validateRange(altitude, FLIGHT_DATA_RULES.avgAltitude);
}

/**
 * 驗證距離範圍
 *
 * @param distance - 距離值（km）
 * @returns 是否合理
 */
export function validateDistanceRange(distance: number): boolean {
  return validateRange(distance, FLIGHT_DATA_RULES.actualDistance);
}

/**
 * 格式化驗證報告
 *
 * @param result - 驗證結果
 * @returns 格式化的報告字串
 */
export function formatValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('=== 数据验证报告 ===');
  lines.push(`状态：${result.isValid ? '✅ 通过' : '❌ 失败'}`);

  if (result.errors.length > 0) {
    lines.push('\n【错误】');
    result.errors.forEach((error) => lines.push(`  ${error}`));
  }

  if (result.warnings.length > 0) {
    lines.push('\n【警告】');
    result.warnings.forEach((warning) => lines.push(`  ${warning}`));
  }

  lines.push('\n【数据】');
  lines.push(`  公环号：${result.data.ringNumber}`);
  lines.push(`  平均分速：${result.data.avgSpeed} m/Min`);
  lines.push(`  最高分速：${result.data.maxSpeed} m/Min`);
  lines.push(`  平均高度：${result.data.avgAltitude} m`);
  lines.push(`  最大高度：${result.data.maxAltitude} m`);
  lines.push(`  实际距离：${result.data.actualDistance} km`);
  lines.push(`  直线距离：${result.data.straightDistance} km`);

  return lines.join('\n');
}
