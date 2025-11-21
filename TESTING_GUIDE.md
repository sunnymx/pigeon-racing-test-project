# 測試執行快速指南

## 🚀 快速開始（5 分鐘）

### 1. 首次設置

```bash
# 安裝依賴
npm install

# 安裝 Playwright 瀏覽器
npx playwright install chromium
```

### 2. 執行 P0 測試

```bash
# 方式 1: 只執行 P0 測試（推薦）
npm run test:p0

# 方式 2: UI 模式（可視化）
npm run test:ui

# 方式 3: Headed 模式（顯示瀏覽器）
npm run test:headed
```

### 3. 查看報告

```bash
npm run report
```

---

## 📋 測試案例清單

### P0 測試（必須通過）

✅ **TC-02-001: 2D 靜態軌跡渲染** (4 測試)
- 正確渲染 2D 靜態軌跡
- 顯示完整的軌跡線
- 顯示起點和終點標記
- 無控制台錯誤

✅ **TC-03-001: 靜態/動態模式切換** (5 測試)
- 成功切換靜態→動態→靜態
- 動態模式顯示播放控制
- 動態模式播放功能正常
- 正確偵測當前模式
- Canvas 在模式切換時更新

✅ **TC-04-001: 3D 模式基本渲染** (7 測試)
- 成功切換到 3D 模式並渲染
- Cesium 引擎正確初始化
- 視角切換功能正常
- 3D 播放控制可用
- 顯示軌跡點控制
- 3D 和 2D 模式可來回切換
- 3D 模式顯示速度滑塊

**總計**: 16 個測試

---

## 🎯 執行命令參考

### 基本執行

```bash
# 執行所有測試
npm test

# 執行 P0 測試
npm run test:p0

# 執行特定文件
npx playwright test tc-02-001-2d-static.spec.ts

# 執行特定測試
npx playwright test -g "應該正確渲染 2D 靜態軌跡"
```

### 開發模式

```bash
# UI 模式（推薦，可視化操作）
npm run test:ui

# Headed 模式（顯示瀏覽器）
npm run test:headed

# Debug 模式（逐步除錯）
npm run test:debug
```

### 報告生成

```bash
# 生成並打開 HTML 報告
npm run report

# 查看 JSON 結果
cat test-results.json
```

---

## ⚠️ 重要注意事項

### 測試超時

- **單一測試**: 90 秒（地圖載入需時）
- **3D 測試**: 120 秒（Cesium 引擎需時）
- 如果測試超時，這是正常的，可能需要調整超時設定

### 網路要求

- 測試需要連接到 https://skyracing.com.cn
- 需要良好的網路連接（地圖瓦片載入）
- 如果網路不穩定，可能導致測試失敗

### 已知問題

所有 4 個已知問題都已在 helper 函數中解決：

1. ✅ **2D 初次載入失敗** → 使用 `switchTo2DReliably()`
2. ✅ **靜態/動態模式混淆** → 使用 `detectCurrentViewMode()`
3. ✅ **軌跡點點擊無響應** → 使用 `clickTrajectoryPoint()`
4. ✅ **數據載入時序問題** → 使用 `waitForModeSwitch()`

---

## 📊 預期結果

### 成功執行

```
Running 16 tests using 2 workers

  ✓ TC-02-001: 2D 靜態軌跡渲染 @P0 › 應該正確渲染 2D 靜態軌跡 (45s)
  ✓ TC-02-001: 2D 靜態軌跡渲染 @P0 › 應該顯示完整的軌跡線 (30s)
  ✓ TC-02-001: 2D 靜態軌跡渲染 @P0 › 應該正確顯示起點和終點標記 (25s)
  ✓ TC-02-001: 2D 靜態軌跡渲染 @P0 › 應該無控制台錯誤 (35s)

  ✓ TC-03-001: 2D 靜態/動態模式切換 @P0 › 應該成功切換靜態→動態→靜態 (40s)
  ✓ TC-03-001: 2D 靜態/動態模式切換 @P0 › 動態模式應該顯示播放控制 (30s)
  ✓ TC-03-001: 2D 靜態/動態模式切換 @P0 › 動態模式播放功能應該正常 (35s)
  ✓ TC-03-001: 2D 靜態/動態模式切換 @P0 › 應該正確偵測當前模式 (30s)
  ✓ TC-03-001: 2D 靜態/動態模式切換 @P0 › Canvas 應該在模式切換時更新 (35s)

  ✓ TC-04-001: 3D 模式基本渲染 @P0 › 應該成功切換到 3D 模式並渲染 (50s)
  ✓ TC-04-001: 3D 模式基本渲染 @P0 › Cesium 引擎應該正確初始化 (45s)
  ✓ TC-04-001: 3D 模式基本渲染 @P0 › 視角切換功能應該正常 (40s)
  ✓ TC-04-001: 3D 模式基本渲染 @P0 › 3D 播放控制應該可用 (35s)
  ✓ TC-04-001: 3D 模式基本渲染 @P0 › 應該顯示軌跡點控制 (30s)
  ✓ TC-04-001: 3D 模式基本渲染 @P0 › 3D 和 2D 模式應該可以來回切換 (45s)
  ✓ TC-04-001: 3D 模式基本渲染 @P0 › 3D 模式應該顯示速度滑塊 (30s)

  16 passed (8m)
```

### 生成的文件

```
screenshots/
├── tc-02-001-2d-static.png          # 2D 靜態模式截圖
├── trajectory-line-validation.png   # 軌跡線驗證
├── 2d-static-mode.png               # 2D 靜態模式
├── 2d-dynamic-mode.png              # 2D 動態模式
├── tc-04-001-3d-mode.png            # 3D 模式截圖
├── 3d-view1.png                     # 3D 視角1
└── 3d-view2.png                     # 3D 視角2

playwright-report/
└── index.html                       # HTML 測試報告

test-results.json                    # JSON 測試結果
```

---

## 🔧 常見問題排解

### Q1: 測試失敗，出現 "Timeout" 錯誤

**可能原因**:
- 網路連接不穩定
- 地圖載入過慢
- Cesium 3D 引擎初始化時間過長

**解決方案**:
```typescript
// 在測試中增加超時時間
test.setTimeout(120000); // 120 秒
```

### Q2: 測試失敗，出現 "gpx2d undefined" 錯誤

**原因**: 沒有使用可靠的 2D 切換序列

**解決方案**:
```typescript
// 錯誤方式
await page.getByRole('button', { name: '2D模式' }).click();

// 正確方式
await switchTo2DReliably(page);  // 使用 3D→2D 序列
```

### Q3: 無法判斷當前是靜態還是動態模式

**解決方案**:
```typescript
const mode = await detectCurrentViewMode(page);
console.log(`當前模式：${mode}`);  // '2D-static' 或 '2D-dynamic'
```

### Q4: 點擊軌跡點無反應

**解決方案**:
```typescript
// 使用 helper 函數
await clickTrajectoryPoint(page, 0);  // 點擊第一個軌跡點
```

### Q5: 模式切換後數據未載入

**解決方案**:
```typescript
// 切換後使用等待函數
await switchTo2DReliably(page);
await waitForModeSwitch(page, '2D');  // 包含額外等待
```

---

## 📚 詳細文檔

- **測試 README**: [tests/README.md](tests/README.md)
- **Phase 2 實作報告**: [docs/test-plan/PHASE2_IMPLEMENTATION_REPORT.md](docs/test-plan/PHASE2_IMPLEMENTATION_REPORT.md)
- **測試計劃總覽**: [docs/test-plan/TEST_PLAN_OVERVIEW.md](docs/test-plan/TEST_PLAN_OVERVIEW.md)
- **詳細測試用例**: [docs/test-plan/TEST_CASES.md](docs/test-plan/TEST_CASES.md)
- **測試框架架構**: [docs/architecture/test-framework.md](docs/architecture/test-framework.md)

---

## 💡 最佳實踐

### 1. 首次執行建議

```bash
# 使用 UI 模式觀察測試流程
npm run test:ui
```

### 2. CI/CD 執行建議

```bash
# Headless 模式，生成報告
npm run test:p0
npm run report
```

### 3. Debug 測試失敗

```bash
# Debug 模式，逐步執行
npm run test:debug

# 或查看失敗時的截圖
ls screenshots/
```

---

## 🎉 成功指標

測試成功的標準：

- ✅ 所有 16 個測試通過
- ✅ 執行時間 < 10 分鐘
- ✅ 無嚴重控制台錯誤
- ✅ 截圖正常生成

---

**最後更新**: 2025-11-18
**測試版本**: v1.0.0
**狀態**: Phase 2 完成 - P0 測試已實作
