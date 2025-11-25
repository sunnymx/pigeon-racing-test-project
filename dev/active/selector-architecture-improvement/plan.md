# 測試架構改進計劃：抗改版選擇器策略

> **建立日期**: 2025-11-25
> **最後更新**: 2025-11-25
> **狀態**: 進行中 - 先確保 P0 測試通過，再進行 Phase 2/3 優化

---

## 📊 當前進度 (2025-11-25)

### 執行策略
**方案 A：先測試通過，再統一配置**
- Phase 2/3 優化暫緩，待 P0 測試全部通過後再實施

### Phase 1: Codegen 體驗 ✅ 已完成

#### 發現的問題
1. **選擇器 Bug #1** ✅ 已修復
   - 位置：`mode-switching.ts:57`
   - 問題：`/view_in_ar [23]D模式/` 在 3D 模式下失敗
   - 修復：改為 `/[23]D模式/`

2. **選擇器 Bug #2** 🔴 待修復
   - 位置：`mode-switching.ts:216`
   - 問題：`markerCount > 0 && markerCount < 5` 排除了 0 個標記的情況
   - 修復：改為 `markerCount < 5`

#### 兩種 2D/3D 按鈕類型（重要發現）
| 類型 | 位置 | 功能 |
|------|------|------|
| Button Type 1 | 左上角（查看軌跡旁） | 偏好設定 |
| Button Type 2 | 右下角（地圖選單） | 即時切換 |

### P0 測試結果

| 測試套件 | 狀態 | 通過/總數 |
|---------|------|-----------|
| TC-02-001 (2D 靜態軌跡) | ✅ 通過 | 4/4 |
| TC-03-001 (靜態/動態切換) | ❌ 失敗 | 0/6 |
| TC-04-001 (3D 模式) | ⚠️ 部分 | 5/7 |

### 下一步
1. 修復 Bug #2（`mode-switching.ts:216`）
2. 重新執行 P0 測試
3. 測試全部通過後 → Phase 2 選擇器配置化

---

## 問題背景

當前測試專案有 50+ 個硬編碼選擇器分散在 7 個 helper 文件中，網頁改版時需要修改多處代碼，維護成本高。

## 推薦方案：混合策略

採用**漸進式改進**，分三個階段實施：

---

## Phase 1: 體驗 Codegen 錄製模式（即時）

### 目標
讓用戶了解 Playwright 內建的「監控模式」，可以手動操作生成測試代碼。

### 操作步驟

```bash
# 1. 啟動 Codegen（專案已配置）
npm run codegen

# 2. 在打開的瀏覽器中手動操作：
#    - 進入賽事
#    - 選擇鴿子
#    - 查看軌跡
#    - 切換 2D/3D 模式

# 3. Codegen 會自動生成代碼，使用優先級選擇器：
#    Role > Text > Label > TestId > CSS
```

### 預期產出
- 自動生成的測試代碼片段
- 優化過的選擇器（比手寫更穩定）

---

## Phase 2: 選擇器配置化（1-2 小時）

### 目標
將所有硬編碼選擇器提取到統一配置文件，改版只需修改一處。

### 實施步驟

#### Step 1: 新建選擇器配置文件

```typescript
// tests/helpers/selectors.ts（新建）
export const SELECTORS = {
  // 導航頁面
  navigation: {
    enterButton: /\s*(进入|進入)\s*/,
    pigeonCheckbox: 'input[type="checkbox"]',
    viewTrajectoryButton: /查看[轨軌][迹跡]/,
  },

  // 軌跡視圖
  trajectoryView: {
    modeButton: /view_in_ar [23]D模式/,
    view1Button: /[视視]角1/,
    mapContainer: '.amap-container',
    cesiumCanvas: 'canvas.cesium-viewer-canvas',
    amapCanvas: 'canvas.amap-layer',
    trajectoryMarkers: '.amap-marker:has(img[src*="ff0000"])',
    mapTiles: '.amap-container img',
  },

  // 軌跡詳情面板
  trajectoryDetail: {
    detailButton: 'button[mattooltip="軌跡詳情"]',
    fields: {
      ringNumber: '公环号',
      startTime: '起点时间',
      endTime: '终点时间',
      avgSpeed: '平均分速',
      maxSpeed: '最高分速',
      avgAltitude: '平均高度',
      maxAltitude: '最大高度',
      actualDistance: '实际距离',
      straightDistance: '直线距离',
    },
  },

  // 鴿舍列表
  loftList: {
    loftItem: '.loft-item',
    pigeonItem: '.pigeon-item',
  },
};
```

#### Step 2: 更新現有 helper 文件

需要修改的文件：
1. `tests/helpers/trajectory-utils.ts` - 替換軌跡相關選擇器
2. `tests/helpers/mode-switching.ts` - 替換模式切換選擇器
3. `tests/helpers/navigation.ts` - 替換導航選擇器
4. `tests/helpers/loft-list.ts` - 替換鴿舍列表選擇器
5. `tests/helpers/trajectory-reload.ts` - 替換重載相關選擇器

#### Step 3: 驗證測試通過

```bash
npm run test:p0
```

### 預期效果
- 改版時只需修改 `selectors.ts` 一個文件
- 選擇器複用度提升
- 維護成本降低 70%

---

## Phase 3: POM 架構（未來新測試使用）

### 目標
為新測試建立 Page Object Model 範例，新增測試時自動受益。

### 建立頁面類結構

```
tests/pages/（新建目錄）
├── BasePage.ts           # 基礎頁面類
├── RaceListPage.ts       # 賽事列表頁
├── PigeonListPage.ts     # 鴿子列表頁
└── TrajectoryViewPage.ts # 軌跡視圖頁
```

### 範例：TrajectoryViewPage.ts

```typescript
import { Page, Locator } from '@playwright/test';
import { SELECTORS } from '../helpers/selectors';

export class TrajectoryViewPage {
  constructor(private page: Page) {}

  // 高級業務 API
  async ensureMode(mode: '2D' | '3D'): Promise<void> {
    const button = this.modeButton();
    const text = await button.textContent();

    const isTargetMode = text?.includes(`${mode}模式`);
    if (isTargetMode) {
      await button.click();
      await this.waitForModeSwitch(mode);
    }
  }

  async getMarkerCount(): Promise<number> {
    return await this.trajectoryMarkers().count();
  }

  // 選擇器（統一從配置文件引用）
  private modeButton(): Locator {
    return this.page.getByRole('button', {
      name: SELECTORS.trajectoryView.modeButton
    });
  }

  private trajectoryMarkers(): Locator {
    return this.page.locator(SELECTORS.trajectoryView.trajectoryMarkers);
  }

  private async waitForModeSwitch(mode: '2D' | '3D'): Promise<void> {
    if (mode === '3D') {
      await this.page.getByRole('button', {
        name: SELECTORS.trajectoryView.view1Button
      }).waitFor({ state: 'visible', timeout: 30000 });
    } else {
      await this.page.locator(SELECTORS.trajectoryView.mapContainer)
        .waitFor({ state: 'visible', timeout: 10000 });
    }
  }
}
```

### 何時實施
- Phase 2 完成後
- 開發 P1/P2 新測試時採用 POM

---

## 關鍵文件清單

### 需要修改的文件
| 文件 | 修改內容 | 優先級 |
|------|---------|--------|
| `tests/helpers/selectors.ts` | 新建配置文件 | P0 |
| `tests/helpers/trajectory-utils.ts` | 替換選擇器引用 | P0 |
| `tests/helpers/mode-switching.ts` | 替換選擇器引用 | P0 |
| `tests/helpers/navigation.ts` | 替換選擇器引用 | P1 |
| `tests/helpers/loft-list.ts` | 替換選擇器引用 | P1 |
| `tests/helpers/trajectory-reload.ts` | 替換選擇器引用 | P1 |

### 需要新建的文件
| 文件 | 用途 | 優先級 |
|------|------|--------|
| `tests/helpers/selectors.ts` | 統一選擇器配置 | P0 |
| `tests/pages/TrajectoryViewPage.ts` | POM 範例 | P2 |

---

## 時間估算

| 階段 | 工作量 | 累計 |
|------|--------|------|
| Phase 1: Codegen 體驗 | 15 分鐘 | 15 分鐘 |
| Phase 2: 選擇器配置化 | 1-2 小時 | 2 小時 |
| Phase 3: POM 範例 | 1-2 小時 | 4 小時 |

---

## 預期效果

```
現狀                           改善後
─────────────────────────────────────────────
改版需要修改：8 個文件          → 修改：1 個文件
選擇器複用率：30%              → 複用率：90%+
新測試開發時間：5-7 天         → 開發時間：2-3 天
改版維護成本：高               → 維護成本：低
```

---

## 下一步行動

1. **立即**：執行 `npm run codegen` 體驗錄製模式
2. **確認後**：實施 Phase 2 選擇器配置化
3. **未來**：新測試採用 POM 架構
