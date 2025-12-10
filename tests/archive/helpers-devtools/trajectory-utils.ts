/**
 * trajectory-utils.ts - Chrome DevTools MCP 軌跡工具函數
 *
 * 職責：軌跡點互動和驗證
 * - 獲取軌跡標記點（透過 evaluate_script）
 * - 點擊軌跡點（使用完整滑鼠事件序列）
 * - 驗證軌跡數據
 *
 * 對應 Playwright 版本：tests/helpers/trajectory-utils.ts
 * API 映射參考：dev/active/devtools-mcp-comparison/api-mapping.md
 */

import {
  generateClickScript,
  generateGetCoordinatesScript,
  generateCountElementsScript,
  generateReadPopupScript,
} from './devtools-core';
import { delay } from './wait-utils';
import { TrajectoryData } from '../shared/validators';

/** 軌跡標記選擇器 */
const MARKER_SELECTOR = '.amap-icon > img';

/**
 * 軌跡點信息接口
 */
export interface TrajectoryPointInfo {
  ringNumber: string;
  time: string;
  speed: string;
  direction: string;
  altitude: string;
  rank: string;
}

/**
 * 座標資訊接口
 */
interface CoordinateInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  count: number;
}

/**
 * 軌跡工具上下文（需要 evaluate_script 支援）
 */
export interface TrajectoryContext {
  evaluateScript: (script: string) => Promise<unknown>;
  takeScreenshot?: (options?: { fullPage?: boolean }) => Promise<Buffer>;
}

/**
 * 獲取軌跡標記點數量
 *
 * @param ctx - 軌跡工具上下文
 * @returns 標記點數量
 */
export async function getTrajectoryPointsCount(ctx: TrajectoryContext): Promise<number> {
  const script = generateCountElementsScript(MARKER_SELECTOR);
  const count = await ctx.evaluateScript(script) as number;
  console.log(`[trajectory] 找到 ${count} 個軌跡標記點`);
  return count;
}

/**
 * 獲取指定索引軌跡點的座標
 *
 * @param ctx - 軌跡工具上下文
 * @param index - 標記點索引
 * @returns 座標資訊，或 null 如果不存在
 */
export async function getTrajectoryPointCoordinates(
  ctx: TrajectoryContext,
  index: number
): Promise<CoordinateInfo | null> {
  const script = generateGetCoordinatesScript(MARKER_SELECTOR, index);
  const result = await ctx.evaluateScript(script) as CoordinateInfo | null;
  return result;
}

/**
 * 點擊指定索引的軌跡標記點
 *
 * 使用完整滑鼠事件序列：mousedown → mouseup → click
 *
 * @param ctx - 軌跡工具上下文
 * @param index - 標記點索引
 */
export async function clickTrajectoryPoint(
  ctx: TrajectoryContext,
  index: number
): Promise<void> {
  console.log(`[trajectory] 點擊軌跡點 #${index}`);

  // 獲取座標
  const coords = await getTrajectoryPointCoordinates(ctx, index);

  if (!coords) {
    throw new Error(`軌跡點 #${index} 不存在`);
  }

  if (index >= coords.count) {
    throw new Error(`標記點索引 ${index} 超出範圍（共 ${coords.count} 個）`);
  }

  // 使用完整滑鼠事件序列點擊
  const clickScript = generateClickScript(coords.x, coords.y);
  const result = await ctx.evaluateScript(clickScript) as { success: boolean; error?: string };

  if (!result.success) {
    throw new Error(`點擊軌跡點失敗：${result.error}`);
  }

  await delay(500);
  console.log(`[trajectory] ✓ 已點擊軌跡點 #${index} (${coords.x}, ${coords.y})`);
}

/**
 * 讀取軌跡點彈窗信息
 *
 * @param ctx - 軌跡工具上下文
 * @returns 彈窗文字內容，或 null 如果未顯示
 */
export async function readTrajectoryPointPopup(
  ctx: TrajectoryContext
): Promise<string | null> {
  const script = generateReadPopupScript('.amap-info-content');
  const content = await ctx.evaluateScript(script) as string | null;
  return content;
}

/**
 * 驗證軌跡點信息窗格
 *
 * @param ctx - 軌跡工具上下文
 * @returns 軌跡點信息
 */
export async function verifyPointInfo(ctx: TrajectoryContext): Promise<TrajectoryPointInfo> {
  // 等待彈窗出現
  await delay(1000);

  const popupText = await readTrajectoryPointPopup(ctx);

  if (!popupText) {
    throw new Error('軌跡點信息窗格未顯示');
  }

  // 解析彈窗內容
  const pointInfo = parsePopupContent(popupText);

  if (!pointInfo.ringNumber || !pointInfo.time) {
    throw new Error('軌跡點信息不完整');
  }

  console.log('[trajectory] ✓ 軌跡點信息驗證通過', pointInfo);
  return pointInfo;
}

/**
 * 解析彈窗文字內容
 *
 * 彈窗格式：
 * 01-1740110
 * 時間：2025-11-27 08:07:07
 * 速度：1560m/min
 * 方向：西南
 * 海拔：460m
 * 名次：1
 */
function parsePopupContent(text: string): TrajectoryPointInfo {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  return {
    ringNumber: lines[0] || '',
    time: extractValue(lines, '時間') || extractValue(lines, '时间') || '',
    speed: extractValue(lines, '速度') || '',
    direction: extractValue(lines, '方向') || '',
    altitude: extractValue(lines, '海拔') || '',
    rank: extractValue(lines, '名次') || '',
  };
}

/**
 * 從行陣列中提取指定欄位的值
 */
function extractValue(lines: string[], fieldName: string): string {
  const line = lines.find(l => l.includes(fieldName));
  if (!line) return '';
  const parts = line.split(/[：:]/);
  return parts[1]?.trim() || '';
}

/**
 * 驗證軌跡渲染（檢查 Canvas 存在）
 *
 * @param ctx - 軌跡工具上下文
 * @param mode - '2D' | '3D'
 * @returns 是否渲染成功
 */
export async function verifyTrajectoryRendered(
  ctx: TrajectoryContext,
  mode: '2D' | '3D'
): Promise<boolean> {
  const selector = mode === '2D' ? 'canvas.amap-layer' : 'canvas';

  const script = `
    () => {
      const canvas = document.querySelector('${selector}');
      return canvas && canvas.width > 0 && canvas.height > 0;
    }
  `;

  const isRendered = await ctx.evaluateScript(script) as boolean;

  if (isRendered) {
    console.log(`[trajectory] ✓ ${mode} 軌跡渲染驗證通過`);
  } else {
    console.log(`[trajectory] ✗ ${mode} 軌跡渲染未就緒`);
  }

  return isRendered;
}

/**
 * 等待軌跡渲染完成
 *
 * @param ctx - 軌跡工具上下文
 * @param mode - '2D' | '3D'
 * @param timeout - 超時時間（毫秒）
 */
export async function waitForTrajectoryRender(
  ctx: TrajectoryContext,
  mode: '2D' | '3D',
  timeout: number = 10000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isRendered = await verifyTrajectoryRendered(ctx, mode);
    if (isRendered) {
      await delay(2000); // 額外等待確保渲染完成
      console.log(`[trajectory] ✓ ${mode} 軌跡渲染完成`);
      return;
    }
    await delay(500);
  }

  throw new Error(`${mode} 軌跡渲染超時`);
}

/**
 * 獲取軌跡詳情面板的航點數量
 *
 * @param ctx - 軌跡工具上下文
 * @returns 航點數量
 */
export async function getWaypointCountFromDetails(ctx: TrajectoryContext): Promise<number> {
  const script = generateCountElementsScript('.mat-ripple.row.ng-star-inserted');
  const count = await ctx.evaluateScript(script) as number;
  console.log(`[trajectory] 詳情面板顯示 ${count} 個航點`);
  return count;
}

/**
 * 提取側邊欄軌跡數據
 *
 * 對應 Playwright 版本的 verifyTrajectoryData()
 *
 * @param ctx - 軌跡工具上下文
 * @returns 軌跡數據
 */
export async function verifyTrajectoryData(ctx: TrajectoryContext): Promise<TrajectoryData> {
  // 先嘗試打開軌跡詳情面板
  const openPanelScript = `
    () => {
      const btn = document.querySelector('button[mattooltip="軌跡詳情"]');
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
      return false;
    }
  `;
  const opened = await ctx.evaluateScript(openPanelScript);
  if (opened) {
    await delay(1000);
    console.log('[trajectory] 已打開軌跡詳情面板');
  }

  // 提取所有軌跡數據
  const extractScript = `
    () => {
      const data = {
        ringNumber: '',
        startTime: '',
        endTime: '',
        duration: '',
        avgSpeed: 0,
        maxSpeed: 0,
        avgAltitude: 0,
        maxAltitude: 0,
        actualDistance: 0,
        straightDistance: 0
      };

      // 提取公环号
      const ringEl = document.querySelector('.detail-text');
      if (ringEl) {
        const match = ringEl.textContent?.match(/\\d{2}-\\d{7}/);
        if (match) data.ringNumber = match[0];
      }

      // 輔助函數：提取欄位值
      function extractField(label) {
        const elements = document.querySelectorAll('div');
        for (let i = 0; i < elements.length - 1; i++) {
          const el = elements[i];
          const text = el.textContent?.trim() || '';
          if (text.startsWith(label) && text.length < 50) {
            const next = elements[i + 1];
            if (next && !next.textContent?.includes(label)) {
              return next.textContent?.trim() || '';
            }
          }
        }
        return '';
      }

      // 提取各欄位
      data.startTime = extractField('起点时间');
      data.endTime = extractField('终点时间');
      data.duration = extractField('持续时间');
      data.avgSpeed = parseFloat(extractField('平均分速')) || 0;
      data.maxSpeed = parseFloat(extractField('最高分速')) || 0;
      data.avgAltitude = parseFloat(extractField('平均高度')) || 0;
      data.maxAltitude = parseFloat(extractField('最大高度')) || 0;
      data.actualDistance = parseFloat(extractField('实际距离')) || 0;
      data.straightDistance = parseFloat(extractField('直线距离')) || 0;

      return data;
    }
  `;

  const trajectoryData = await ctx.evaluateScript(extractScript) as TrajectoryData;

  console.log('[trajectory] ✓ 軌跡數據提取完成', trajectoryData);
  return trajectoryData;
}
