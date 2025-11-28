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
