# DevTools MCP Helpers

Chrome DevTools MCP 版本的測試輔助函數。

## 模組列表

### devtools-core.ts (已完成)
核心工具函數，提供：
- `parseSnapshot()` - 解析 a11y 快照
- `findElementByRole()` - 按角色尋找元素
- `findElementByText()` - 按文字尋找元素
- `findAllElementsByRole()` - 尋找所有匹配角色的元素
- `hasElement()` - 檢查元素是否存在
- `getElementText()` - 提取元素文字內容

## 使用範例

```typescript
import { findElementByRole, hasElement } from './devtools-core';

// 假設已透過 mcp__chrome-devtools__take_snapshot 取得快照
const snapshot = "...";

// 尋找第一個「進入」按鈕
const enterButtonUid = findElementByRole(snapshot, 'button', /進入/);

// 檢查是否有表格
const hasTable = hasElement(snapshot, 'table');
```

## 待實作模組

依照 implementation-plan.md Phase 2：
1. navigation.ts (~180 行)
2. wait-utils.ts (~200 行)
3. mode-switching.ts (~250 行)
4. trajectory-utils.ts (~280 行)
5. trajectory-reload.ts (~180 行)
6. loft-list.ts (~200 行)
