# P0 測試修復計劃

**文檔版本**: 1.0
**建立日期**: 2025-11-21
**狀態**: 待執行
**預估總時間**: 2-3 小時

---

## 📊 Executive Summary

### 當前狀態
- **總測試數**: 16 個 P0 測試
- **通過**: 2 個 (12.5%)
- **失敗**: 14 個 (87.5%)
- **已完成修復**: `reload2DTrajectory` 導航問題 ✅

### 問題分類

| 優先級 | 問題類型 | 影響測試數 | 預估修復時間 | 預期通過率提升 |
|--------|----------|------------|--------------|----------------|
| 🔴 High | getCurrentMode() 邏輯錯誤 | 7 tests | 30-60 min | +50% |
| 🟡 Medium | Element Selector 問題 | 2 tests | 20-40 min | +14% |
| 🟢 Low | 模式切換邏輯調查 | 5 tests | 1-2 hours | +14-36% |

### 預期成果路線圖
```
修復前:  ██░░░░░░░░░░░░░░  12.5% (2/16)
Phase 1: ██████████░░░░░░  62.5% (10/16) ← getCurrentMode 修復
Phase 2: ████████████░░░░  75.0% (12/16) ← Selector 更新
Phase 3: ████████████████ 100.0% (16/16) ← 全部通過
```

---

## 🔍 File Dependency Analysis

### 核心文件映射

```
tests/
├── helpers/
│   ├── navigation.ts ⚠️ [HIGH PRIORITY FIX]
│   │   ├── getCurrentMode() (L124-142) ← 主要問題點
│   │   ├── enterRace() (L21-49)
│   │   ├── selectPigeon() (L59-93)
│   │   └── openTrajectory() (L101-116)
│   │
│   ├── trajectory-reload.ts ✅ [FIXED]
│   ├── mode-switch.ts (待確認是否存在)
│   └── wait-utils.ts
│
└── e2e/
    ├── tc-02-001-2d-static.spec.ts ⚠️ [MEDIUM PRIORITY]
    │   ├── Line 60: Timeline button selector issue
    │   └── Line 129: Marker detection issue
    │
    ├── tc-03-001-mode-switch.spec.ts ⚠️ [INVESTIGATION NEEDED]
    │   ├── 5 tests failing
    │   └── Depends on getCurrentMode() fix
    │
    └── tc-04-001-3d-mode.spec.ts ⚠️ [BLOCKED BY HIGH PRIORITY]
        └── 6 tests all failing due to mode detection
```

### 依賴關係樹

```
getCurrentMode() (navigation.ts:124)
    ↓ 直接依賴
    ├─→ tc-03-001: 應該正確偵測當前模式
    ├─→ tc-04-001: All 6 tests (無法切換到 3D)
    │   ├── 應該成功切換到 3D 模式並渲染
    │   ├── Cesium 引擎應該正確初始化
    │   ├── 視角切換功能應該正常
    │   ├── 3D 播放控制應該可用
    │   ├── 應該顯示軌跡點控制
    │   └── 3D 和 2D 模式應該可以來回切換
    │
    └─→ tc-03-001: 其他 4 個模式切換測試 (間接影響)
```

---

## 🔴 HIGH PRIORITY: getCurrentMode() 邏輯修復

### 問題根本原因

**位置**: `tests/helpers/navigation.ts:124-142`

**當前錯誤邏輯**:
```typescript
export async function getCurrentMode(page: Page): Promise<'2D' | '3D' | 'unknown'> {
  // 檢查 3D 特徵元素（視角按鈕）
  const view1Button = page.getByRole('button', { name: '視角1' });
  const is3DMode = await view1Button.isVisible().catch(() => false);

  if (is3DMode) {
    return '3D';
  }

  // 檢查 2D 特徵元素（3D模式切換按鈕）
  const mode3DButton = page.getByRole('button', { name: /3D模式/ });
  const is2DMode = await mode3DButton.isVisible().catch(() => false);

  if (is2DMode) {
    return '2D';
  }

  return 'unknown';
}
```

**問題分析**:
1. ✅ **第一部分正確**: 檢查「視角1」按鈕存在 → 確實在 3D 模式
2. ✅ **第二部分正確**: 檢查「3D模式」按鈕存在 → 確實在 2D 模式

**但實際測試日誌顯示**:
```
📍 當前模式按鈕顯示：2d  2D模式  ← 按鈕文字是 "2D模式"
✅ 已在 3D 模式，無需切換           ← 但判斷為 3D 模式（錯誤！）
```

**真正的問題**:
測試日誌顯示按鈕文字為 "2D模式"，這表示：
- 當前在 **3D 模式**
- 按鈕提供切換到 **2D 模式** 的功能

但是代碼邏輯檢查的是「3D模式」按鈕，這個按鈕在 2D 模式時才會顯示！

### 修復方案

**方案 A: 反轉邏輯（快速修復）**
```typescript
export async function getCurrentMode(page: Page): Promise<'2D' | '3D' | 'unknown'> {
  // 檢查 3D 特徵元素（視角按鈕） - 這個保持不變
  const view1Button = page.getByRole('button', { name: '視角1' });
  const is3DMode = await view1Button.isVisible().catch(() => false);

  if (is3DMode) {
    return '3D';
  }

  // 檢查 2D 模式特徵：應該檢查「2D模式」按鈕而非「3D模式」按鈕
  const mode2DButton = page.getByRole('button', { name: /2D模式/ });
  const has2DModeButton = await mode2DButton.isVisible().catch(() => false);

  if (has2DModeButton) {
    return '3D';  // 如果看到「2D模式」按鈕，表示當前在 3D
  }

  // 檢查「3D模式」按鈕
  const mode3DButton = page.getByRole('button', { name: /3D模式/ });
  const has3DModeButton = await mode3DButton.isVisible().catch(() => false);

  if (has3DModeButton) {
    return '2D';  // 如果看到「3D模式」按鈕，表示當前在 2D
  }

  return 'unknown';
}
```

**方案 B: 多重檢測（穩健方案）**
```typescript
export async function getCurrentMode(page: Page): Promise<'2D' | '3D' | 'unknown'> {
  console.log('🔍 開始檢測當前模式...');

  // 優先檢查 3D 模式的特徵元素（視角按鈕）
  const view1Button = page.getByRole('button', { name: '視角1' });
  const hasView1Button = await view1Button.isVisible().catch(() => false);

  if (hasView1Button) {
    console.log('  ✓ 偵測到「視角1」按鈕 → 當前在 3D 模式');
    return '3D';
  }

  // 檢查模式切換按鈕的文字
  const modeButton = page.getByRole('button', { name: /[23]D模式/ });
  const buttonText = await modeButton.textContent().catch(() => null);

  if (buttonText) {
    console.log(`  📍 模式切換按鈕文字: ${buttonText.trim()}`);

    if (buttonText.includes('3D')) {
      console.log('  ✓ 按鈕顯示「3D模式」→ 當前在 2D 模式');
      return '2D';
    } else if (buttonText.includes('2D')) {
      console.log('  ✓ 按鈕顯示「2D模式」→ 當前在 3D 模式');
      return '3D';
    }
  }

  // 檢查 2D 特有的元素（地圖瓦片容器）
  const mapContainer = page.locator('.amap-container');
  const hasMapContainer = await mapContainer.isVisible().catch(() => false);

  if (hasMapContainer) {
    console.log('  ✓ 偵測到高德地圖容器 → 可能在 2D 模式');
    return '2D';
  }

  console.log('  ⚠️ 無法確定當前模式');
  return 'unknown';
}
```

### 建議採用方案

**✅ 推薦方案 B（多重檢測）**

理由：
1. 更穩健：不依賴單一檢測方式
2. 有詳細日誌：方便調試
3. 多層後備：提高成功率
4. 符合測試日誌的實際行為

### 修改步驟

1. **備份原始檔案**
   ```bash
   cp tests/helpers/navigation.ts tests/helpers/navigation.ts.backup
   ```

2. **修改 getCurrentMode() 函數**
   - 文件：`tests/helpers/navigation.ts`
   - 行數：124-142
   - 替換為「方案 B」的實現

3. **驗證修改**
   ```bash
   # 運行單一測試驗證
   npx playwright test tests/e2e/tc-03-001-mode-switch.spec.ts:144 --grep "應該正確偵測當前模式"
   ```

4. **運行完整測試套件**
   ```bash
   npm run test:p0
   ```

### 預期結果

**修復前**:
```
✘ TC-03-001: 應該正確偵測當前模式
✘ TC-04-001: 6 個 3D 模式測試全部失敗
```

**修復後**:
```
✓ TC-03-001: 應該正確偵測當前模式
✓ TC-04-001: 應該成功切換到 3D 模式並渲染
✓ TC-04-001: Cesium 引擎應該正確初始化
✓ TC-04-001: 視角切換功能應該正常
✓ TC-04-001: 3D 播放控制應該可用
✓ TC-04-001: 應該顯示軌跡點控制
✓ TC-04-001: 3D 和 2D 模式應該可以來回切換
```

**改善幅度**: +7 tests (50% → 62.5%)

---

## 🟡 MEDIUM PRIORITY: Element Selector 更新

### 問題 1: Timeline 按鈕定位失敗

**位置**: `tests/e2e/tc-02-001-2d-static.spec.ts:60`

**當前代碼**:
```typescript
// 驗證 timeline 按鈕存在
const timelineButton = page.locator('button:has(img[alt="timeline"])');
await expect(timelineButton).toBeVisible({ timeout: 5000 });
```

**問題**: Selector 可能不正確或元素需要更長加載時間

**調查步驟**:
1. 使用 Playwright Inspector 檢查實際 DOM
   ```bash
   npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts:37 --debug
   ```

2. 在瀏覽器開發者工具中確認實際元素結構

**可能的修復方案**:

```typescript
// 方案 A: 更寬鬆的 selector
const timelineButton = page.locator('button').filter({ hasText: /timeline|時間軸/i });

// 方案 B: 使用 role 和 accessible name
const timelineButton = page.getByRole('button', { name: /timeline/i });

// 方案 C: 增加等待時間並使用多重 selector
const timelineButton = page.locator('button:has(img[alt="timeline"]), button:has-text("timeline")');
await expect(timelineButton).toBeVisible({ timeout: 10000 });

// 方案 D: 檢查父容器再定位
const controlPanel = page.locator('.control-panel, .toolbar');
const timelineButton = controlPanel.getByRole('button', { name: /timeline/i });
```

### 問題 2: 起點/終點標記檢測失敗

**位置**: `tests/e2e/tc-02-001-2d-static.spec.ts:129`

**當前代碼**（假設）:
```typescript
const startMarker = page.locator('.marker-start');
const endMarker = page.locator('.marker-end');
```

**調查步驟**:
1. 檢查標記是否在 Canvas 內而非 DOM 元素
2. 如果是 Canvas 渲染，需要改用視覺驗證或 API 驗證

**可能的修復方案**:

```typescript
// 方案 A: 如果是 DOM 元素，使用更穩健的 selector
const markers = page.locator('[class*="marker"], [data-marker-type]');
const markerCount = await markers.count();
expect(markerCount).toBeGreaterThanOrEqual(2); // 至少有起點和終點

// 方案 B: 如果是 Canvas 渲染，改用截圖比對
await page.waitForTimeout(2000); // 等待渲染完成
const screenshot = await page.screenshot();
// 使用視覺回歸測試工具比對

// 方案 C: 改用 API 驗證
const response = await page.waitForResponse(resp =>
  resp.url().includes('/api/trajectory') && resp.status() === 200
);
const data = await response.json();
expect(data.points.length).toBeGreaterThan(0);
expect(data.points[0]).toHaveProperty('isStart', true);
expect(data.points[data.points.length - 1]).toHaveProperty('isEnd', true);
```

### 修改步驟

1. **運行測試並啟用 debug 模式**
   ```bash
   npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts:37 --debug
   ```

2. **使用 Inspector 定位正確的 selector**

3. **修改測試檔案**
   - 更新 line 60 的 timeline button selector
   - 更新 line 129 的 marker detection 邏輯

4. **驗證修改**
   ```bash
   npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts
   ```

### 預期結果

**修復前**:
```
✘ TC-02-001: 應該正確渲染 2D 靜態軌跡
✘ TC-02-001: 應該正確顯示起點和終點標記
```

**修復後**:
```
✓ TC-02-001: 應該正確渲染 2D 靜態軌跡
✓ TC-02-001: 應該正確顯示起點和終點標記
```

**改善幅度**: +2 tests (62.5% → 75%)

---

## 🟢 LOW PRIORITY: TC-03-001 模式切換測試調查

### 待調查的測試

1. **應該成功切換靜態→動態→靜態** (tc-03-001-mode-switch.spec.ts:33)
2. **動態模式應該顯示播放控制** (tc-03-001-mode-switch.spec.ts:90)
3. **動態模式播放功能應該正常** (tc-03-001-mode-switch.spec.ts:111)
4. **Canvas 應該在模式切換時更新** (tc-03-001-mode-switch.spec.ts:170)

### 調查步驟

**Phase 1: 運行測試獲取詳細錯誤訊息**
```bash
npx playwright test tests/e2e/tc-03-001-mode-switch.spec.ts --reporter=line
```

**Phase 2: 逐一檢查失敗原因**

針對每個測試：
1. 記錄具體的錯誤訊息
2. 檢查是否與 `getCurrentMode()` 修復相關
3. 識別是 selector、timing 還是邏輯問題

**Phase 3: 分類修復**

可能的問題類型：

| 問題類型 | 修復方法 | 預估時間 |
|---------|---------|----------|
| Selector 錯誤 | 更新 selector | 15-20 min/test |
| Timing 問題 | 增加 wait 或使用更好的 wait 策略 | 10-15 min/test |
| 斷言邏輯錯誤 | 調整預期值 | 5-10 min/test |
| 功能實際異常 | 需要深入調查，可能是 bug | 1-2 hours |

### 常見修復模式

**模式 1: 等待時間不足**
```typescript
// Before
await page.click('.dynamic-mode-button');
const playButton = page.locator('.play-button');
await expect(playButton).toBeVisible();

// After
await page.click('.dynamic-mode-button');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // 額外等待動畫
const playButton = page.locator('.play-button');
await expect(playButton).toBeVisible({ timeout: 10000 });
```

**模式 2: Selector 需要更新**
```typescript
// Before
const button = page.locator('.mode-switch-button');

// After
const button = page.getByRole('button', { name: /靜態|動態|static|dynamic/i });
```

**模式 3: 斷言過於嚴格**
```typescript
// Before
expect(canvasData).toEqual(expectedData); // 完全相等

// After
expect(canvasData).toMatchObject(expectedData); // 部分匹配
// 或
expect(canvasData.points.length).toBeGreaterThan(10); // 只檢查關鍵指標
```

### 預期結果

根據實際調查結果，預期可修復 **2-5 個測試**

**最佳情況** (所有問題都是簡單的 selector/timing):
```
✓ 應該成功切換靜態→動態→靜態
✓ 動態模式應該顯示播放控制
✓ 動態模式播放功能應該正常
✓ Canvas 應該在模式切換時更新
```
改善幅度: +4 tests (75% → 100%)

**保守估計** (部分需要深入調查):
```
✓ 動態模式應該顯示播放控制
✓ Canvas 應該在模式切換時更新
✘ 應該成功切換靜態→動態→靜態 (功能 bug)
✘ 動態模式播放功能應該正常 (功能 bug)
```
改善幅度: +2 tests (75% → 87.5%)

---

## 🗓️ Implementation Roadmap

### Phase 1: getCurrentMode() 修復 (30-60 分鐘)

**時程安排**:
```
15:00 - 15:10  [10 min]  備份原始檔案並閱讀現有代碼
15:10 - 15:30  [20 min]  實施方案 B（多重檢測）
15:30 - 15:40  [10 min]  運行單一測試驗證（mode detection test）
15:40 - 16:00  [20 min]  運行完整 P0 測試套件
```

**檢查點**:
- [ ] 原始檔案已備份至 `navigation.ts.backup`
- [ ] getCurrentMode() 已更新為多重檢測邏輯
- [ ] 測試日誌顯示正確的模式檢測訊息
- [ ] TC-03-001 mode detection test 通過
- [ ] TC-04-001 所有 6 個測試通過

**回滾計劃**:
```bash
# 如果修復失敗，立即回滾
cp tests/helpers/navigation.ts.backup tests/helpers/navigation.ts
```

### Phase 2: Selector 更新 (20-40 分鐘)

**時程安排**:
```
16:00 - 16:10  [10 min]  啟用 debug 模式定位正確 selector
16:10 - 16:20  [10 min]  更新 timeline button selector
16:20 - 16:30  [10 min]  更新 marker detection 邏輯
16:30 - 16:40  [10 min]  驗證測試通過
```

**檢查點**:
- [ ] 使用 Playwright Inspector 確認實際 DOM 結構
- [ ] Timeline button selector 已更新
- [ ] Marker detection 邏輯已更新
- [ ] TC-02-001 兩個測試均通過

**風險**: 如果實際 DOM 結構與預期差異很大，可能需要更多時間

### Phase 3: TC-03-001 調查與修復 (1-2 小時)

**時程安排**:
```
16:40 - 17:00  [20 min]  運行測試獲取詳細錯誤訊息
17:00 - 17:30  [30 min]  逐一分析 4 個失敗測試
17:30 - 18:00  [30 min]  實施修復
18:00 - 18:20  [20 min]  驗證所有測試
18:20 - 18:40  [20 min]  文檔更新與記錄
```

**檢查點**:
- [ ] 所有測試錯誤訊息已記錄
- [ ] 問題分類完成（selector/timing/logic）
- [ ] 至少 2 個測試修復完成
- [ ] 最終測試通過率達到 75% 以上

**彈性安排**: 如果某個測試問題複雜，可暫時跳過，優先修復簡單的

---

## ⚠️ Risk Assessment & Mitigation

### 風險 1: getCurrentMode() 修復引入新問題

**風險等級**: 🟡 Medium
**影響範圍**: 所有依賴模式檢測的測試

**緩解措施**:
1. 完整備份原始檔案
2. 逐步驗證：先測單一 test，再測完整 suite
3. 保留詳細日誌輸出，便於 debug
4. 準備快速回滾方案

**回滾指令**:
```bash
cp tests/helpers/navigation.ts.backup tests/helpers/navigation.ts
npm run test:p0  # 驗證回滾成功
```

### 風險 2: Selector 找不到對應元素

**風險等級**: 🟡 Medium
**影響範圍**: TC-02-001 的 2 個測試

**緩解措施**:
1. 使用多種 selector 策略（role, text, CSS, XPath）
2. 增加合理的等待時間
3. 考慮使用視覺驗證替代 DOM 檢測（如 Canvas 元素）
4. 與開發團隊確認實際 UI 結構

**備選方案**:
如果 DOM selector 完全不可行，改用：
- API 響應驗證
- 截圖視覺比對
- 或標記這些測試為「已知限制」暫時跳過

### 風險 3: 功能實際存在 Bug

**風險等級**: 🔴 High
**影響範圍**: 可能影響 TC-03-001 的部分測試

**識別方法**:
- 如果修復 selector 和 timing 後仍失敗
- 如果手動測試也無法通過
- 如果錯誤訊息指向功能異常

**處理策略**:
1. 記錄詳細的 bug 報告
2. 與開發團隊溝通
3. 將測試標記為 `@skip` 或 `@known-issue`
4. 在文檔中記錄為「阻塞問題」
5. 繼續修復其他可修復的測試

### 風險 4: 時間超支

**風險等級**: 🟢 Low
**影響範圍**: 項目進度

**緩解措施**:
1. 嚴格遵守時間盒（time-boxing）
2. 優先修復高 ROI 的問題
3. 如某個問題卡住超過 30 分鐘，先跳過繼續下一個
4. 記錄未解決的問題，後續再處理

**時間控制原則**:
- Phase 1 必須完成（最高優先級）
- Phase 2 盡量完成（中等優先級）
- Phase 3 視時間彈性調整（可分批處理）

---

## 📈 Success Metrics

### 關鍵績效指標 (KPI)

| 指標 | 當前值 | Phase 1 目標 | Phase 2 目標 | Phase 3 目標 |
|------|--------|-------------|-------------|-------------|
| 測試通過率 | 12.5% (2/16) | 62.5% (10/16) | 75% (12/16) | 87.5%+ (14+/16) |
| 通過測試數 | 2 | 10 | 12 | 14-16 |
| getCurrentMode 準確度 | 0% | 100% | 100% | 100% |
| 3D 模式測試通過率 | 0% (0/6) | 100% (6/6) | 100% (6/6) | 100% (6/6) |

### 驗證檢查清單

#### Phase 1 驗證
```bash
# 1. Mode detection test
npx playwright test tests/e2e/tc-03-001-mode-switch.spec.ts:144
# ✓ 預期: 應該正確偵測當前模式 - PASSED

# 2. All 3D tests
npx playwright test tests/e2e/tc-04-001-3d-mode.spec.ts
# ✓ 預期: 6/6 tests PASSED

# 3. Complete P0 suite
npm run test:p0
# ✓ 預期: At least 10/16 tests PASSED (62.5%+)
```

#### Phase 2 驗證
```bash
# TC-02-001 tests
npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts:37
npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts:126
# ✓ 預期: Both tests PASSED

# Full suite
npm run test:p0
# ✓ 預期: At least 12/16 tests PASSED (75%+)
```

#### Phase 3 驗證
```bash
# TC-03-001 mode switching tests
npx playwright test tests/e2e/tc-03-001-mode-switch.spec.ts
# ✓ 預期: At least 4/6 tests PASSED (模式檢測 + 其他 3-5 個)

# Final complete suite
npm run test:p0
# ✓ 預期: At least 14/16 tests PASSED (87.5%+)
```

### 品質檢查標準

**每個 Phase 完成後必須確認**:
- [ ] 所有通過的測試在本地環境穩定可重現
- [ ] 沒有引入新的失敗測試（regression）
- [ ] 測試執行時間沒有顯著增加（<20% slower）
- [ ] 代碼符合專案的 coding style
- [ ] 有適當的註解和日誌輸出
- [ ] Git commit message 清晰描述改動

### 文檔更新要求

**完成修復後更新**:
1. `dev/implementation-log.md` - 記錄實際執行情況
2. `docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md` - 記錄新發現的問題和解決方案
3. `README.md` 或 `CLAUDE.md` - 更新測試通過率統計
4. Git commit 包含測試報告摘要

---

## 📝 Notes & Observations

### 測試執行觀察

**reload2DTrajectory 修復的成功經驗**:
- ✅ 直接檢測表格可見性比檢測 canvas 更可靠
- ✅ 提供多重後備方案（返回按鈕 → 重新進入賽事）
- ✅ 詳細的控制台日誌幫助快速 debug

**可借鑑到本次修復**:
- 多重檢測策略（getCurrentMode 方案 B）
- 詳細的日誌輸出
- 穩健的錯誤處理

### 潛在改進建議

1. **建立 helper function 測試**
   - 為 `getCurrentMode()` 編寫單元測試
   - 模擬不同的 DOM 狀態
   - 確保邏輯正確性

2. **優化 selector 策略**
   - 建立 `selectors.ts` 統一管理所有 selector
   - 使用 data-testid 屬性（與開發團隊協調）
   - 減少脆弱的 CSS selector 依賴

3. **改進等待策略**
   - 使用自定義 wait helper（如 `waitForMapReady()`）
   - 減少硬編碼的 `waitForTimeout()`
   - 使用更語義化的等待條件

4. **測試穩定性提升**
   - 增加 retry 機制（Playwright 內建）
   - 分離 flaky tests 單獨處理
   - 記錄間歇性失敗的模式

### 參考資源

- **Playwright Best Practices**: https://playwright.dev/docs/best-practices
- **Selector Strategies**: https://playwright.dev/docs/selectors
- **Test Isolation**: https://playwright.dev/docs/test-isolation
- **專案文檔**:
  - `docs/guides/testing-strategies.md`
  - `docs/guides/troubleshooting.md`
  - `docs/architecture/test-framework.md`

---

## 📋 Quick Reference Commands

```bash
# 運行特定測試
npx playwright test tests/e2e/tc-03-001-mode-switch.spec.ts:144

# 運行整個測試文件
npx playwright test tests/e2e/tc-04-001-3d-mode.spec.ts

# 運行 P0 測試套件
npm run test:p0

# Debug 模式（啟用 Inspector）
npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts --debug

# 生成 HTML 報告
npx playwright test --reporter=html
npx playwright show-report

# 查看測試列表
npx playwright test --list

# 只運行失敗的測試
npx playwright test --last-failed

# 備份文件
cp tests/helpers/navigation.ts tests/helpers/navigation.ts.backup

# 回滾修改
cp tests/helpers/navigation.ts.backup tests/helpers/navigation.ts
```

---

## ✅ Completion Checklist

**Phase 1 完成條件**:
- [ ] navigation.ts 已備份
- [ ] getCurrentMode() 已更新為多重檢測邏輯
- [ ] 模式檢測測試通過
- [ ] 所有 6 個 3D 測試通過
- [ ] 測試通過率達到 62.5% 以上
- [ ] 代碼已 commit 並 push

**Phase 2 完成條件**:
- [ ] Timeline button selector 已更新
- [ ] Marker detection 邏輯已更新
- [ ] TC-02-001 兩個測試通過
- [ ] 測試通過率達到 75% 以上
- [ ] 代碼已 commit 並 push

**Phase 3 完成條件**:
- [ ] TC-03-001 至少 2 個測試修復
- [ ] 測試通過率達到 87.5% 以上
- [ ] 所有修復已記錄在 implementation-log.md
- [ ] KNOWN_ISSUES_SOLUTIONS.md 已更新
- [ ] 最終代碼已 commit 並 push

**文檔更新完成條件**:
- [ ] dev/implementation-log.md 記錄完整
- [ ] KNOWN_ISSUES_SOLUTIONS.md 包含新問題和解決方案
- [ ] README 或 CLAUDE.md 統計已更新
- [ ] Git commit message 包含測試報告

---

**計劃結束** - 準備開始執行！
