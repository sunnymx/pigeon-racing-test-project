---
description: 重構龐大的 CLAUDE.md，將詳細內容提取到分類文檔並建立索引
---

智能重構 CLAUDE.md 文檔結構：

**執行前提**：
- CLAUDE.md 文件存在且行數 > 800
- 需要用戶確認重構範圍

**重構流程**：

## 第一階段：分析現有 CLAUDE.md

1. **讀取並統計**
   - 計算當前行數和文件大小
   - 顯示當前結構概覽

2. **識別可提取章節**
   - Phase 實施記錄（歷史內容，如 Phase 1-7 詳細記錄）
   - 詳細實施計劃（未來規劃，如 Priority 1-4）
   - 完整的系統架構說明（Repository Structure）
   - 詳細的功能指南（Batch Processing Guide, Testing Guide）
   - 調試和故障排除詳情
   - 重複或過時內容

3. **生成分析報告**
   - 展示各章節行數分佈
   - 建議提取方案
   - 向用戶確認重構範圍

## 第二階段：創建目錄結構

確保以下目錄存在（如不存在則創建）：

```bash
mkdir -p docs/                      # 開發指南
mkdir -p 2_review/phase_history/    # Phase 開發記錄
mkdir -p 0_spec/[module]/           # 模塊規格（如 api_cost）
```

## 第三階段：提取並創建文檔

**基於分析結果，創建以下類型文檔**：

### A. 開發指南（→ `/docs/`）

1. **REPOSITORY_STRUCTURE.md**
   - 完整的倉庫結構說明
   - 運行時生成的目錄結構
   - 配置文件說明
   - Git workflow

2. **BATCH_PROCESSING_GUIDE.md**
   - Batch API 完整使用指南
   - 工作流程詳解
   - Batch API vs Standard API 對比
   - 調試命令
   - 性能優化建議

3. **TESTING_GUIDE.md**
   - 測試命令完整清單
   - Test data preparation
   - Mock 策略
   - TDD workflow
   - 常見問題解決

4. **PROMPT_ENGINEERING.md**
   - Prompt 設計原則
   - 當前實現分析
   - 版本演進歷史
   - 優化建議

5. **其他主題指南**（按需創建）
   - API_COST_OPTIMIZATION.md
   - DEPLOYMENT_GUIDE.md
   - TROUBLESHOOTING.md

### B. Phase 記錄（→ `/2_review/phase_history/`）

為每個已完成的 Phase 創建獨立文檔：

**格式**: `phase_X_[title].md`

**內容包括**：
- Status & Timeline
- Success Summary
- Key Achievements
- Technical Highlights
- Critical Discoveries
- Breaking Changes
- Verification Results
- Related Documentation

**範例**：
- `phase_1-5_summary.md`
- `phase_6_batch_api_integration.md`
- `phase_7_pipeline_optimization.md`

### C. 優化路線圖（→ `/0_spec/[module]/`）

1. **optimization_roadmap.md**
   - Known Limitations & Issues
   - Priority 1-4 詳細計劃
   - Implementation Checklist
   - Expected Outcomes
   - Rollback Plan
   - Cost Analysis
   - Future Ideas

## 第四階段：重構主 CLAUDE.md

**保留核心內容**（目標：400-500 行）：

1. **項目概述** (~30 行)
   - 簡潔的項目介紹
   - 當前分支和重點
   - 關鍵特性列表

2. **🚨 開發前必讀** (~20 行)
   - 關鍵 API 文檔引用
   - 重要注意事項

3. **🗺️ 重要文檔參考** (~80 行) ⭐ 核心新增
   - 使用表情符號標註系統：
     * 🔥 必讀
     * ⭐⭐⭐ 重要
     * 🚨 關鍵
     * ✅ 已完成
     * 💰 成本相關
     * 📁 結構相關

   - 分類結構：
     ```markdown
     ### 📘 Gemini API 技術文檔 (必讀！)
     - **API 技術參考總覽**: `/path/to/file.md` 🔥

     ### 📚 開發指南
     - **倉庫結構**: `/docs/REPOSITORY_STRUCTURE.md` 📁
     - **批次處理指南**: `/docs/BATCH_PROCESSING_GUIDE.md` 🔄

     ### 🏗️ 架構與規格
     - **產品需求文檔**: `/PRD_Invoice_Parser.md` 📋

     ### 📜 開發歷史 (Phase 記錄)
     - **Phase X**: `/2_review/phase_history/phase_X.md` ✅

     ### 🐛 調試與問題解決
     - **調試記錄**: `/2_review/debug/...` 🔬

     ### 📚 重要文檔模式
     **永遠在這裡添加重要文檔！** 當你創建或發現：
     - 新的架構設計 → 在這裡添加參考路徑
     - 問題解決方案 → 在這裡添加參考路徑
     - Phase 實施記錄 → 在這裡添加參考路徑

     這可以防止上下文丟失！
     ```

4. **Quick Start** (~30 行)
   - Environment Setup
   - Application Execution
   - 基本命令

5. **System Architecture** (~30 行)
   - 架構圖（文字描述）
   - 關鍵架構模式

6. **Core Modules** (~50 行)
   - 核心模塊簡介
   - 按類別分組

7. **Essential Commands** (~60 行)
   - Testing Commands
   - Batch Processing Commands
   - Debugging Commands

8. **🚨 Critical Implementation Notes** (~80 行)
   - ROC Calendar Preservation
   - Batch API Limitations
   - Image Processing Dependencies
   - API Rate Limiting
   - Data Schema Compliance

9. **Current Development Status** (~30 行)
   - 當前 Phase 狀態
   - Next Priorities
   - 引用詳細 Phase 記錄

10. **Code Quality Standards** (~20 行)

11. **Quick Reference** (~20 行)

**移除內容**（已提取到獨立文檔）：
- ❌ Phase 詳細實施過程（>500 行）
- ❌ 完整的實施計劃（>300 行）
- ❌ 詳細的故障排除步驟
- ❌ 完整的測試指南
- ❌ Repository Structure 詳細說明

## 第五階段：驗證與確認

1. **路徑驗證**
   ```bash
   # 檢查所有引用的文檔是否存在
   grep -o '\[.*\](.*\.md)' CLAUDE.md | ...
   ```

2. **統計新結構**
   - 主 CLAUDE.md 新行數
   - 新創建文檔數量
   - 總體內容大小

3. **生成重構摘要報告**
   ```
   ✅ 重構完成摘要：
   - 主文件: 1490 行 → 454 行 (69% 精簡)
   - 新建文檔: 8 個
   - 文檔索引: 🗺️ 章節已建立
   - 所有路徑: ✅ 驗證通過
   ```

4. **提供後續建議**
   - 如何使用新結構
   - 如何維護文檔索引
   - 回滾方案（如需要）

---

**重構原則（效仿 indexCLAUDE.md）**：

1. ✅ **主文件保持簡潔** - 快速參考和文檔索引
2. ✅ **詳細內容分類清晰** - 按主題獨立文檔
3. ✅ **版本控制友好** - 特定更改不影響主文件
4. ✅ **保持上下文** - 完整的文檔引用鏈
5. ✅ **即時更新提示** - 提醒開發者維護索引

**預期成果**：

| 指標 | 重構前 | 重構後 | 改善 |
|------|--------|--------|------|
| 主文件行數 | >1000 行 | 400-500 行 | ⬇️ 60-70% |
| 可維護性 | 低 | 高 | ⬆️⬆️⬆️ |
| 查找速度 | 慢 | 快 | ⬆️⬆️⬆️ |
| 文檔總數 | 1 個 | 8-12 個 | ⬆️ 800% |

**使用範例**：
```
/refactor-claude-md
```

**注意事項**：
- 執行前會先分析並請求確認
- 支援自定義提取範圍
- 自動備份原始 CLAUDE.md (CLAUDE.md.backup_YYYYMMDD_HHMMSS)
- 所有路徑自動驗證
