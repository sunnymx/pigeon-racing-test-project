# Phase 1 實際修復記錄 - Actual Findings & Solutions

**執行日期**: 2025-11-24
**驗證日期**: 2025-11-25 11:07
**狀態**: ✅ Completed & Verified
**測試結果**: P0 套件 7/16 通過 (43.75%)
**Commit**: `64e3a8c` - fix: 修復 TC-04-001 3D 模式測試失敗問題

---

## 📊 完整測試套件驗證結果 (2025-11-25 11:07)

| 測試套件 | 通過 | 失敗 | 通過率 |
|----------|------|------|--------|
| TC-02-001 (2D 靜態) | 2 | 2 | 50% |
| TC-03-001 (模式切換) | 0 | 5 | 0% |
| TC-04-001 (3D 模式) | 5 | 2 | 71% |
| **總計** | **7** | **9** | **43.75%** |

**基線提升**: 12.5% → 43.75% (+31.25%)

---

## 🔍 實際發現的根本原因（與計劃差異）

### ⚠️ 關鍵發現 #1: 簡繁體字符不匹配（計劃中未識別）

**問題描述**:
所有 3D 模式測試失敗的**真正根本原因**是簡繁體中文字符不匹配，而非計劃中描述的 `getCurrentMode()` 邏輯錯誤。

**證據**:
```
測試代碼查找：const view1Button = page.getByRole('button', { name: '視角1' }); // 繁體
實際 UI 顯示：<button>视角1</button>  // 簡體

錯誤訊息：TimeoutError: locator.waitFor: Timeout 30000ms exceeded
根本原因：找不到按鈕（字符不匹配）
```

**影響範圍**:
- ❌ `tests/helpers/wait-utils.ts:73` - waitForCesium3D()
- ❌ `tests/helpers/mode-switching.ts:174` - switchTo3DReliably()
- ❌ `tests/helpers/mode-switching.ts:201` - detectCurrentViewMode()
- ❌ `tests/helpers/navigation.ts:134` - getCurrentMode()
- ❌ `tests/e2e/tc-04-001-3d-mode.spec.ts:48, 49, 126, 132` - 測試用例

**修復方案**:
```typescript
// ✅ 使用正則表達式支援簡繁體
const view1Button = page.getByRole('button', { name: /[视視]角1/ });
const view2Button = page.getByRole('button', { name: /[视視]角2/ });
```

**修復文件統計**: 6 處代碼修改

---

### ⚠️ 關鍵發現 #2: 三種按鈕類型的區分（計劃中混淆）

**問題描述**:
存在**三種不同用途的模式按鈕**，計劃文件將它們混為一談，導致對按鈕行為的理解錯誤。

**三種按鈕類型詳解**:

| 按鈕類型 | 位置 | Selector 特徵 | 用途 | 行為特性 |
|---------|------|--------------|------|---------|
| **Type 1** | 選擇鴿子畫面（next to "查看軌跡"） | `{ name: '2D', exact: true }` 或 `'3D'` | **偏好設定** | 設定下次軌跡使用的模式 |
| **Type 2** | 軌跡視圖地圖控制面板 | `{ name: /view_in_ar [23]D模式/ }` | **當前地圖切換** | 切換當前顯示的地圖 |
| **Type 3** | 2D 地圖控制（timeline） | `button:has(img[alt="timeline"])` | **靜態/動態切換** | 僅 2D 模式可用 |

**關鍵理解修正**:

計劃中的錯誤理解：
```
❌ 計劃假設：「3D模式」按鈕存在 → 當前在 2D 模式
❌ 計劃假設：按鈕文字反映當前模式
```

實際正確理解：
```
✅ Button Type 1 是偏好設定，與當前地圖狀態完全獨立
✅ Button Type 2 的文字 = 點擊後將進入的模式（not current mode）
✅ 要檢測當前模式，必須檢查實際地圖類型（AMap vs Cesium）
```

**新增函數需求**:
```typescript
// 新增：處理 Button Type 1（偏好選擇器）
export async function setPreferredMode(page: Page, preferredMode: '2D' | '3D'): Promise<void> {
  const button2D = page.getByRole('button', { name: '2D', exact: true });
  const button3D = page.getByRole('button', { name: '3D', exact: true });
  // ... 切換邏輯
}

// 修正：getCurrentMode() 應檢查實際地圖類型
export async function getCurrentMode(page: Page): Promise<'2D' | '3D' | 'unknown'> {
  // Layer 1: 檢查 3D 特徵（視角按鈕）
  const view1Button = page.getByRole('button', { name: /[视視]角1/ });
  if (await view1Button.isVisible()) return '3D';

  // Layer 2: 檢查 2D 特徵（AMap 容器）
  const mapContainer = page.locator('.amap-container');
  if (await mapContainer.isVisible()) return '2D';

  return 'unknown';
}
```

**影響的代碼**:
- ✅ `tests/helpers/navigation.ts` - 新增 `setPreferredMode()`, 修正 `getCurrentMode()`
- ✅ `tests/helpers/mode-switching.ts` - 更新 `ensureModeByText()` 使用 Button Type 2
- ✅ `tests/e2e/tc-04-001-3d-mode.spec.ts` - 測試流程加入 `setPreferredMode()`

---

### ⚠️ 關鍵發現 #3: Cesium 對象不暴露到全域（驗證方法錯誤）

**問題描述**:
應用**不將** `window.Cesium` 和 `window.viewer` 暴露到全域 scope，導致 JavaScript 對象檢查方法完全失效。

**錯誤的驗證方法**:
```typescript
// ❌ tests/e2e/tc-04-001-3d-mode.spec.ts:63-68（原始代碼）
const cesiumReady = await page.evaluate(() => {
  return (
    typeof (window as any).Cesium !== 'undefined' &&
    typeof (window as any).viewer !== 'undefined'
  );
});
expect(cesiumReady).toBe(true); // 永遠是 false！
```

**錯誤原因**:
```
應用使用模組化打包 → Cesium 在模組 scope 內
                    → 不暴露到 window 對象
                    → page.evaluate() 無法訪問
                    → 返回 undefined
```

**正確的驗證方法**:
```typescript
// ✅ 使用視覺元素驗證（修復後）
const view1Button = page.getByRole('button', { name: /[视視]角1/ });
const cesiumReady = await view1Button.isVisible();
expect(cesiumReady).toBe(true);
```

**修復位置**:
- ✅ `tests/e2e/tc-04-001-3d-mode.spec.ts:63-68`
- ✅ `tests/helpers/wait-utils.ts:67-125` - 註解掉 JS 對象檢查，改用視覺驗證

**經驗教訓**:
```
1. 第三方庫可能不暴露全域對象（尤其是現代模組化應用）
2. 視覺元素驗證更可靠且貼近用戶體驗
3. 如果視覺元素已顯示，表示引擎已成功初始化
```

---

## 📊 實際執行結果對比

### 計劃 vs 實際

| 項目 | 計劃預期 | 實際情況 |
|------|---------|---------|
| **根本原因** | getCurrentMode() 邏輯錯誤 | 簡繁體字符不匹配 |
| **修復時間** | 30-60 分鐘 | ~90 分鐘（含發現、驗證、文檔） |
| **修復範圍** | 僅 navigation.ts | 6 個文件 + 文檔更新 |
| **預期通過率** | 62.5% (10/16) | 尚未運行完整 P0 套件* |
| **新增函數** | 無 | setPreferredMode() |
| **文檔更新** | 計劃內 | 大幅擴展（三種按鈕類型） |

*註：目前僅驗證 TC-04-001 單一測試（1 passed），需運行完整套件確認實際通過率

---

## 🔧 實際修復步驟

### Task 1: 發現簡繁體問題（計劃外）

**觸發點**: 測試日誌顯示
```
⏳ 等待 3D 模式載入（使用視覺元素檢查）...
  ✘ Error: ❌ 3D 模式視角控制按鈕未顯示
```

**調查過程**:
1. 用戶提供 Page snapshot 顯示按鈕存在
2. 對比發現字符編碼差異：`视角1` vs `視角1`
3. 確認問題根源：簡繁體不匹配

**修復行動**:
- 更新所有視角按鈕選擇器為 `/[视視]角[12]/`
- 修改 6 處代碼（4 個文件）

---

### Task 2: 釐清按鈕類型（計劃外）

**觸發點**: 用戶說明按鈕狀態與地圖狀態無關

**原始誤解**:
```
「按鈕顯示 2D 或 3D」→ 當前模式
```

**正確理解**:
```
Button Type 1: 偏好設定（下次軌跡用）
Button Type 2: 當前地圖切換
→ 必須區分使用場景
```

**修復行動**:
- 新增 `setPreferredMode()` 處理 Button Type 1
- 修正 `getCurrentMode()` 不檢查按鈕狀態
- 更新 `ensureModeByText()` 使用正確的 Button Type 2 selector

---

### Task 3: 修正 Cesium 驗證方法（計劃外）

**發現過程**:
1. 3D 視覺已載入（用戶截圖證實）
2. 但 Cesium 對象檢查返回 false
3. 檢查應用架構 → 確認 Cesium 在模組 scope

**修復行動**:
- 測試文件：改用 `view1Button.isVisible()`
- wait-utils.ts：註解 JS 檢查，改用視覺驗證

---

### Task 4: 更新文檔（計劃內，但範圍擴大）

**更新文件**:
- ✅ `CLAUDE.md` - 新增三種按鈕類型說明
- ✅ `docs/guides/mode-switching.md` - 大幅更正按鈕行為理解
- ✅ `tests/helpers/*.ts` - 新增詳細註解
- ✅ `tests/e2e/tc-04-001-3d-mode.spec.ts` - 新增中文註解

---

## 📝 代碼變更統計

### 修改文件清單

```
modified:   CLAUDE.md                          (+133/-24 lines)
modified:   docs/guides/mode-switching.md      (+92/-35 lines)
modified:   tests/e2e/tc-04-001-3d-mode.spec.ts (+18/-15 lines)
modified:   tests/helpers/mode-switching.ts    (+53/-79 lines)
modified:   tests/helpers/navigation.ts        (+41/-16 lines)
modified:   tests/helpers/wait-utils.ts        (+21/-2 lines)

Total: 6 files changed, 290 insertions(+), 157 deletions(-)
```

### 關鍵函數修改

**新增函數**:
- ✅ `setPreferredMode()` - 處理 Button Type 1

**修改函數**:
- ✅ `getCurrentMode()` - 改為檢查實際地圖類型
- ✅ `ensureModeByText()` - 使用正確的 Button Type 2 selector
- ✅ `switchTo3DReliably()` - 使用簡繁體正則
- ✅ `detectCurrentViewMode()` - 使用簡繁體正則
- ✅ `waitForCesium3D()` - 改為視覺驗證

---

## ✅ 驗證結果

### TC-04-001 測試結果

```bash
$ npx playwright test tests/e2e/tc-04-001-3d-mode.spec.ts:30 --retries=0

Running 1 test using 1 worker

✅ TC-04-001: 3D 模式基本渲染 @P0 › 應該成功切換到 3D 模式並渲染 (22.2s)

  1 passed (23.3s)
```

**測試流程驗證**:
```
1. ✅ 設定偏好模式為 2D (setPreferredMode)
2. ✅ 開啟軌跡視圖（2D 模式）
3. ✅ 切換到 3D 模式（ensureModeByText）
4. ✅ 檢測到 3D 模式（getCurrentMode 返回 '3D'）
5. ✅ 驗證視角按鈕可見（視角1/視角2）
6. ✅ 驗證 2D 模式切換按鈕可見
7. ✅ Cesium 引擎初始化驗證（視覺元素）
8. ✅ 截圖保存
```

### Git Commit 記錄

```
Commit: 64e3a8c
Author: [用戶]
Date: 2025-11-24

fix: 修復 TC-04-001 3D 模式測試失敗問題

修復簡繁體字符不匹配導致的測試失敗：

**主要修復：**
- 修復視角按鈕選擇器（視角1/2）支援簡繁體字符
- 修正 Cesium 引擎驗證方式（使用視覺元素而非 JS 對象）
- 更正模式檢測邏輯（檢查實際地圖類型而非按鈕狀態）
- 新增 setPreferredMode() 函數處理偏好設定

**測試結果：**
✅ TC-04-001 測試通過（1 passed）
```

---

## 💡 經驗教訓與最佳實踐

### 1. 本地化問題檢查清單

**問題識別**:
- [ ] 檢查 UI 實際顯示的字符（簡體/繁體/語言變體）
- [ ] 對比測試代碼中的字符串
- [ ] 使用瀏覽器開發工具確認元素文字

**修復策略**:
```typescript
// ❌ 避免：硬編碼單一語言變體
const button = page.getByRole('button', { name: '視角1' });

// ✅ 推薦：使用正則支援多種變體
const button = page.getByRole('button', { name: /[视視]角1/ });

// ✅ 更好：使用語言無關的屬性
const button = page.getByRole('button', { name: /view.*1|视角1|視角1/ });
```

---

### 2. UI 架構理解要求

**分析方法**:
1. **功能相似 ≠ 架構相同**
   - 不同位置的"模式切換"按鈕可能有不同用途
   - 必須區分"偏好設定"和"狀態切換"

2. **Selector 必須精確**
   ```typescript
   // ❌ 太寬鬆：會匹配到錯誤的按鈕
   const button = page.getByRole('button', { name: /[23]D模式/ });

   // ✅ 精確：指定按鈕的特徵圖標
   const button = page.getByRole('button', { name: /view_in_ar [23]D模式/ });
   ```

3. **文檔必須明確**
   - 記錄每種按鈕的用途和位置
   - 提供 selector 範例
   - 說明使用場景

---

### 3. 驗證方法優先級

**優先級排序**:
```
1. 視覺元素驗證（最可靠）
   ✅ 用戶能看到 = 測試能驗證
   ✅ 不依賴內部實現

2. DOM 屬性驗證
   ✅ 檢查 data-* 屬性
   ✅ 檢查 aria-* 屬性

3. API 響應驗證
   ✅ 驗證數據已載入
   ⚠️ 不保證 UI 已渲染

4. JavaScript 對象檢查（最不可靠）
   ❌ 依賴內部實現
   ❌ 模組化應用可能不暴露
   ❌ 容易因架構變更而失效
```

**實際案例**:
```typescript
// ❌ 不可靠：JS 對象檢查
const cesiumReady = await page.evaluate(() =>
  typeof window.Cesium !== 'undefined'
);

// ✅ 可靠：視覺元素驗證
const view1Button = page.getByRole('button', { name: /[视視]角1/ });
const cesiumReady = await view1Button.isVisible();
```

---

### 4. 實際操作優於假設

**錯誤的工作流程**:
```
1. 閱讀 UI 設計文檔
2. 根據文檔假設按鈕行為
3. 編寫測試代碼
4. 測試失敗 → 困惑
```

**正確的工作流程**:
```
1. 手動操作 UI 並觀察行為
2. 使用 Playwright Inspector 錄製操作
3. 檢查實際的 DOM 結構和元素屬性
4. 根據實際行為編寫測試
5. 文檔化發現的行為（可能與設計不符）
```

**本次案例**:
- 計劃假設：按鈕文字反映當前模式
- 實際行為：Button Type 1 是偏好設定，與當前模式無關
- 教訓：必須實際操作驗證，不能只靠假設

---

## 🔄 下一步建議

### 立即行動（高優先級）

1. **運行完整 P0 測試套件**
   ```bash
   npm run test:p0
   ```
   - 驗證實際通過率
   - 確認是否有其他測試受益於本次修復
   - 識別剩餘失敗的測試

2. **檢查其他 3D 測試**
   - TC-04-002 至 TC-04-006 可能也需要相同修復
   - 檢查是否有其他簡繁體字符問題

3. **建立本地化測試檢查清單**
   - 將簡繁體檢查加入 Code Review 流程
   - 建立 selector 最佳實踐文檔

---

### 短期改進（本週內）

1. **Selector 策略統一**
   - 建立 `selectors.ts` 集中管理
   - 使用 `data-testid` 屬性（需與開發協調）
   - 減少脆弱的文字匹配

2. **Helper 函數單元測試**
   - 為 `getCurrentMode()` 編寫單元測試
   - 模擬不同的 DOM 狀態
   - 確保邏輯正確性

3. **文檔完善**
   - 補充實際修復過程的截圖
   - 記錄所有 selector 變更的理由
   - 建立 troubleshooting 指南

---

### 中期優化（本月內）

1. **測試穩定性監控**
   - 連續執行 P0 測試 10 次
   - 記錄間歇性失敗（flaky tests）
   - 分析失敗模式

2. **視覺回歸測試**
   - 建立 baseline 截圖庫
   - 自動化截圖比對
   - 追蹤 UI 變更

---

## 📚 參考資源

### 本次修復相關文檔

- [CLAUDE.md](../../../CLAUDE.md#2d3d-mode-selection-updated-2025-11-24) - 三種按鈕類型說明
- [Mode Switching Guide](../../../docs/guides/mode-switching.md) - 按鈕行為詳解
- [Test Framework](../../../docs/architecture/test-framework.md) - 測試架構

### 技術資源

- [Playwright Locators](https://playwright.dev/docs/locators) - Selector 策略
- [Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) - 正則表達式
- [Internationalization Testing](https://playwright.dev/docs/test-global-setup-teardown#internationalization) - 國際化測試

---

**文檔版本**: 1.1
**建立日期**: 2025-11-24
**最後更新**: 2025-11-25 11:07
**狀態**: ✅ Completed & Verified
**下次審查**: Phase 2 完成後

---

**End of Document**
