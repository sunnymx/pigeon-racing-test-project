# Test Plan Fix - Task Checklist

**專案**: P0 測試修復作業
**建立日期**: 2025-11-21
**最後更新**: 2025-11-21
**當前狀態**: Ready to Start

---

## 📋 總覽

- **總任務數**: 14 個主要任務
- **完成任務**: 0/14
- **進度**: 0%
- **預估總時間**: 2-3 小時

---

## 🔴 Phase 1: getCurrentMode() 邏輯修復 (Critical)

**目標**: 修復模式檢測邏輯，解鎖 7 個測試
**預估時間**: 30-60 分鐘
**優先級**: 🔴 Critical

### Task 1.1: 備份與準備
- [ ] 創建 `navigation.ts` 備份檔案
  ```bash
  cp tests/helpers/navigation.ts tests/helpers/navigation.ts.backup
  ```
- [ ] 驗證備份檔案存在
  ```bash
  ls -la tests/helpers/navigation.ts.backup
  ```
- [ ] 閱讀現有 `getCurrentMode()` 代碼 (line 124-142)
- [ ] 理解當前邏輯錯誤的本質

**預估時間**: 10 分鐘
**Acceptance Criteria**:
- ✅ 備份檔案存在且內容完整
- ✅ 理解問題根本原因（按鈕文字與模式的對應關係錯誤）

---

### Task 1.2: 實施多重檢測邏輯
- [ ] 開啟 `tests/helpers/navigation.ts`
- [ ] 定位到 line 124-142
- [ ] 替換為新的三層檢測邏輯：
  - [ ] Layer 1: 檢查 3D 特徵元素（視角1按鈕）
  - [ ] Layer 2: 檢查模式按鈕文字（關鍵修復點）
  - [ ] Layer 3: 檢查地圖容器（後備策略）
- [ ] 添加詳細的 console.log 輸出
- [ ] 保存檔案

**預估時間**: 20 分鐘
**Acceptance Criteria**:
- ✅ 代碼正確實施（無語法錯誤）
- ✅ 包含三層檢測邏輯
- ✅ 每個分支都有日誌輸出
- ✅ 按鈕文字邏輯正確（"3D模式"→當前在2D，"2D模式"→當前在3D）

---

### Task 1.3: 單元測試驗證
- [ ] 運行模式檢測測試
  ```bash
  npx playwright test tests/e2e/tc-03-001-mode-switch.spec.ts:144 \
    --grep "應該正確偵測當前模式" \
    --reporter=line
  ```
- [ ] 檢查測試結果（應該顯示 ✓ PASSED）
- [ ] 查看控制台日誌輸出
- [ ] 確認模式檢測邏輯正確

**預估時間**: 10 分鐘
**Acceptance Criteria**:
- ✅ TC-03-001:144 測試通過
- ✅ 日誌顯示正確的檢測過程
- ✅ 無錯誤或警告

---

### Task 1.4: 完整測試套件驗證
- [ ] 運行所有 3D 模式測試
  ```bash
  npx playwright test tests/e2e/tc-04-001-3d-mode.spec.ts --reporter=line
  ```
- [ ] 驗證所有 6 個測試通過
- [ ] 運行完整 P0 測試套件
  ```bash
  npm run test:p0
  ```
- [ ] 計算新的通過率（預期 ≥ 62.5%，即 10/16 tests）

**預估時間**: 20 分鐘
**Acceptance Criteria**:
- ✅ TC-04-001 所有 6 個測試通過
- ✅ 測試通過率 ≥ 62.5% (10/16)
- ✅ 無新的回歸失敗
- ✅ 測試執行時間未顯著增加

---

### Task 1.5: Git Commit
- [ ] 檢查變更內容
  ```bash
  git diff tests/helpers/navigation.ts
  ```
- [ ] Stage 修改的檔案
  ```bash
  git add tests/helpers/navigation.ts
  ```
- [ ] 創建 commit（使用詳細的 commit message）
- [ ] 驗證 commit 已創建
  ```bash
  git log -1
  ```

**預估時間**: 10 分鐘
**Acceptance Criteria**:
- ✅ Commit message 清晰描述改動
- ✅ 包含測試結果統計
- ✅ 包含 Co-Authored-By 資訊

**Commit Message 模板**:
```
fix: 修復 getCurrentMode() 模式檢測邏輯

- 修正按鈕文字與實際模式的對應關係
- 新增三層檢測策略（視角按鈕 → 模式按鈕文字 → 地圖容器）
- 新增詳細的調試日誌輸出
- 修復 TC-04-001 所有 6 個 3D 測試
- 修復 TC-03-001 模式檢測測試

測試結果:
- 通過率從 12.5% (2/16) 提升到 62.5% (10/16)
- 3D 模式測試通過率: 100% (6/6)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**Phase 1 總檢查點**:
- [ ] 所有 5 個子任務已完成
- [ ] 測試通過率達到 62.5%
- [ ] getCurrentMode() 準確度 100%
- [ ] 代碼已提交到 Git

**Phase 1 回滾觸發條件**（如遇到以下情況立即回滾）:
- [ ] 測試通過率下降
- [ ] 新增失敗數 > 修復數
- [ ] 無法在 60 分鐘內完成

**回滾指令**:
```bash
cp tests/helpers/navigation.ts.backup tests/helpers/navigation.ts
npm run test:p0  # 驗證回滾成功
```

---

## 🟡 Phase 2: Element Selector 更新 (High)

**目標**: 修復 TC-02-001 的 2 個 selector 問題
**預估時間**: 20-40 分鐘
**優先級**: 🟡 High

### Task 2.1: Timeline Button Selector 調查
- [ ] 啟用 Playwright Inspector
  ```bash
  npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts:37 --debug
  ```
- [ ] 在 Inspector 中檢查 Timeline 按鈕的實際 DOM 結構
- [ ] 記錄以下資訊：
  - [ ] 元素的 class name: __________
  - [ ] 元素的 data-* 屬性: __________
  - [ ] 父容器的 class name: __________
  - [ ] 元素的 accessible name: __________
- [ ] 選擇最穩健的 selector 策略
- [ ] 記錄選擇理由

**預估時間**: 10 分鐘
**Acceptance Criteria**:
- ✅ 確認實際 DOM 結構
- ✅ 選擇的 selector 策略已記錄
- ✅ 策略選擇有明確理由

**Selector 選擇決策**:
- [ ] 方案 A: Role-based (推薦)
- [ ] 方案 B: Parent container + Role
- [ ] 方案 C: Text-based
- [ ] 方案 D: CSS class (謹慎使用)

**選擇理由**: __________________________________________

---

### Task 2.2: Marker Detection 邏輯調查
- [ ] 啟用 debug 模式
  ```bash
  npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts:126 --debug
  ```
- [ ] 檢查起點/終點標記的實際渲染方式
- [ ] 確定標記類型：
  - [ ] DOM 元素（可以用 selector）
  - [ ] Canvas 渲染（需改用截圖比對）
  - [ ] API 數據（改用網路驗證）
- [ ] 選擇驗證策略
- [ ] 記錄選擇理由

**預估時間**: 10 分鐘
**Acceptance Criteria**:
- ✅ 確認標記的實際渲染方式
- ✅ 選擇的驗證策略已記錄
- ✅ 策略可重複執行

**驗證策略決策**:
- [ ] 方案 A: DOM selector
- [ ] 方案 B: 截圖比對
- [ ] 方案 C: API 數據驗證 (推薦)

**選擇理由**: __________________________________________

---

### Task 2.3: 實施修復
- [ ] 開啟 `tests/e2e/tc-02-001-2d-static.spec.ts`
- [ ] 修改 Line 60: Timeline button selector
  - [ ] 替換為新的 selector
  - [ ] 增加 timeout 到 10000ms（如需要）
  - [ ] 添加註解說明修改原因
- [ ] 修改 Line 129: Marker detection 邏輯
  - [ ] 實施選擇的驗證策略
  - [ ] 添加註解說明修改原因
- [ ] 保存檔案

**預估時間**: 10 分鐘
**Acceptance Criteria**:
- ✅ 代碼修改完成
- ✅ 無語法錯誤
- ✅ 註解清楚說明修改原因

---

### Task 2.4: 驗證修復
- [ ] 運行 TC-02-001 所有測試
  ```bash
  npx playwright test tests/e2e/tc-02-001-2d-static.spec.ts --reporter=line
  ```
- [ ] 檢查所有 4 個測試結果
  - [ ] 應該顯示完整的軌跡線 ✓
  - [ ] 應該無控制台錯誤 ✓
  - [ ] 應該正確渲染 2D 靜態軌跡 ✓ (新增)
  - [ ] 應該正確顯示起點和終點標記 ✓ (新增)
- [ ] 運行完整 P0 測試套件
  ```bash
  npm run test:p0
  ```
- [ ] 計算新的通過率（預期 ≥ 75%，即 12/16 tests）

**預估時間**: 10 分鐘
**Acceptance Criteria**:
- ✅ TC-02-001 所有 4 個測試通過
- ✅ 測試通過率 ≥ 75% (12/16)
- ✅ 無回歸失敗

---

### Task 2.5: Git Commit
- [ ] 檢查變更內容
  ```bash
  git diff tests/e2e/tc-02-001-2d-static.spec.ts
  ```
- [ ] Stage 修改的檔案
  ```bash
  git add tests/e2e/tc-02-001-2d-static.spec.ts
  ```
- [ ] 創建 commit
- [ ] 驗證 commit

**預估時間**: 5 分鐘
**Acceptance Criteria**:
- ✅ Commit 已創建
- ✅ Commit message 清晰

**Commit Message 模板**:
```
fix: 更新 TC-02-001 element selectors

- 更新 Timeline button selector 為 [選擇的策略]
- 更新 Marker detection 為 [選擇的策略]
- 增加適當的等待時間

測試結果:
- TC-02-001: 4/4 tests passed
- 整體通過率: 75% (12/16)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**Phase 2 總檢查點**:
- [ ] 所有 5 個子任務已完成
- [ ] TC-02-001 所有測試通過 (4/4)
- [ ] 測試通過率達到 75% (12/16)
- [ ] Selector 策略已優化
- [ ] 代碼已提交到 Git

---

## 🟢 Phase 3: TC-03-001 調查與修復 (Medium)

**目標**: 修復剩餘的模式切換測試
**預估時間**: 1-2 小時
**優先級**: 🟢 Medium (彈性安排)

### Task 3.1: 批次執行並收集錯誤訊息
- [ ] 運行 TC-03-001 所有測試
  ```bash
  npx playwright test tests/e2e/tc-03-001-mode-switch.spec.ts \
    --reporter=html \
    --reporter=line
  ```
- [ ] 打開 HTML 報告
  ```bash
  npx playwright show-report
  ```
- [ ] 記錄每個失敗測試的詳細資訊：

**測試 #1: 應該成功切換靜態→動態→靜態** (line 33)
- [ ] 錯誤訊息: __________________________________________
- [ ] 失敗位置: __________________________________________
- [ ] 截圖路徑: __________________________________________
- [ ] 問題分類: □ Selector □ Timing □ Logic □ Bug

**測試 #2: 動態模式應該顯示播放控制** (line 90)
- [ ] 錯誤訊息: __________________________________________
- [ ] 失敗位置: __________________________________________
- [ ] 截圖路徑: __________________________________________
- [ ] 問題分類: □ Selector □ Timing □ Logic □ Bug

**測試 #3: 動態模式播放功能應該正常** (line 111)
- [ ] 錯誤訊息: __________________________________________
- [ ] 失敗位置: __________________________________________
- [ ] 截圖路徑: __________________________________________
- [ ] 問題分類: □ Selector □ Timing □ Logic □ Bug

**測試 #4: Canvas 應該在模式切換時更新** (line 170)
- [ ] 錯誤訊息: __________________________________________
- [ ] 失敗位置: __________________________________________
- [ ] 截圖路徑: __________________________________________
- [ ] 問題分類: □ Selector □ Timing □ Logic □ Bug

**預估時間**: 20 分鐘
**Acceptance Criteria**:
- ✅ 所有錯誤訊息已記錄
- ✅ 截圖已保存
- ✅ 問題已分類

---

### Task 3.2: 問題分類與優先級排序
- [ ] 統計問題類型：
  - [ ] Selector 問題: ____ 個
  - [ ] Timing 問題: ____ 個
  - [ ] Logic 問題: ____ 個
  - [ ] 功能 Bug: ____ 個
- [ ] 按照 ROI 排序修復順序：
  1. [ ] __________________________________________
  2. [ ] __________________________________________
  3. [ ] __________________________________________
  4. [ ] __________________________________________
- [ ] 估算每個問題的修復時間

**預估時間**: 30 分鐘
**Acceptance Criteria**:
- ✅ 所有測試已分類
- ✅ 修復優先級已確定
- ✅ 時間估算已完成

---

### Task 3.3: 逐一修復簡單問題
- [ ] 修復第 1 個問題（最簡單/最高 ROI）
  - [ ] 實施修復
  - [ ] 運行測試驗證
  - [ ] Git commit
- [ ] 修復第 2 個問題
  - [ ] 實施修復
  - [ ] 運行測試驗證
  - [ ] Git commit
- [ ] 修復第 3 個問題（如時間允許）
  - [ ] 實施修復
  - [ ] 運行測試驗證
  - [ ] Git commit
- [ ] 修復第 4 個問題（如時間允許）
  - [ ] 實施修復
  - [ ] 運行測試驗證
  - [ ] Git commit

**預估時間**: 30 分鐘
**Acceptance Criteria**:
- ✅ 至少 2 個測試修復完成
- ✅ 每個修復都有獨立 commit
- ✅ 測試通過率提升

---

### Task 3.4: 處理複雜問題
- [ ] 識別複雜問題（無法在 30 分鐘內修復）
- [ ] 對於每個複雜問題：
  - [ ] 評估是否為功能 bug
  - [ ] 如果是 bug：
    - [ ] 創建詳細的 bug 報告
    - [ ] 更新 `docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md`
    - [ ] 標記測試為 `skip` 或 `known-issue`
  - [ ] 如果不是 bug但複雜：
    - [ ] 記錄為「待深入調查」
    - [ ] 估算需要的時間
    - [ ] 決定是否繼續或延後

**預估時間**: 20-40 分鐘
**Acceptance Criteria**:
- ✅ 所有複雜問題已評估
- ✅ 功能 bug 已記錄
- ✅ `KNOWN_ISSUES_SOLUTIONS.md` 已更新（如有新問題）
- ✅ 測試標記已更新（如有 skip）

---

### Task 3.5: 最終驗證與報告
- [ ] 運行完整 P0 測試套件
  ```bash
  npm run test:p0
  ```
- [ ] 生成 HTML 報告
  ```bash
  npx playwright test --reporter=html
  npx playwright show-report
  ```
- [ ] 統計最終結果：
  - [ ] 總測試數: 16
  - [ ] 通過測試: ____ 個
  - [ ] 失敗測試: ____ 個
  - [ ] 通過率: _____%
- [ ] 創建最終報告（記錄在 `implementation-log.md`）

**預估時間**: 20 分鐘
**Acceptance Criteria**:
- ✅ 測試通過率 ≥ 87.5% (14/16) 或
  - 最低可接受: ≥ 75% (12/16) + 剩餘問題已記錄
- ✅ 所有修復已 commit
- ✅ 最終報告已完成

---

**Phase 3 總檢查點**:
- [ ] 所有 5 個子任務已完成
- [ ] 至少 2 個測試修復完成
- [ ] 測試通過率 ≥ 87.5% 或 ≥ 75% + 問題已記錄
- [ ] 複雜問題已記錄到 `KNOWN_ISSUES_SOLUTIONS.md`
- [ ] 代碼已提交到 Git

---

## 📋 最終檢查清單

### 代碼品質
- [ ] 所有修改都有適當的註解
- [ ] 代碼符合專案 coding style
- [ ] 無語法錯誤或 linting 警告
- [ ] 詳細的日誌輸出（便於 debug）

### 測試穩定性
- [ ] 所有通過的測試連續執行 3 次都通過
- [ ] 無間歇性失敗（flaky tests）
- [ ] 測試執行時間未顯著增加（<20%）

### 文檔更新
- [ ] `dev/active/test-plan-fix/implementation-log.md` 已創建並記錄完整
- [ ] `docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md` 已更新（如有新問題）
- [ ] `CLAUDE.md` 測試通過率統計已更新
- [ ] Git commit messages 包含測試結果

### Git 提交
- [ ] 所有修改已提交到 Git
- [ ] Commit messages 清晰描述改動
- [ ] 包含測試結果統計
- [ ] 包含 Co-Authored-By 資訊

### 知識轉移
- [ ] 修復經驗已記錄
- [ ] 新的最佳實踐已記錄
- [ ] 已知限制已記錄

---

## 📊 進度追蹤

### 整體進度
```
Phase 1: [          ] 0/5 tasks (0%)
Phase 2: [          ] 0/5 tasks (0%)
Phase 3: [          ] 0/5 tasks (0%)
總進度:  [          ] 0/15 tasks (0%)
```

### 測試通過率進度
```
基線:    ██░░░░░░░░░░░░░░  12.5% (2/16)
Phase 1: ░░░░░░░░░░░░░░░░  目標: 62.5% (10/16)
Phase 2: ░░░░░░░░░░░░░░░░  目標: 75.0% (12/16)
Phase 3: ░░░░░░░░░░░░░░░░  目標: 87.5% (14/16)
```

### 時間追蹤
```
預估總時間: 2-3 小時
實際耗時: ________ 小時 ________ 分鐘
效率: ________%
```

---

## ⚠️ 問題追蹤

### 遇到的阻塞問題
1. [ ] 問題描述: __________________________________________
   - 發現時間: __________
   - 影響: __________
   - 解決方案: __________
   - 狀態: □ 已解決 □ 進行中 □ 已記錄待處理

2. [ ] 問題描述: __________________________________________
   - 發現時間: __________
   - 影響: __________
   - 解決方案: __________
   - 狀態: □ 已解決 □ 進行中 □ 已記錄待處理

### 需要升級的問題
- [ ] 問題: __________________________________________
  - 需要協助: □ 技術負責人 □ 開發團隊 □ 其他
  - 升級時間: __________
  - 狀態: __________

---

## 🎯 成功標準確認

### Phase 1 成功標準
- [ ] 測試通過率 ≥ 62.5% (10/16 tests)
- [ ] getCurrentMode() 準確度 100%
- [ ] 所有 3D 模式測試通過 (6/6)
- [ ] 無回歸失敗

### Phase 2 成功標準
- [ ] 測試通過率 ≥ 75% (12/16 tests)
- [ ] TC-02-001 所有測試通過 (4/4)
- [ ] Selector 策略已優化
- [ ] 無回歸失敗

### Phase 3 成功標準
- [ ] 測試通過率 ≥ 87.5% (14/16 tests) 或
  - 最低可接受: ≥ 75% (12/16) + 剩餘問題已記錄
- [ ] 至少 2 個測試修復完成
- [ ] 複雜問題已記錄

### 整體成功標準
- [ ] 最終測試通過率 ≥ 75%
- [ ] 所有修復已記錄
- [ ] 文檔已更新
- [ ] 代碼已提交

---

**Last Updated**: 2025-11-21
**Status**: ⏳ Ready to Start
**Next Review**: 執行完成後
