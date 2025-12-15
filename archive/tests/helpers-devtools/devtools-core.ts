/**
 * devtools-core.ts - Chrome DevTools MCP 核心工具
 *
 * 職責：提供 DevTools MCP 的基礎操作封裝
 * - a11y 快照解析
 * - 元素查找（按角色、文字、選擇器）
 * - 等待邏輯
 * - 效能和網路監控輔助
 *
 * 參考：
 * - api-mapping.md - API 映射文檔
 * - tests/helpers/navigation.ts - Playwright 實作參考
 */

/**
 * a11y 快照中的元素表示
 */
interface SnapshotElement {
  uid: string;
  role: string;
  name?: string;
  value?: string;
  description?: string;
  focusable?: boolean;
  focused?: boolean;
  children?: SnapshotElement[];
}

/**
 * 解析 a11y 快照文字為結構化資料
 *
 * @param snapshotText - take_snapshot 返回的文字內容
 * @returns 解析後的根元素
 */
export function parseSnapshot(snapshotText: string): SnapshotElement | null {
  // 簡化實作：將快照文字轉為可查詢的結構
  // 完整實作需要解析樹狀結構
  const lines = snapshotText.split('\n');
  const elements: SnapshotElement[] = [];

  for (const line of lines) {
    const uidMatch = line.match(/uid=(\S+)/);
    const roleMatch = line.match(/uid=\S+\s+(\w+)/);
    const nameMatch = line.match(/"([^"]+)"/);

    if (uidMatch && roleMatch) {
      elements.push({
        uid: uidMatch[1],
        role: roleMatch[1],
        name: nameMatch ? nameMatch[1] : undefined,
      });
    }
  }

  return elements.length > 0 ? elements[0] : null;
}

/**
 * 從快照中尋找指定角色的元素
 *
 * @param snapshotText - take_snapshot 返回的文字內容
 * @param role - 元素角色 (button, textbox, link 等)
 * @param namePattern - 可選的名稱匹配模式
 * @returns 符合條件的元素 uid，找不到則返回 null
 */
export function findElementByRole(
  snapshotText: string,
  role: string,
  namePattern?: RegExp | string
): string | null {
  const lines = snapshotText.split('\n');

  for (const line of lines) {
    // 檢查角色是否匹配
    const roleRegex = new RegExp(`uid=(\\S+)\\s+${role}\\b`);
    const roleMatch = line.match(roleRegex);

    if (!roleMatch) continue;

    const uid = roleMatch[1];

    // 如果沒有指定名稱模式，直接返回第一個匹配的角色
    if (!namePattern) return uid;

    // 檢查名稱是否匹配
    const nameMatch = line.match(/"([^"]+)"/);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const pattern = namePattern instanceof RegExp ? namePattern : new RegExp(namePattern);

    if (pattern.test(name)) {
      return uid;
    }
  }

  return null;
}

/**
 * 從快照中尋找包含指定文字的元素
 *
 * @param snapshotText - take_snapshot 返回的文字內容
 * @param textPattern - 文字匹配模式
 * @returns 符合條件的元素 uid，找不到則返回 null
 */
export function findElementByText(
  snapshotText: string,
  textPattern: RegExp | string
): string | null {
  const lines = snapshotText.split('\n');
  const pattern = textPattern instanceof RegExp ? textPattern : new RegExp(textPattern);

  for (const line of lines) {
    const uidMatch = line.match(/uid=(\S+)/);
    const textMatch = line.match(/"([^"]+)"/);

    if (uidMatch && textMatch && pattern.test(textMatch[1])) {
      return uidMatch[1];
    }
  }

  return null;
}

/**
 * 從快照中尋找所有匹配角色的元素
 *
 * @param snapshotText - take_snapshot 返回的文字內容
 * @param role - 元素角色
 * @returns 所有符合條件的元素 uid 陣列
 */
export function findAllElementsByRole(
  snapshotText: string,
  role: string
): string[] {
  const lines = snapshotText.split('\n');
  const uids: string[] = [];
  const roleRegex = new RegExp(`uid=(\\S+)\\s+${role}\\b`);

  for (const line of lines) {
    const match = line.match(roleRegex);
    if (match) {
      uids.push(match[1]);
    }
  }

  return uids;
}

/**
 * 檢查快照中是否存在指定元素
 *
 * @param snapshotText - take_snapshot 返回的文字內容
 * @param role - 元素角色
 * @param namePattern - 可選的名稱匹配模式
 * @returns 元素是否存在
 */
export function hasElement(
  snapshotText: string,
  role: string,
  namePattern?: RegExp | string
): boolean {
  return findElementByRole(snapshotText, role, namePattern) !== null;
}

/**
 * 從快照中提取元素的文字內容
 *
 * @param snapshotText - take_snapshot 返回的文字內容
 * @param uid - 元素 uid
 * @returns 元素的文字內容，找不到則返回 null
 */
export function getElementText(
  snapshotText: string,
  uid: string
): string | null {
  const lines = snapshotText.split('\n');

  for (const line of lines) {
    if (line.includes(`uid=${uid}`)) {
      const textMatch = line.match(/"([^"]+)"/);
      return textMatch ? textMatch[1] : null;
    }
  }

  return null;
}

// ============================================================================
// Canvas 操作函數（用於 a11y 樹外的元素）
// ============================================================================

/**
 * 生成點擊座標的 JavaScript 腳本
 *
 * 使用完整滑鼠事件序列：mousedown → mouseup → click
 * 這是 Phase 1 驗證中確認有效的方案
 *
 * @param x - 點擊 X 座標
 * @param y - 點擊 Y 座標
 * @returns 可在 evaluate_script 中執行的腳本
 */
export function generateClickScript(x: number, y: number): string {
  return `
    () => {
      const element = document.elementFromPoint(${x}, ${y});
      if (!element) return { success: false, error: 'No element at coordinates' };

      const events = ['mousedown', 'mouseup', 'click'];
      events.forEach(eventType => {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: ${x},
          clientY: ${y},
          button: 0,
          buttons: 1
        });
        element.dispatchEvent(event);
      });

      return { success: true, tagName: element.tagName };
    }
  `;
}

/**
 * 生成查詢 DOM 元素座標的 JavaScript 腳本
 *
 * @param selector - CSS 選擇器
 * @param index - 元素索引（預設 0）
 * @returns 可在 evaluate_script 中執行的腳本
 */
export function generateGetCoordinatesScript(selector: string, index: number = 0): string {
  return `
    () => {
      const elements = document.querySelectorAll('${selector}');
      if (elements.length === 0) return null;
      if (${index} >= elements.length) return null;

      const el = elements[${index}];
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
        count: elements.length
      };
    }
  `;
}

/**
 * 生成查詢 DOM 元素數量的 JavaScript 腳本
 *
 * @param selector - CSS 選擇器
 * @returns 可在 evaluate_script 中執行的腳本
 */
export function generateCountElementsScript(selector: string): string {
  return `
    () => document.querySelectorAll('${selector}').length
  `;
}

/**
 * 生成讀取彈窗內容的 JavaScript 腳本
 *
 * @param selector - 彈窗內容選擇器（預設 .amap-info-content）
 * @returns 可在 evaluate_script 中執行的腳本
 */
export function generateReadPopupScript(selector: string = '.amap-info-content'): string {
  return `
    () => {
      const popup = document.querySelector('${selector}');
      return popup ? popup.innerText : null;
    }
  `;
}
