# Playwright → Chrome DevTools MCP API 映射

**建立日期**: 2025-11-28

---

## 1. 核心 API 對照表

| Playwright API | DevTools MCP 工具 | 備註 |
|----------------|-------------------|------|
| `page.goto(url)` | `navigate_page` | 使用 `type: 'navigate'` 參數 |
| `page.click(selector)` | `take_snapshot` + `click` | 需先取得元素 `uid` |
| `element.fill(text)` | `take_snapshot` + `fill` | 需先取得元素 `uid` |
| `page.waitForSelector()` | `take_snapshot` 輪詢 | 檢查快照中是否存在元素 |
| `page.waitForTimeout(ms)` | 原生延遲 | 無直接對應 |
| `page.getByRole()` | `take_snapshot` | 解析 a11y 樹尋找角色 |
| `page.locator()` | `take_snapshot` | 解析快照尋找選擇器 |
| `page.screenshot()` | `take_screenshot` | 直接對應 |
| `expect().toBeVisible()` | `take_snapshot` | 檢查元素是否存在 |
| `page.evaluate()` | `evaluate_script` | 直接對應 |
| `page.waitForResponse()` | `list_network_requests` | 輪詢檢查回應 |
| `page.on('console')` | `list_console_messages` | 執行後查詢 |

---

## 2. DevTools MCP 獨特功能

### 效能追蹤 (Playwright 無法做到)
```
performance_start_trace  → 開始效能追蹤
performance_stop_trace   → 停止並取得追蹤結果
performance_analyze_insight → 分析效能洞察
```

### 網路請求詳情 (比 Playwright 更詳細)
```
list_network_requests → 列出所有網路請求
get_network_request   → 取得特定請求詳情（含 headers、body）
```

---

## 3. DevTools MCP 完整工具清單 (26 個)

### 輸入自動化 (8 個)
| 工具 | 說明 |
|------|------|
| `click` | 點擊元素 |
| `drag` | 拖曳元素 |
| `fill` | 填入文字 |
| `fill_form` | 填入表單 |
| `handle_dialog` | 處理對話框 |
| `hover` | 懸停元素 |
| `press_key` | 按下按鍵 |
| `upload_file` | 上傳檔案 |

### 導航 (6 個)
| 工具 | 說明 |
|------|------|
| `close_page` | 關閉頁面 |
| `list_pages` | 列出頁面 |
| `navigate_page` | 導航頁面 |
| `new_page` | 新開頁面 |
| `select_page` | 選擇頁面 |
| `wait_for` | 等待條件 |

### 模擬 (2 個)
| 工具 | 說明 |
|------|------|
| `emulate` | 模擬裝置 |
| `resize_page` | 調整大小 |

### 效能 (3 個)
| 工具 | 說明 |
|------|------|
| `performance_start_trace` | 開始追蹤 |
| `performance_stop_trace` | 停止追蹤 |
| `performance_analyze_insight` | 分析洞察 |

### 網路 (2 個)
| 工具 | 說明 |
|------|------|
| `list_network_requests` | 列出請求 |
| `get_network_request` | 取得請求詳情 |

### 偵錯 (5 個)
| 工具 | 說明 |
|------|------|
| `evaluate_script` | 執行腳本 |
| `get_console_message` | 取得控制台訊息 |
| `list_console_messages` | 列出控制台訊息 |
| `take_screenshot` | 截圖 |
| `take_snapshot` | 取得 a11y 快照 |

---

## 4. Helper 模組映射

### navigation.ts

| Playwright 函數 | DevTools 實作 |
|-----------------|---------------|
| `enterRace(page, index)` | `navigate_page` + `take_snapshot` + `click` |
| `selectPigeon(page, index)` | `take_snapshot` + 找到 checkbox uid + `click` |
| `openTrajectory(page)` | `take_snapshot` + 找到按鈕 uid + `click` + `wait_for` |
| `getCurrentMode(page)` | `take_snapshot` + 解析模式指示元素 |
| `setPreferredMode(page, mode)` | `take_snapshot` + `click` |

**關鍵差異**: DevTools 需要在每次互動前明確取得快照以獲取元素 `uid`。

### mode-switching.ts

| Playwright 函數 | DevTools 實作 |
|-----------------|---------------|
| `ensureModeByText(page, mode)` | `take_snapshot` + 解析按鈕文字 + 條件 `click` |
| `switchTo2DReliably(page)` | 呼叫 `ensureModeByText` with '2D' |
| `switchTo3DReliably(page)` | 呼叫 `ensureModeByText` with '3D' + 等待迴圈 |
| `detectCurrentViewMode(page)` | `take_snapshot` + 檢查模式特定元素 |
| `switchSubMode2D(page, subMode)` | `take_snapshot` + `click` timeline 按鈕 |

**關鍵差異**: 模式偵測依賴 a11y 樹解析而非 DOM 查詢。

### wait-utils.ts

| Playwright 函數 | DevTools 實作 |
|-----------------|---------------|
| `waitForMapTiles(page)` | `take_snapshot` 迴圈 + 檢查 canvas |
| `waitForCesium3D(page)` | `take_snapshot` 迴圈 + 檢查 3D 控制項 |
| `waitForTrajectoryData(page)` | `list_network_requests` + 過濾 API |
| `waitForModeSwitch(page, mode)` | `take_snapshot` 迴圈 + 模式偵測 |

**關鍵優勢**: `list_network_requests` 比 Playwright 的回應攔截更好監控 API。

### trajectory-utils.ts

| Playwright 函數 | DevTools 實作 |
|-----------------|---------------|
| `getTrajectoryPoints(page)` | `take_snapshot` + 過濾 `.amap-icon > img` |
| `getTrajectoryPointsCount(page)` | `take_snapshot` + 計數匹配元素 |
| `clickTrajectoryPoint(page, idx)` | `take_snapshot` + 取得 uid + `click` |
| `verifyPointInfo(page)` | `take_snapshot` + 解析資訊面板內容 |
| `verifyTrajectoryData(page)` | `take_snapshot` + 解析側邊欄數據 |

**關鍵挑戰**: Canvas 元素可能不在 a11y 樹中 - 可能需要 `evaluate_script`。

---

## 5. 核心工具類別設計

```typescript
// devtools-core.ts 介面設計

interface DevToolsCore {
  // 元素定位
  findElementByRole(snapshot: Snapshot, role: string, name?: RegExp): Element | null;
  findElementBySelector(snapshot: Snapshot, selector: string): Element | null;
  findElementsBySelector(snapshot: Snapshot, selector: string): Element[];

  // 等待模式
  waitForElement(role: string, name?: RegExp, timeout?: number): Promise<Element>;
  waitForText(text: string, timeout?: number): Promise<void>;
  waitForNetworkIdle(timeout?: number): Promise<void>;

  // 快照輔助
  takeSnapshot(): Promise<Snapshot>;
  parseSnapshotForContent(snapshot: Snapshot, pattern: RegExp): string | null;

  // 效能整合 (DevTools 獨特優勢)
  startPerformanceTrace(): Promise<void>;
  stopPerformanceTrace(): Promise<TraceResult>;

  // 網路整合 (DevTools 獨特優勢)
  getApiResponse(urlPattern: string): Promise<NetworkResponse | null>;
  waitForApiResponse(urlPattern: string, timeout?: number): Promise<NetworkResponse>;
}
```

---

## 6. 選擇器策略差異

### Playwright 方式
```typescript
// 直接 CSS 選擇器
await page.locator('.amap-icon > img').count();

// 角色選擇器
await page.getByRole('button', { name: /3D模式/ });
```

### DevTools MCP 方式
```typescript
// 先取得快照
const snapshot = await take_snapshot();

// 解析快照尋找元素
const element = findElementByRole(snapshot, 'button', /3D模式/);

// 使用 uid 互動
await click({ uid: element.uid });
```

**核心差異**: DevTools 需要明確的「快照 → 解析 → 互動」流程。
