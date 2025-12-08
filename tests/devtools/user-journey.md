# 使用者旅程完整驗證腳本

**模組**: user-journey
**規格**: [user-journey-test-plan.md](../../dev/active/test-flow-refactor/user-journey-test-plan.md)
**狀態**: 🚧 開發中
**建立日期**: 2025-12-05

---

## 1. 概述

### 目標
整合 4 個已驗證模組，執行完整 7 階段 36 驗證點的使用者旅程測試。

### 依賴模組
| 模組 | 狀態 | 用途 |
|------|------|------|
| adaptive-wait.md | ✅ | 等待策略 |
| console-monitor.md | ✅ | 錯誤監控 |
| trajectory-validator.md | ✅ | 數據驗證 |
| stage-context.md | ✅ | 階段管理 |

### 已知問題解決方案整合 (2025-12-05 更新)
| 問題 | 解決方案 | 適用階段 |
|------|----------|----------|
| #1 2D 載入失敗 | 回到列表重新選取鴿子 ⚠️ 3D↔2D切換無效 | 3 |
| #2 模式混淆 | markers ≥15 靜態, <5 動態 | 3, 4 |
| #3 點擊無響應 | `.amap-icon > img` + force | 3 |
| #4 時序問題 | networkidle + 緩衝 | 全部 |
| #5 搜尋框選擇器 | 多重選擇器策略 (aria-label/placeholder/mat-form-field) | 1 |
| #6 播放控制選擇器 | `innerText.includes('play_arrow/fast_forward/fast_rewind')` | 4, 5 |

📖 **選擇器參考**: [selectors.md](../../docs/guides/selectors.md)

---

## 2. 前置條件

```
1. 開啟 Chrome DevTools
2. 連接 DevTools MCP
3. 導航至 https://skyracing.com.cn/
4. 確認頁面載入完成 (networkidle)
```

---

## 3. 階段依賴與阻斷規則

```
階段 1 ──→ 階段 2 ──→ 階段 3 ──→ 階段 4 ──→ 階段 5
   │          │          │                      │
   │          │          └──────────────────────┼──→ 階段 6
   │          │                                 │
   └──────────┴─────────────────────────────────┴──→ 階段 7 (全程)

阻斷規則:
├─ 階段 1.1 失敗 → 全部終止
├─ 階段 2.1/2.3 失敗 → 全部終止
├─ 階段 3.1 失敗 → 跳至階段 6
├─ 階段 4 失敗 → 繼續階段 5
├─ 階段 5.1 失敗 → 跳過 5.2-5.8
└─ 階段 6 失敗 → 僅記錄
```

---

## 4. 驗證步驟

### 階段 1: 首頁探索 (4 驗證點)

**前置**: 無

#### 1.1 首頁載入驗證 (P1) 🔴 阻斷點

```javascript
// 驗證首頁載入
(() => {
  const title = document.title;
  const hasSkyracing = title.toLowerCase().includes('skyracing') ||
                       title.includes('賽鴿') ||
                       title.includes('赛鸽');
  return {
    checkpoint: '1.1',
    title,
    pass: hasSkyracing || title.length > 0,
    blocking: true
  };
})()
```

**成功標準**: 頁面標題存在且非空白

#### 1.2 賽事卡片數量 (P1)

```javascript
// 驗證賽事卡片數量
(() => {
  const cards = document.querySelectorAll('mat-card, .race-card, [class*="card"]');
  return {
    checkpoint: '1.2',
    count: cards.length,
    pass: cards.length >= 10,
    blocking: false
  };
})()
```

**成功標準**: 卡片數量 ≥ 10

#### 1.3 搜尋功能可用 (P1)

```javascript
// 驗證搜尋輸入框 (2025-12-05 更新選擇器)
(() => {
  // 多重選擇器策略：優先使用 aria-label，後備使用 placeholder
  const searchInput = document.querySelector(
    'input[aria-label*="搜寻"], ' +
    'input[aria-label*="搜尋"], ' +
    'input[placeholder*="搜寻赛事"], ' +
    'input[placeholder*="搜尋賽事"], ' +
    'input[type="search"]'
  );
  // 後備：檢查 mat-form-field 內的 input
  const matInput = document.querySelector('mat-form-field input');
  const found = searchInput || matInput;
  return {
    checkpoint: '1.3',
    found: !!found,
    selector: found ? (searchInput ? 'aria-label/placeholder' : 'mat-form-field') : null,
    pass: !!found,
    blocking: false,
    note: '⚠️ 需等待賽事卡片載入後才可用'
  };
})()
```

#### 1.4 年份篩選可用 (P2)

```javascript
// 驗證年份選擇器
(() => {
  const yearSelect = document.querySelector('mat-select, select, [class*="year"]');
  return {
    checkpoint: '1.4',
    found: !!yearSelect,
    pass: !!yearSelect,
    blocking: false
  };
})()
```

---

### 階段 2: 進入賽事 + 選擇鴿子 (4 驗證點)

**前置**: 階段 1.1 通過

#### 2.1 進入賽事按鈕 (P1) 🔴 阻斷點

**操作**: 點擊第一個「進入」按鈕

```javascript
// 驗證進入賽事
(() => {
  const url = window.location.href;
  const inRaceDetail = url.includes('/race/') ||
                       url.includes('detail') ||
                       document.querySelector('table, .ranking');
  return {
    checkpoint: '2.1',
    url,
    pass: inRaceDetail,
    blocking: true
  };
})()
```

**成功標準**: URL 變更或排名表格可見

#### 2.2 排名表格顯示 (P2)

```javascript
// 驗證排名表格
(() => {
  const table = document.querySelector('table');
  const rows = table ? table.querySelectorAll('tbody tr, tr').length : 0;
  return {
    checkpoint: '2.2',
    rows,
    pass: rows >= 10,
    blocking: false
  };
})()
```

#### 2.3 勾選鴿子成功 (P0) 🔴 阻斷點

**操作**: 勾選第一個 checkbox

```javascript
// 驗證勾選狀態
(() => {
  const checkbox = document.querySelector('input[type="checkbox"]:checked');
  return {
    checkpoint: '2.3',
    checked: !!checkbox,
    pass: !!checkbox,
    blocking: true
  };
})()
```

#### 2.4 勾選計數更新 (P2)

```javascript
// 驗證計數文字
(() => {
  const countText = document.body.innerText;
  const hasCount = countText.includes('勾選清單 1') ||
                   countText.includes('已選 1') ||
                   countText.includes('selected: 1');
  return {
    checkpoint: '2.4',
    pass: hasCount,
    blocking: false
  };
})()
```

---

### 階段 3: 2D 軌跡體驗 (6 驗證點)

**前置**: 階段 2 通過
**操作**: 點擊「查看軌跡」按鈕，等待 3-5 秒

#### 3.1 查看軌跡按鈕啟用 (P0) 🔴 阻斷點

```javascript
// 驗證進入軌跡視圖
(() => {
  const hasAmap = !!document.querySelector('.amap-container');
  const hasCesium = !!document.querySelector('.cesium-viewer');
  return {
    checkpoint: '3.1',
    hasAmap,
    hasCesium,
    pass: hasAmap || hasCesium,
    blocking: true
  };
})()
```

**成功標準**: AMap 或 Cesium 容器存在

#### 3.2 API 請求發送 (P1)

> 使用 DevTools Network 面板檢查 `ugetPigeonAllJsonInfo` 請求

```javascript
// 驗證 API 數據 (需透過 Network 面板確認)
(() => {
  // 此驗證點需手動確認 Network 請求
  return {
    checkpoint: '3.2',
    note: '檢查 Network 面板是否有 ugetPigeonAllJsonInfo 請求',
    pass: null, // 手動填入
    blocking: false
  };
})()
```

#### 3.3 Canvas 渲染成功 (P0)

```javascript
// 驗證 Canvas 圖層 (問題 #1 解決方案)
(() => {
  const canvasCount = document.querySelectorAll('canvas.amap-layer').length;
  return {
    checkpoint: '3.3',
    canvasCount,
    pass: canvasCount > 0,
    blocking: false
  };
})()
```

**成功標準**: Canvas 圖層數量 > 0

#### 3.4 軌跡標記點驗證 (P0)

```javascript
// 驗證軌跡標記 (問題 #2 解決方案: 選擇器更新)
(() => {
  // ⚠️ 使用更新後的選擇器 .amap-icon > img
  const markers = document.querySelectorAll('.amap-icon > img');
  const count = markers.length;
  const isStaticMode = count >= 15;
  return {
    checkpoint: '3.4',
    markerCount: count,
    mode: isStaticMode ? 'static' : 'dynamic',
    pass: count >= 3,
    blocking: false
  };
})()
```

**成功標準**: 標記點數量 ≥ 3

#### 3.5 點擊軌跡點顯示資訊 (P0)

**操作**: 使用 `.amap-icon > img` 選擇器點擊標記點 (問題 #3 解決方案)

```javascript
// 驗證資訊彈窗
(() => {
  const popupText = document.body.innerText;
  const hasTime = /\d{4}-\d{2}-\d{2}/.test(popupText) ||
                  popupText.includes('時間');
  const hasSpeed = popupText.includes('速度') ||
                   popupText.includes('m/min');
  const hasDirection = /[東西南北]/.test(popupText) ||
                       popupText.includes('方向');
  const hasAltitude = popupText.includes('海拔') ||
                      popupText.includes('高度');
  return {
    checkpoint: '3.5',
    hasTime,
    hasSpeed,
    hasDirection,
    hasAltitude,
    pass: hasTime && hasSpeed,
    blocking: false
  };
})()
```

**成功標準**: 彈窗顯示時間和速度

#### 3.6 側邊欄數據完整 (P1)

```javascript
// 驗證側邊欄數據
(() => {
  const text = document.body.innerText;
  // 公環號格式: YYYY-NN-NNNNNNN
  const hasRingNo = /\d{4}-\d{2}-\d{6,7}/.test(text);
  // 分速格式: 數字 m/min
  const hasSpeed = /\d+(\.\d+)?\s*m\/min/.test(text) ||
                   text.includes('分速');
  return {
    checkpoint: '3.6',
    hasRingNo,
    hasSpeed,
    pass: hasRingNo || hasSpeed,
    blocking: false
  };
})()
```

---

### 階段 4: 2D 動態模式 (7 驗證點)

**前置**: 階段 3.3 (Canvas) 通過
**操作**: 點擊 timeline 按鈕切換到動態模式

#### 4.1 靜態→動態切換 (P0)

```javascript
// 驗證動態模式 (問題 #2: markers < 5)
(() => {
  const markers = document.querySelectorAll('.amap-icon > img').length;
  const isDynamic = markers < 5;
  return {
    checkpoint: '4.1',
    markerCount: markers,
    pass: isDynamic,
    blocking: false
  };
})()
```

**成功標準**: 標記點數量 < 5

#### 4.2 播放按鈕可見 (P0)

```javascript
// 驗證播放控制
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const playBtn = buttons.find(b =>
    b.innerText.includes('play_arrow') ||
    b.querySelector('mat-icon')?.innerText === 'play_arrow'
  );
  return {
    checkpoint: '4.2',
    found: !!playBtn,
    pass: !!playBtn,
    blocking: false
  };
})()
```

#### 4.3 暫停按鈕可見 (P0)

**操作**: 點擊播放按鈕後驗證

```javascript
// 驗證暫停按鈕
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const pauseBtn = buttons.find(b =>
    b.innerText.includes('pause') ||
    b.querySelector('mat-icon')?.innerText === 'pause'
  );
  return {
    checkpoint: '4.3',
    found: !!pauseBtn,
    pass: !!pauseBtn,
    blocking: false
  };
})()
```

#### 4.4 快進功能 (P1)

```javascript
// 驗證快進按鈕
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const ffBtn = buttons.find(b =>
    b.innerText.includes('fast_forward') ||
    b.querySelector('mat-icon')?.innerText === 'fast_forward'
  );
  return {
    checkpoint: '4.4',
    found: !!ffBtn,
    pass: !!ffBtn,
    blocking: false
  };
})()
```

#### 4.5 快退功能 (P1)

```javascript
// 驗證快退按鈕 (2025-12-05 更新: 2D 動態模式可能無快退按鈕)
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  // 檢查 innerText 包含 Material Icon 名稱
  const frBtn = buttons.find(b =>
    b.innerText.includes('fast_rewind') ||
    b.textContent.includes('fast_rewind') ||
    b.querySelector('mat-icon')?.innerText === 'fast_rewind'
  );
  // 2D 動態模式可能只有播放/暫停，無快退
  // 此為非阻斷驗證點
  return {
    checkpoint: '4.5',
    found: !!frBtn,
    pass: !!frBtn,
    blocking: false,
    note: '⚠️ 2D 動態模式可能無快退按鈕，3D 模式才有'
  };
})()
```

#### 4.6 Canvas 更新驗證 (P0)

> 需截圖對比：播放前後截圖應不同

```javascript
// Canvas 更新驗證說明
(() => {
  return {
    checkpoint: '4.6',
    note: '需對比播放前後截圖',
    pass: null, // 手動填入
    blocking: false
  };
})()
```

#### 4.7 動態→靜態切回 (P0)

**操作**: 再次點擊 timeline 按鈕

```javascript
// 驗證切回靜態模式
(() => {
  const markers = document.querySelectorAll('.amap-icon > img').length;
  const isStatic = markers >= 15;
  return {
    checkpoint: '4.7',
    markerCount: markers,
    pass: isStatic,
    blocking: false
  };
})()
```

---

### 階段 5: 3D 模式體驗 (8 驗證點)

**前置**: 階段 3.3 (Canvas) 通過
**操作**: 點擊「3D模式」按鈕

#### 5.1 2D→3D 切換 (P0) 🔴 阻斷點

```javascript
// 驗證 3D 模式 (使用按鈕文字判斷)
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const modeBtn = buttons.find(b =>
    b.innerText.includes('2D模式') || b.innerText.includes('3D模式')
  );
  const btnText = modeBtn ? modeBtn.innerText : null;
  // 按鈕顯示「2D模式」= 當前為 3D
  const is3D = btnText && btnText.includes('2D模式');
  return {
    checkpoint: '5.1',
    buttonText: btnText,
    is3D,
    pass: is3D,
    blocking: true
  };
})()
```

**成功標準**: 按鈕顯示「2D模式」(表示當前為 3D)

#### 5.2 Cesium 初始化 (P0)

```javascript
// 驗證 Cesium 容器
(() => {
  const cesiumViewer = document.querySelector('.cesium-viewer');
  const cesiumWidget = document.querySelector('.cesium-widget');
  return {
    checkpoint: '5.2',
    hasViewer: !!cesiumViewer,
    hasWidget: !!cesiumWidget,
    pass: !!cesiumViewer || !!cesiumWidget,
    blocking: false
  };
})()
```

#### 5.3 視角1 按鈕 (P0)

```javascript
// 驗證視角1按鈕
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const view1 = buttons.find(b => /[视視]角1/.test(b.innerText));
  return {
    checkpoint: '5.3',
    found: !!view1,
    pass: !!view1,
    blocking: false
  };
})()
```

#### 5.4 視角2 按鈕 (P0)

```javascript
// 驗證視角2按鈕
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const view2 = buttons.find(b => /[视視]角2/.test(b.innerText));
  return {
    checkpoint: '5.4',
    found: !!view2,
    pass: !!view2,
    blocking: false
  };
})()
```

#### 5.5 視角切換功能 (P1)

> 點擊視角2後需截圖對比確認視角變化

```javascript
// 視角切換驗證說明
(() => {
  return {
    checkpoint: '5.5',
    note: '點擊視角2後對比截圖',
    pass: null, // 手動填入
    blocking: false
  };
})()
```

#### 5.6 3D 播放控制 (P0)

```javascript
// 驗證 3D 播放控制 (2025-12-05 更新: 完整速度控制檢測)
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));

  // 播放按鈕檢測
  const hasPlay = buttons.some(b =>
    b.innerText.includes('play_arrow') ||
    b.textContent.includes('play_arrow') ||
    b.querySelector('mat-icon')?.innerText === 'play_arrow'
  );

  // 加速按鈕檢測 (fast_forward)
  const hasSpeedUp = buttons.some(b =>
    b.innerText.includes('fast_forward') ||
    b.textContent.includes('fast_forward')
  );

  // 減速按鈕檢測 (fast_rewind)
  const hasSpeedDown = buttons.some(b =>
    b.innerText.includes('fast_rewind') ||
    b.textContent.includes('fast_rewind')
  );

  return {
    checkpoint: '5.6',
    hasPlay,
    hasSpeedUp,
    hasSpeedDown,
    pass: hasPlay,
    blocking: false,
    note: '3D 模式應有 play_arrow + fast_forward + fast_rewind'
  };
})()
```

#### 5.7 速度滑桿 (P0)

```javascript
// 驗證速度滑桿
(() => {
  const slider = document.querySelector('mat-slider, input[type="range"], .slider');
  return {
    checkpoint: '5.7',
    found: !!slider,
    pass: !!slider,
    blocking: false
  };
})()
```

#### 5.8 3D→2D 切回 (P0)

**操作**: 點擊「2D模式」按鈕

```javascript
// 驗證切回 2D 模式
(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const modeBtn = buttons.find(b =>
    b.innerText.includes('2D模式') || b.innerText.includes('3D模式')
  );
  const btnText = modeBtn ? modeBtn.innerText : null;
  // 按鈕顯示「3D模式」= 當前為 2D
  const is2D = btnText && btnText.includes('3D模式');
  return {
    checkpoint: '5.8',
    buttonText: btnText,
    is2D,
    pass: is2D,
    blocking: false
  };
})()
```

---

### 階段 6: 鴿舍列表多鴿軌跡 (4 驗證點)

**前置**: 階段 2 通過
**操作**: 返回賽事頁面，切換到鴿舍列表 Tab

#### 6.1 切換到鴿舍列表 Tab (P1)

```javascript
// 驗證鴿舍列表 Tab
(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"], .mat-tab-label, button'));
  const loftTab = tabs.find(t =>
    t.innerText.includes('鴿舍') ||
    t.innerText.includes('鸽舍') ||
    t.innerText.includes('loft')
  );
  return {
    checkpoint: '6.1',
    found: !!loftTab,
    pass: !!loftTab,
    blocking: false
  };
})()
```

#### 6.2 選擇鴿舍展開 (P1)

**操作**: 點擊第一個鴿舍展開

```javascript
// 驗證鴿舍展開
(() => {
  const pigeonList = document.querySelectorAll('input[type="checkbox"]');
  const expanded = pigeonList.length > 0;
  return {
    checkpoint: '6.2',
    pigeonCount: pigeonList.length,
    pass: expanded,
    blocking: false
  };
})()
```

#### 6.3 勾選多隻鴿子 (P1)

**操作**: 勾選 2 隻鴿子

```javascript
// 驗證多選
(() => {
  const checked = document.querySelectorAll('input[type="checkbox"]:checked');
  return {
    checkpoint: '6.3',
    checkedCount: checked.length,
    pass: checked.length >= 2,
    blocking: false
  };
})()
```

#### 6.4 查看多軌跡 (P1)

**操作**: 點擊查看軌跡

> 使用 Network 面板確認多次 API 呼叫

```javascript
// 多軌跡驗證說明
(() => {
  return {
    checkpoint: '6.4',
    note: '檢查 Network 面板 ugetPigeonAllJsonInfo 請求次數',
    pass: null, // 手動填入
    blocking: false
  };
})()
```

---

### 階段 7: 控制台錯誤監控 (3 驗證點)

**特殊**: 全程背景執行，最後統計

#### 7.1 收集所有 console.error

> 開始測試前在 Console 面板啟用「Preserve log」

```javascript
// 錯誤收集 (使用 DevTools Console 面板)
// 需手動記錄所有 error 類型訊息
```

#### 7.2 過濾已知錯誤

**已知錯誤白名單**:
- `gpx2d undefined`
- `Cannot read properties of undefined`
- `_leaflet_id`

```javascript
// 錯誤過濾邏輯
(() => {
  const knownPatterns = [
    /gpx2d.*undefined/i,
    /Cannot read properties/i,
    /_leaflet_id/i,
  ];

  function isKnownError(msg) {
    return knownPatterns.some(p => p.test(msg));
  }

  // 測試
  return {
    checkpoint: '7.2',
    example: isKnownError('Error: pigeon.gpx2d undefined'),
    note: '使用此函數過濾已知錯誤'
  };
})()
```

#### 7.3 嚴重錯誤統計 (P0)

```javascript
// 嚴重錯誤統計說明
(() => {
  return {
    checkpoint: '7.3',
    note: '過濾後的錯誤數應為 0',
    criticalErrors: null, // 手動填入數量
    pass: null, // 手動填入
    blocking: false
  };
})()
```

---

## 5. 驗證結果記錄

### 階段結果總覽

| 階段 | 名稱 | 驗證點 | 通過 | 失敗 | 狀態 |
|------|------|--------|------|------|------|
| 1 | 首頁探索 | 4 | - | - | ⏳ |
| 2 | 進入賽事 | 4 | - | - | ⏳ |
| 3 | 2D 軌跡 | 6 | - | - | ⏳ |
| 4 | 2D 動態 | 7 | - | - | ⏳ |
| 5 | 3D 模式 | 8 | - | - | ⏳ |
| 6 | 鴿舍列表 | 4 | - | - | ⏳ |
| 7 | 錯誤監控 | 3 | - | - | ⏳ |
| **總計** | - | **36** | - | - | ⏳ |

### 詳細結果記錄

#### 階段 1
| # | 驗證點 | 結果 | 數值 | 備註 |
|---|--------|------|------|------|
| 1.1 | 首頁載入 | ⏳ | - | - |
| 1.2 | 卡片數量 | ⏳ | - | - |
| 1.3 | 搜尋功能 | ⏳ | - | - |
| 1.4 | 年份篩選 | ⏳ | - | - |

#### 階段 2
| # | 驗證點 | 結果 | 數值 | 備註 |
|---|--------|------|------|------|
| 2.1 | 進入賽事 | ⏳ | - | - |
| 2.2 | 排名表格 | ⏳ | - | - |
| 2.3 | 勾選鴿子 | ⏳ | - | - |
| 2.4 | 計數更新 | ⏳ | - | - |

#### 階段 3
| # | 驗證點 | 結果 | 數值 | 備註 |
|---|--------|------|------|------|
| 3.1 | 軌跡視圖 | ⏳ | - | - |
| 3.2 | API 請求 | ⏳ | - | - |
| 3.3 | Canvas | ⏳ | - | - |
| 3.4 | 軌跡標記 | ⏳ | - | - |
| 3.5 | 資訊彈窗 | ⏳ | - | - |
| 3.6 | 側邊欄 | ⏳ | - | - |

#### 階段 4
| # | 驗證點 | 結果 | 數值 | 備註 |
|---|--------|------|------|------|
| 4.1 | 動態切換 | ⏳ | - | - |
| 4.2 | 播放按鈕 | ⏳ | - | - |
| 4.3 | 暫停按鈕 | ⏳ | - | - |
| 4.4 | 快進功能 | ⏳ | - | - |
| 4.5 | 快退功能 | ⏳ | - | - |
| 4.6 | Canvas 更新 | ⏳ | - | - |
| 4.7 | 靜態切回 | ⏳ | - | - |

#### 階段 5
| # | 驗證點 | 結果 | 數值 | 備註 |
|---|--------|------|------|------|
| 5.1 | 3D 切換 | ⏳ | - | - |
| 5.2 | Cesium | ⏳ | - | - |
| 5.3 | 視角1 | ⏳ | - | - |
| 5.4 | 視角2 | ⏳ | - | - |
| 5.5 | 視角切換 | ⏳ | - | - |
| 5.6 | 3D 播放 | ⏳ | - | - |
| 5.7 | 速度滑桿 | ⏳ | - | - |
| 5.8 | 2D 切回 | ⏳ | - | - |

#### 階段 6
| # | 驗證點 | 結果 | 數值 | 備註 |
|---|--------|------|------|------|
| 6.1 | 鴿舍 Tab | ⏳ | - | - |
| 6.2 | 展開鴿舍 | ⏳ | - | - |
| 6.3 | 多選鴿子 | ⏳ | - | - |
| 6.4 | 多軌跡 | ⏳ | - | - |

#### 階段 7
| # | 驗證點 | 結果 | 數值 | 備註 |
|---|--------|------|------|------|
| 7.1 | 錯誤收集 | ⏳ | - | - |
| 7.2 | 錯誤過濾 | ⏳ | - | - |
| 7.3 | 嚴重錯誤 | ⏳ | - | - |

---

## 6. 下一步

1. ⏳ 使用 DevTools MCP 執行完整驗證
2. ⏳ 填入驗證結果
3. ⏳ 更新 IMPLEMENTATION_GUIDE.md 進度
4. ⏳ 轉換為 Playwright 模組 (Phase 2)
