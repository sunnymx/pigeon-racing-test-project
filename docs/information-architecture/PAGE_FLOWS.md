# 頁面導航流程

**專案**：鴿子競賽 GPS 追蹤系統
**最後更新**：2025-11-18
**版本**：1.0

---

## 📖 目的

本文檔描述鴿子競賽 GPS 追蹤系統的頁面間導航流程和狀態轉換，包括：
- 完整的頁面轉換流程圖
- 關鍵決策點和分支條件
- 頁面狀態管理
- 錯誤處理和回退流程
- 導航模式（前進/後退）

此文檔為：
- 測試自動化提供導航路徑
- 用戶體驗設計提供流程參考
- 開發團隊提供狀態管理指導
- 問題排查提供流程依據

---

## 🗺️ 整體頁面流程圖

### 主流程（Happy Path）

```mermaid
graph TD
    Start([用戶訪問網站]) --> Home[首頁<br/>賽事列表]

    Home --> RaceDetail[賽事詳情頁<br/>鴿子列表]

    RaceDetail --> Decision1{用戶選擇標籤}
    Decision1 -->|預設| RankingTab[名次&環號搜尋標籤]
    Decision1 -->|切換| LoftTab[鴿舍列表標籤]

    RankingTab --> SelectPigeon1[選擇鴿子<br/>勾選 checkbox]
    LoftTab --> SelectPigeon2[選擇鴿子<br/>勾選 checkbox]

    SelectPigeon1 --> CheckMode[檢查模式按鈕文字]
    SelectPigeon2 --> CheckMode

    CheckMode --> Decision2{按鈕顯示什麼？}
    Decision2 -->|顯示「3D」| Enter3D[點擊「查看軌跡」<br/>進入 3D 模式]
    Decision2 -->|顯示「2D」| Enter2D[點擊「查看軌跡」<br/>進入 2D 模式]

    Enter3D --> View3D[3D 軌跡查看頁面<br/>Cesium 地球]
    Enter2D --> View2D[2D 軌跡查看頁面<br/>AMap 地圖]

    View3D --> Action3D{用戶操作}
    Action3D -->|點擊「2D模式」| Switch2D[切換到 2D]
    Action3D -->|點擊菜單| BackToDetail1[返回賽事詳情]

    View2D --> Action2D{用戶操作}
    Action2D -->|點擊「動畫播放」| PlayMode[動態播放模式]
    Action2D -->|點擊「3D模式」| Switch3D[切換到 3D]
    Action2D -->|點擊菜單| BackToDetail2[返回賽事詳情]

    PlayMode --> Action2DPlay{用戶操作}
    Action2DPlay -->|點擊「靜態顯示」| View2D
    Action2DPlay -->|點擊「3D模式」| Switch3D
    Action2DPlay -->|點擊菜單| BackToDetail3[返回賽事詳情]

    Switch2D --> View2D
    Switch3D --> View3D

    BackToDetail1 --> RaceDetail
    BackToDetail2 --> RaceDetail
    BackToDetail3 --> RaceDetail

    RaceDetail --> Decision3{用戶操作}
    Decision3 -->|點擊「退出賽事」| Home
    Decision3 -->|選擇其他鴿子| SelectPigeon1

    Home --> End([結束或繼續瀏覽])

    style Decision2 fill:#ff6b6b,stroke:#c92a2a,stroke-width:3px
    style CheckMode fill:#ffd43b,stroke:#f59f00,stroke-width:2px
```

---

## 🚦 關鍵決策點

### 決策點 1：模式按鈕文字判斷（最關鍵）

**位置**：賽事詳情頁 → 軌跡查看頁面之間

**決策依據**：模式按鈕顯示的文字內容

**流程圖**：

```mermaid
graph TD
    A[用戶選擇鴿子] --> B[查看模式按鈕]
    B --> C{按鈕顯示什麼文字？}

    C -->|「3D」| D[按鈕含義：<br/>當前在 2D，<br/>點擊切換到 3D]
    C -->|「2D」| E[按鈕含義：<br/>當前在 3D，<br/>點擊切換到 2D]

    D --> F[用戶點擊「查看軌跡」]
    E --> G[用戶點擊「查看軌跡」]

    F --> H[系統進入 3D 模式<br/>Cesium 渲染]
    G --> I[系統進入 2D 模式<br/>AMap 渲染]

    H --> J[3D 軌跡查看頁面]
    I --> K[2D 軌跡查看頁面]

    style C fill:#ff6b6b,stroke:#c92a2a,stroke-width:4px
    style D fill:#ffd43b,stroke:#f59f00,stroke-width:2px
    style E fill:#ffd43b,stroke:#f59f00,stroke-width:2px
```

**實作關鍵**：

```typescript
// ⚠️ 錯誤方法（常見錯誤）
const checkbox = page.getByRole('checkbox', { name: /2D|3D/ });
const isChecked = await checkbox.isChecked();  // ❌ 不可靠！

// ✓ 正確方法
const button = page.getByRole('button', { name: /2D|3D/ });
const buttonText = await button.textContent();  // ✓ 讀取文字

if (buttonText.includes('3D')) {
  // 按鈕顯示「3D」→ 將進入 3D 模式
  await page.getByRole('button', { name: '查看軌跡' }).click();
  // 等待 Cesium 初始化...
} else {
  // 按鈕顯示「2D」→ 將進入 2D 模式
  await page.getByRole('button', { name: '查看軌跡' }).click();
  // 等待 AMap 初始化...
}
```

**常見錯誤**：
- ❌ 使用 checkbox 狀態判斷
- ❌ 假設按鈕文字表示「當前」模式
- ❌ 未先讀取文字就點擊

**正確理解**：
- ✅ 按鈕文字指示「目標」模式（即將進入的模式）
- ✅ 先讀取文字，再決定後續操作
- ✅ 驗證進入的模式是否符合預期

📖 詳細指南：[Mode Switching Guide](../guides/mode-switching.md)

---

### 決策點 2：標籤頁選擇

**位置**：賽事詳情頁內部

**決策依據**：用戶點擊的標籤

**流程圖**：

```mermaid
graph LR
    A[賽事詳情頁] --> B{用戶點擊標籤}
    B -->|預設/點擊「名次&環號搜尋」| C[名次&環號搜尋標籤]
    B -->|點擊「鴿舍列表」| D[鴿舍列表標籤]

    C --> E[顯示所有鴿子<br/>按排名排序]
    C --> F[環號搜尋功能]
    C --> G[名次查詢功能]

    D --> H[選擇鴿舍下拉選單]
    D --> I[鴿舍內環號搜尋]
    H --> J[顯示該鴿舍的鴿子]
```

**狀態管理**：
```typescript
interface RaceDetailState {
  currentTab: 'ranking' | 'loft';      // 當前標籤
  selectedPigeons: string[];           // 已選鴿子的環號列表
  selectedLoft?: string;               // 選中的鴿舍（僅鴿舍列表標籤）
}
```

---

### 決策點 3：2D 模式內部切換

**位置**：2D 軌跡查看頁面

**決策依據**：用戶點擊靜態/動態按鈕

**流程圖**：

```mermaid
graph TD
    A[進入 2D 模式<br/>預設：靜態模式] --> B{用戶操作}

    B -->|點擊「動畫播放」| C[切換到動態模式]
    B -->|點擊「靜態顯示」| A

    C --> D[動態播放模式<br/>1-3 個動態標記]
    D --> E{用戶操作}

    E -->|點擊「靜態顯示」| F[切換到靜態模式]
    E -->|點擊「動畫播放」| D

    F --> A

    A --> G[靜態模式<br/>15-20 個標記]
    G --> B

    style A fill:#69db7c,stroke:#37b24d,stroke-width:2px
    style D fill:#ffd43b,stroke:#f59f00,stroke-width:2px
```

**模式識別**：
```typescript
// 方法1: 通過標記點數量判斷
async function detect2DMode(page: Page): Promise<'static' | 'dynamic'> {
  const markerCount = await page.locator('.amap-marker').count();

  if (markerCount >= 15) {
    return 'static';   // 靜態模式：15-20 個標記
  } else {
    return 'dynamic';  // 動態模式：1-3 個標記
  }
}

// 方法2: 檢查播放控制按鈕狀態
async function detect2DMode(page: Page): Promise<'static' | 'dynamic'> {
  const hasPlayButton = await page.getByRole('button', { name: '播放' }).isVisible();

  if (hasPlayButton) {
    return 'dynamic';
  } else {
    return 'static';
  }
}
```

📖 詳細問題：[Known Issues #2](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-2-靜態動態模式混淆)

---

### 決策點 4：模式間切換（2D ↔ 3D）

**位置**：軌跡查看頁面

**決策依據**：用戶點擊模式切換按鈕

**流程圖**：

```mermaid
graph LR
    A[2D 模式<br/>AMap] -->|點擊「3D模式」| B[切換到 3D]
    B --> C[3D 模式<br/>Cesium]
    C -->|點擊「2D模式」| D[切換到 2D]
    D --> A

    B --> E[等待 Cesium 載入<br/>3-5 秒]
    E --> C

    D --> F[等待 AMap 載入<br/>2-3 秒]
    F --> A
```

**等待策略**：
```typescript
async function switchTo3D(page: Page): Promise<void> {
  // 1. 點擊 3D 模式按鈕
  await page.getByRole('button', { name: /3D模式/ }).click();

  // 2. 等待 Cesium 初始化
  await page.waitForFunction(() => window.Cesium !== undefined);
  await page.waitForFunction(() => window.viewer !== undefined);

  // 3. 等待地球瓦片載入
  await page.waitForFunction(() => {
    return window.viewer?.scene.globe.tilesLoaded === true;
  }, { timeout: 15000 });

  // 4. 額外等待確保穩定
  await page.waitForTimeout(3000);

  console.log('✓ 已切換到 3D 模式');
}

async function switchTo2D(page: Page): Promise<void> {
  // 1. 點擊 2D 模式按鈕
  await page.getByRole('button', { name: /2D模式/ }).click();

  // 2. 等待 AMap 容器出現
  await page.waitForSelector('.amap-container', { state: 'visible' });

  // 3. 等待地圖瓦片載入
  await page.waitForFunction((minTiles) => {
    const tiles = document.querySelectorAll('.amap-container img');
    return tiles.length >= minTiles;
  }, 50);

  // 4. 額外等待確保穩定
  await page.waitForTimeout(2000);

  console.log('✓ 已切換到 2D 模式');
}
```

---

## 🔙 回退和返回流程

### 返回路徑總覽

```mermaid
graph TD
    A[首頁] --> B[賽事詳情頁]
    B --> C[2D 軌跡查看]
    B --> D[3D 軌跡查看]
    C --> E[2D 動態播放]

    E -->|點擊菜單| B
    C -->|點擊菜單| B
    D -->|點擊菜單| B
    B -->|點擊「退出賽事」| A

    style B fill:#ffd43b,stroke:#f59f00,stroke-width:2px
```

### 返回機制

#### 方法 1：菜單按鈕返回

**觸發位置**：軌跡查看頁面（2D/3D）

**操作元素**：
- 左上角的 hamburger menu 按鈕
- 或明確的「返回」按鈕

**實作**：
```typescript
async function returnToRaceDetail(page: Page): Promise<void> {
  // 點擊菜單按鈕
  await page.getByRole('button', { name: 'menu' }).click();

  // 等待頁面轉換
  await page.waitForLoadState('networkidle');

  // 驗證返回到賽事詳情頁
  await expect(page.getByRole('button', { name: '查看軌跡' })).toBeVisible();
}
```

#### 方法 2：退出賽事按鈕

**觸發位置**：賽事詳情頁

**操作元素**：「退出賽事」按鈕

**實作**：
```typescript
async function returnToHomepage(page: Page): Promise<void> {
  // 點擊退出賽事按鈕
  await page.getByRole('button', { name: '退出賽事' }).click();

  // 等待頁面轉換
  await page.waitForLoadState('networkidle');

  // 驗證返回首頁
  await expect(page.locator('.race-card').first()).toBeVisible();
}
```

---

## 🌐 狀態管理

### 應用狀態結構

```typescript
interface ApplicationState {
  // 頁面狀態
  currentPage: 'home' | 'raceDetail' | 'trajectoryView';

  // 賽事狀態
  selectedRace: {
    raceID: string;
    raceName: string;
  } | null;

  // 鴿子選擇狀態
  selectedPigeons: {
    ringNumbers: string[];
    count: number;
  };

  // 軌跡查看狀態
  trajectoryView: {
    mode: '2D-static' | '2D-dynamic' | '3D';
    isPlaying: boolean;       // 僅動態模式
    currentTime: number;      // 播放時間點
  } | null;

  // UI 狀態
  ui: {
    currentTab: 'ranking' | 'loft';          // 賽事詳情頁標籤
    selectedLoft?: string;                   // 鴿舍列表中選中的鴿舍
    isRankingPanelVisible: boolean;          // 排名榜顯示狀態
    isSpeedometerVisible: boolean;           // 時速表顯示狀態
  };
}
```

### 狀態轉換圖

```mermaid
stateDiagram-v2
    [*] --> Home: 訪問網站

    Home --> RaceDetail: 點擊「進入」
    RaceDetail --> Home: 點擊「退出賽事」

    RaceDetail --> Trajectory2DStatic: 點擊「查看軌跡」(按鈕顯示「2D」)
    RaceDetail --> Trajectory3D: 點擊「查看軌跡」(按鈕顯示「3D」)

    Trajectory2DStatic --> Trajectory2DDynamic: 點擊「動畫播放」
    Trajectory2DDynamic --> Trajectory2DStatic: 點擊「靜態顯示」

    Trajectory2DStatic --> Trajectory3D: 點擊「3D模式」
    Trajectory2DDynamic --> Trajectory3D: 點擊「3D模式」
    Trajectory3D --> Trajectory2DStatic: 點擊「2D模式」

    Trajectory2DStatic --> RaceDetail: 點擊菜單
    Trajectory2DDynamic --> RaceDetail: 點擊菜單
    Trajectory3D --> RaceDetail: 點擊菜單

    RaceDetail --> [*]: 關閉瀏覽器
    Home --> [*]: 關閉瀏覽器
```

---

## ⚠️ 錯誤處理流程

### 錯誤場景 1：2D 軌跡初次載入失敗

**問題**：直接進入 2D 模式時，軌跡渲染失敗

**錯誤流程**：
```
用戶點擊「查看軌跡」(2D)
  → API 調用 /ugetPigeonAllJsonInfo
  → 返回 { gpx2d: undefined }
  → AMap 渲染失敗
  → 用戶看到空白地圖
```

**解決流程**：
```mermaid
graph TD
    A[檢測 2D 載入失敗] --> B{是首次載入?}
    B -->|是| C[自動切換到 3D]
    B -->|否| D[顯示錯誤訊息]

    C --> E[等待 3D 載入成功]
    E --> F[自動切換回 2D]
    F --> G[2D 載入成功]

    D --> H[提示用戶重試]
    H --> I[手動切換到 3D]
    I --> E
```

**實作**：
```typescript
async function enter2DReliably(page: Page): Promise<void> {
  try {
    // 嘗試直接進入 2D
    await enter2DMode(page);
    await waitFor2DRender(page);

  } catch (error) {
    console.warn('2D 初次載入失敗，使用 3D→2D 序列');

    // 回退到 3D→2D 序列
    await enter3DMode(page);
    await waitFor3DRender(page);
    await switchTo2D(page);

    console.log('✓ 2D 載入成功（通過 3D→2D）');
  }
}
```

📖 詳細解決方案：[Known Issues #1](../test-plan/KNOWN_ISSUES_SOLUTIONS.md#問題-1-2d軌跡初次加載失敗)

### 錯誤場景 2：API 調用失敗

**錯誤流程**：
```mermaid
graph TD
    A[用戶操作] --> B[發送 API 請求]
    B --> C{響應狀態}
    C -->|200 OK| D[正常處理]
    C -->|404 Not Found| E[顯示「資源不存在」]
    C -->|500 Server Error| F[重試機制]
    C -->|超時| G[顯示「載入超時」]

    F --> H{重試次數}
    H -->|< 3 次| B
    H -->|>= 3 次| I[顯示錯誤並允許手動重試]

    E --> J[返回上一頁或首頁]
    G --> K[提供重新載入選項]
    I --> K
```

---

## 📊 導航模式統計

### 常見導航路徑

| 路徑 | 頻率 | 平均時間 | 步驟數 |
|------|------|----------|--------|
| 首頁 → 2D 查看 | 高 | 30-40秒 | 4 |
| 首頁 → 3D 查看 | 中 | 35-45秒 | 4 |
| 2D ↔ 3D 切換 | 中 | 5-8秒 | 1 |
| 2D 靜態 ↔ 動態 | 高 | 2-3秒 | 1 |
| 軌跡查看 → 首頁 | 中 | 2-3秒 | 2 |

### 導航步驟詳細時間

```mermaid
gantt
    title 首頁到2D軌跡查看完整時序
    dateFormat X
    axisFormat %Ls

    section 頁面載入
    首頁載入              :0, 2000

    section 用戶操作
    選擇賽事              :2000, 5000
    選擇鴿子              :7000, 3000
    點擊查看軌跡          :10000, 0

    section API&渲染
    賽事列表API           :1000, 1000
    排名資訊API           :5500, 800
    軌跡數據API           :10000, 2000
    地圖渲染              :12000, 3000

    section 完成
    可開始互動            :15000, 0
```

---

## 🧪 測試導航策略

### 順序測試

按用戶最可能的操作順序測試：

```typescript
describe('用戶導航流程測試', () => {
  test('完整的查看軌跡流程', async ({ page }) => {
    // 1. 訪問首頁
    await page.goto('https://skyracing.com.cn/');
    await expect(page.locator('.race-card').first()).toBeVisible();

    // 2. 進入賽事詳情
    await page.locator('.race-card').first().getByRole('button', { name: '進入' }).click();
    await expect(page.getByRole('button', { name: '查看軌跡' })).toBeVisible();

    // 3. 選擇鴿子
    await page.locator('input[type="checkbox"]').first().click();
    await expect(page.getByRole('button', { name: '查看軌跡' })).toBeEnabled();

    // 4. 檢查模式並進入
    const modeButton = page.getByRole('button', { name: /2D|3D/ });
    const buttonText = await modeButton.textContent();

    await page.getByRole('button', { name: '查看軌跡' }).click();

    // 5. 驗證進入的模式
    if (buttonText.includes('3D')) {
      await expect(page.getByRole('button', { name: '視角1' })).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: 'view_in_ar 3D模式' })).toBeVisible();
    }
  });
});
```

### 回退測試

確保所有返回路徑正常工作：

```typescript
test('軌跡查看返回流程', async ({ page }) => {
  // 1. 到達軌跡查看頁面
  // ... (省略前置步驟)

  // 2. 點擊返回
  await page.getByRole('button', { name: 'menu' }).click();

  // 3. 驗證返回到賽事詳情
  await expect(page.getByRole('button', { name: '查看軌跡' })).toBeVisible();
  await expect(page.getByRole('button', { name: '退出賽事' })).toBeVisible();

  // 4. 退出賽事
  await page.getByRole('button', { name: '退出賽事' }).click();

  // 5. 驗證返回首頁
  await expect(page.locator('.race-card').first()).toBeVisible();
});
```

---

## 🔗 相關文檔

### 架構相關
- [Site Map](SITE_MAP.md) - 完整頁面結構地圖
- [System Architecture](../technical-architecture/SYSTEM_ARCHITECTURE.md) - 系統架構總覽

### 用戶研究
- [User Journeys](../user-research/USER_JOURNEYS.md) - 用戶旅程地圖（含決策點分析）
- [User Personas](../user-research/USER_PERSONAS.md) - 用戶角色定義

### 測試相關
- [Test Cases](../test-plan/TEST_CASES.md) - 35+ 詳細測試案例（含導航測試）
- [User Journey Test Mapping](../test-coverage/USER_JOURNEY_TEST_MAPPING.md) - 旅程-測試映射

### 指南相關
- [Mode Switching Guide](../guides/mode-switching.md) - 2D/3D 模式切換深入指南
- [Troubleshooting Guide](../guides/troubleshooting.md) - 導航相關問題排解
- [Testing Strategies](../guides/testing-strategies.md) - 導航測試策略

---

## 📝 設計建議

基於導航流程分析，以下是改善建議：

### 1. 模式按鈕文字改善

**當前設計**：
- 按鈕顯示「3D」→ 點擊後進入 3D 模式
- 易造成混淆（用戶認為「3D」表示當前在 3D）

**建議改善**：
```
選項 A: 明確的動作文案
- 「切換到 3D 模式」
- 「切換到 2D 模式」

選項 B: 圖標 + 文字
- 🌍「3D 地球」
- 🗺️「平面地圖」

選項 C: 狀態指示器
- 當前模式：2D | 切換到：[3D]
```

### 2. 載入狀態反饋

**建議**：在頁面轉換時顯示載入指示器
- 進入軌跡查看時：顯示「正在載入軌跡數據...」
- 模式切換時：顯示「正在切換到 X 模式...」
- API 調用時：顯示進度條或旋轉圖標

### 3. 麵包屑導航

**建議**：添加麵包屑幫助用戶了解當前位置
```
首頁 > 2024秋季綜合賽 > 2D軌跡查看
```

---

**文檔維護者**：專案團隊
**審核狀態**：初版
**下次審核日期**：Phase 2 實作後
