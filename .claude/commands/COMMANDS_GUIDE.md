# Slash Commands 使用指南

**Last Updated**: 2025-11-21

---

## 📋 開發計劃命令對比

### `/dev-docs` vs `/dev-atom-docs`

兩個命令都提供**相同品質**的戰略計劃，差異僅在於輸出的檔案組織方式。

| 特性 | `/dev-docs` | `/dev-atom-docs` |
|------|-------------|------------------|
| **計劃品質** | ✅ 完整戰略計劃 | ✅ 完整戰略計劃（相同） |
| **任務詳細度** | ✅ 詳細清單和驗收標準 | ✅ 詳細清單和驗收標準（相同） |
| **風險評估** | ✅ 完整風險分析 | ✅ 完整風險分析（相同） |
| **輸出結構** | 3 個文件 | 4+ 個文件 |
| **任務組織** | 單一 tasks.md | 拆分為多個 T###.md |
| **適用規模** | **< 20 任務** | **> 20 任務** |
| **維護方式** | 編輯單一文件 | 編輯多個小文件 |
| **Git 友好度** | 中等 | 更好（小文件 diff） |
| **並行協作** | 較難（易衝突） | 較易（獨立文件） |

---

## 🎯 何時使用哪個命令？

### 使用 `/dev-docs`

✅ **適合情境**：
- 任務總數 < 20 個
- 短期專案（< 1 週）
- 單人開發
- 偏好簡單的單一文件

📝 **範例**：
```
/dev-docs 修復 Vue 初始化問題
/dev-docs 添加新的 API endpoint
/dev-docs 重構資料庫查詢邏輯
```

**輸出結構**：
```
dev/active/project-name/
├── project-name-plan.md      # 完整戰略計劃
├── project-name-context.md   # 背景與決策
└── project-name-tasks.md     # 單一任務清單文件
```

---

### 使用 `/dev-atom-docs`

✅ **適合情境**：
- 任務總數 > 20 個
- 長期專案（> 1 個月）
- 多人協作
- 需要細粒度的進度追蹤
- 重視 Git 歷史清晰度

📝 **範例**：
```
/dev-atom-docs Filter 功能位置重構
/dev-atom-docs 完整的認證系統重構
/dev-atom-docs 微服務架構遷移
```

**輸出結構**：
```
dev/active/project-name/
├── project-name-plan.md      # 完整戰略計劃（與 dev-docs 相同）
├── project-name-context.md   # 背景與決策（與 dev-docs 相同）
├── project-name-index.md     # 任務索引和儀表板
└── tasks/                    # 原子化任務目錄
    ├── T001-task-name.md
    ├── T002-task-name.md
    ├── T003-task-name.md
    └── ...
```

---

## 📊 內容品質保證

**重要**：兩個命令的計劃內容**完全相同**，只是組織方式不同。

### 相同的品質標準

1. **戰略計劃** (`*-plan.md`)
   - Executive Summary
   - Current State Analysis
   - Proposed Future State
   - Implementation Phases
   - Risk Assessment
   - Success Metrics
   - Timeline Estimates

2. **背景文檔** (`*-context.md`)
   - Key Files and Locations
   - Technical Decisions
   - Dependencies
   - Architecture Considerations

3. **任務內容**
   - ✅ 詳細的操作清單（不縮減）
   - ✅ 完整的驗收標準
   - ✅ 測試步驟和驗證方法
   - ✅ 風險評估和緩解策略
   - ✅ 時間估算

### 唯一差異：檔案組織

**`/dev-docs`** → 所有任務在一個文件：
```markdown
# project-name-tasks.md

## Phase 1: Task A
- [ ] Step 1
- [ ] Step 2
Acceptance Criteria:
- [ ] Criterion 1

## Phase 1: Task B
- [ ] Step 1
- [ ] Step 2
Acceptance Criteria:
- [ ] Criterion 1
```

**`/dev-atom-docs`** → 每個任務獨立文件：
```
tasks/T001-task-a.md:
# T001: Task A
- [ ] Step 1
- [ ] Step 2
Acceptance Criteria:
- [ ] Criterion 1

tasks/T002-task-b.md:
# T002: Task B
- [ ] Step 1
- [ ] Step 2
Acceptance Criteria:
- [ ] Criterion 1
```

---

## 🔧 實際使用範例

### 範例 1：小型 Bug 修復（使用 `/dev-docs`）

```bash
# 命令
/dev-docs 修復 Phase 3 Vue 初始化錯誤

# 生成結果
dev/active/phase3-vue-fix/
├── phase3-vue-fix-plan.md
├── phase3-vue-fix-context.md
└── phase3-vue-fix-tasks.md    # 包含 9 個任務

# 工作流程
1. 開啟 phase3-vue-fix-tasks.md
2. 逐一勾選完成的項目
3. 單一文件，簡單直接
```

---

### 範例 2：大型功能重構（使用 `/dev-atom-docs`）

```bash
# 命令
/dev-atom-docs Filter 功能位置重構計劃

# 生成結果
dev/active/filter-relocation/
├── filter-relocation-plan.md
├── filter-relocation-context.md
├── filter-relocation-index.md
└── tasks/
    ├── T001-prepare-environment.md        # Phase 1
    ├── T002-code-analysis.md              # Phase 1
    ├── T003-simplify-filter-panel.md      # Phase 2
    ├── T004-enhance-tracklist-panel.md    # Phase 2
    ├── T005-filter-section-css.md         # Phase 3
    ├── T006-css-testing.md                # Phase 3
    ├── T007-add-state.md                  # Phase 4
    ├── T008-add-action.md                 # Phase 4
    ├── T009-core-functionality-test.md    # Phase 5
    ├── T010-regression-test.md            # Phase 5
    ├── T011-edge-case-test.md             # Phase 5
    ├── T012-update-docs.md                # Phase 6
    └── T013-cleanup-commit.md             # Phase 6

# 工作流程
1. 查看 filter-relocation-index.md 了解全局
2. 開啟 tasks/T001-prepare-environment.md
3. 完成後更新 index.md 狀態（手動）
4. 開啟 tasks/T002-code-analysis.md
5. Git commit 每個完成的任務（清晰的歷史）
```

---

## 🎓 學習建議

### 新手建議

1. **先使用 `/dev-docs`**
   - 熟悉計劃結構
   - 理解任務分解方式
   - 體驗完整的工作流程

2. **當遇到以下情況時切換到 `/dev-atom-docs`**
   - 任務清單超過 20 項，滾動不便
   - 需要多人協作，文件衝突頻繁
   - 想要更清晰的 Git 歷史記錄

### 進階使用

**混合使用**：
- 大型功能用 `/dev-atom-docs`
- 小型修復用 `/dev-docs`
- 根據專案規模靈活選擇

**版本控制最佳實踐**：
```bash
# dev-docs: 單一 commit
git add dev/active/project/
git commit -m "feat: complete project tasks"

# dev-atom-docs: 每個任務一個 commit
git add dev/active/project/tasks/T001-*.md
git commit -m "feat(T001): complete environment setup"

git add dev/active/project/tasks/T002-*.md
git commit -m "feat(T002): complete code analysis"
```

---

## 🔗 相關資源

- [CLAUDE.md](../../CLAUDE.md) - 完整的專案開發指南
- [dev-docs.md](dev-docs.md) - 單一文件任務計劃命令
- [dev-atom-docs.md](dev-atom-docs.md) - 原子化任務計劃命令
- [dev-docs-update.md](dev-docs-update.md) - 文檔更新命令

---

## ❓ 常見問題

### Q: 我可以從 dev-docs 轉換到 dev-atom-docs 嗎？

A: 可以！手動將 tasks.md 中的每個任務區塊複製到獨立的 T###.md 文件即可。保持內容完整性最重要。

### Q: 哪個命令生成的計劃更好？

A: **完全相同品質**。兩者使用相同的計劃邏輯，只是輸出格式不同。選擇適合你專案規模的即可。

### Q: 我必須手動更新 index.md 的狀態嗎？

A: 是的。這個設計是為了保持簡單性，避免引入腳本依賴。手動更新也讓你對進度有更清晰的掌握。

### Q: 可以混合使用兩種命令嗎？

A: 可以！同一個 `dev/active/` 目錄下可以有不同格式的子專案。根據每個專案的特性選擇合適的命令。

---

**Last Updated**: 2025-11-21
**Maintained By**: Claude Code Development Team
