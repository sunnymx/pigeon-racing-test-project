/**
 * shared/types.ts - 共用型別定義
 *
 * 職責：定義 Playwright 和 DevTools MCP 共用的資料型別
 * - 視圖模式類型
 * - 軌跡資料結構
 * - 對比指標
 */

/**
 * 視圖模式類型
 */
export type ViewMode = '2D' | '3D';

/**
 * 2D 子模式類型
 */
export type SubMode2D = 'static' | 'dynamic';

/**
 * 軌跡點資料結構
 */
export interface TrajectoryPoint {
  /** 點位索引 */
  index: number;
  /** 經度 */
  longitude?: number;
  /** 緯度 */
  latitude?: number;
  /** 時間戳 */
  timestamp?: string;
  /** 速度 (km/h) */
  speed?: number;
  /** 海拔 (m) */
  altitude?: number;
}

/**
 * 對比指標
 */
export interface ComparisonMetrics {
  /** 測試名稱 */
  testName: string;
  /** 執行時間 (ms) */
  executionTime: number;
  /** 通過狀態 */
  passed: boolean;
  /** 重試次數 */
  retries: number;
  /** 記憶體使用 (MB) */
  memoryUsage?: number;
  /** 網路請求數 */
  networkRequests?: number;
  /** 錯誤訊息 */
  error?: string;
}

/**
 * a11y 快照元素 (Chrome DevTools MCP)
 */
export interface A11yElement {
  /** 唯一識別符 */
  uid: string;
  /** 角色 */
  role: string;
  /** 名稱/文字內容 */
  name?: string;
  /** 是否可聚焦 */
  focusable?: boolean;
  /** 子元素 */
  children?: A11yElement[];
}
