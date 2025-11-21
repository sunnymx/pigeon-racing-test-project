# 賽鴿追蹤系統 - 前端自動化測試專案

> 使用 Playwright MCP 建立智能化的前端測試流程，自動檢測異常數據、驗證 UI 功能、確保地圖渲染正確

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-MCP-blue)](https://playwright.dev/)

---

## 📋 專案概述

本專案針對賽鴿追蹤系統 (https://skyracing.com.cn/) 建立自動化測試套件，主要功能包括：

- ✅ **異常數據檢測**：自動識別飛行數據異常（距離、速度、高度等）
- ✅ **地圖渲染驗證**：確保飛行軌跡正確顯示
- ✅ **航點數據驗證**：檢查航點數據的連續性和邏輯一致性
- ✅ **跨瀏覽器測試**：支援 Chrome、Safari、Mobile 等多平台
- ✅ **視覺回歸測試**：未來擴展功能

### 技術棧

- **測試框架**：Playwright (基於 Accessibility Tree)
- **視覺驗證**：Midscene.js + UI-TARS/Qwen-VL（可選）
- **開發語言**：TypeScript
- **CI/CD**：GitHub Actions
- **自動化工具**：Playwright MCP

---

## 🏗️ 專案結構

```
pigeon-racing-test-project/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD 配置
├── docs/                       # 專案文檔
│   ├── development-plan/       # 📅 開發計劃
│   │   ├── README.md                    # 開發計劃總覽
│   │   ├── ROADMAP.md                   # 完整的 3 階段路線圖
│   │   └── DOCUMENTS_CHECKLIST.md       # 文檔建立檢查清單
│   ├── architecture/           # 🏗️ 測試框架架構
│   │   └── test-framework.md           # 測試框架架構設計
│   ├── technical-architecture/ # 🏗️ 技術架構 (Phase 1 Day 3)
│   │   ├── SYSTEM_ARCHITECTURE.md      # 系統架構總覽
│   │   └── DEPENDENCY_GRAPH.md         # 技術依賴圖
│   ├── data-model/             # 📊 數據模型 (Phase 1 Day 3)
│   │   └── ENTITY_RELATIONSHIP.md      # 實體關係圖
│   ├── information-architecture/ # 🗺️ 資訊架構
│   │   ├── SITE_MAP.md                 # 網站結構地圖
│   │   └── PAGE_FLOWS.md               # 頁面導航流程 (Phase 1 Day 3)
│   ├── guides/                 # 📖 測試指南
│   │   ├── README.md                   # 指南索引
│   │   ├── mode-switching.md           # 2D/3D 模式切換指南
│   │   ├── troubleshooting.md          # 問題排解指南
│   │   ├── testing-strategies.md       # 測試策略指南
│   │   └── playwright-workflow.md      # Playwright MCP 工作流程
│   ├── test-plan/              # 📋 自動化測試計劃文檔
│   │   ├── TEST_PLAN_OVERVIEW.md       # 測試計劃總覽
│   │   ├── TEST_CASES.md               # 詳細測試用例（35+）
│   │   ├── KNOWN_ISSUES_SOLUTIONS.md   # 已知問題與解決方案
│   │   └── PLAYWRIGHT_MCP_WORKFLOW.md  # Playwright MCP 工作流程
│   ├── api-reference/          # 🔌 API 接口參考
│   │   └── API_ENDPOINTS.md            # API 接口文檔（6個端點）
│   ├── user-research/          # 👥 用戶研究 (Phase 1)
│   │   ├── USER_PERSONAS.md            # 用戶角色定義
│   │   └── USER_JOURNEYS.md            # 用戶旅程地圖
│   ├── features/               # ⚙️ 功能清單 (Phase 1)
│   │   └── FEATURE_CATALOG.md          # 完整功能清單 (33個功能)
│   ├── user-workflows/         # 🔄 用戶流程 (Phase 1)
│   │   └── COMPLETE_USER_JOURNEYS.md   # 端到端用戶旅程
│   ├── test-coverage/          # 📊 測試覆蓋 (Phase 1)
│   │   ├── USER_JOURNEY_TEST_MAPPING.md # 旅程-測試映射
│   │   └── FEATURE_TEST_MAPPING.md     # 功能-測試映射
│   ├── GIT_SETUP.md                    # Git 倉庫配置指南
│   ├── PIGEON_RACING_TEST_PROJECT.md   # 專案詳細規格
│   ├── DEPLOYMENT_PLAN.md              # 部署計劃書
│   ├── MVP_PLAYWRIGHT_MCP_PLAN.md      # MVP 測試計劃
│   └── TEST_REPORT.md                  # 互動測試報告（v0.1.0）
├── mvp_test/                   # MVP 測試記錄
│   ├── README.md               # MVP 測試說明
│   ├── test_log.md             # 測試執行日誌
│   ├── data_samples/           # 提取的數據範例
│   └── screenshots/            # 測試截圖
├── tests/                      # 測試代碼（規劃中）
│   ├── e2e/                    # E2E 測試腳本
│   │   ├── 01-race-list.spec.ts
│   │   ├── 02-track-2d-static.spec.ts
│   │   ├── 03-track-2d-playback.spec.ts
│   │   ├── 04-track-3d-playback.spec.ts
│   │   ├── 05-loft-list.spec.ts
│   │   ├── 06-trajectory-detail.spec.ts
│   │   └── 07-ui-elements.spec.ts
│   ├── helpers/                # 輔助函數模組
│   │   ├── navigation.ts
│   │   ├── mode-switching.ts
│   │   ├── trajectory-utils.ts
│   │   ├── loft-list.ts
│   │   ├── validators.ts
│   │   └── wait-utils.ts
│   ├── screenshots/            # 測試截圖
│   │   └── baseline/           # 基準截圖
│   ├── visual/                 # 視覺測試（未來）
│   └── utils/                  # 工具函數
├── config/                     # 配置文件
├── CLAUDE.md                   # Claude Code 快速參考指南 (新增)
├── playwright.config.ts        # Playwright 配置（待創建）
├── .mcp.json                   # MCP 配置
├── .gitignore                  # Git 忽略文件
└── README.md                   # 本文件
```

---

## 🚀 快速開始

### 前置需求

- Node.js v18 或更高版本
- Claude Code CLI
- Git 和 GitHub 帳號
- 穩定的網路連接

### Git 配置

本專案同時維護兩個 GitHub 遠程倉庫，詳細配置請參閱 **[Git 倉庫配置指南](docs/GIT_SETUP.md)**

**快速配置**：
```bash
# 查看已配置的遠程倉庫
git remote -v

# 推送到主倉庫 (sunnymx)
git push origin main

# 推送到團隊倉庫 (MinXinCorp)
git push minxin main
```

### 安裝步驟

#### 1. 克隆專案

```bash
git clone https://github.com/your-username/pigeon-racing-test-project.git
cd pigeon-racing-test-project
```

#### 2. 安裝依賴（未來）

```bash
npm install
npx playwright install
```

#### 3. 配置 Playwright MCP

```bash
# 專案級配置
claude mcp add playwright npx @playwright/mcp@latest --scope project

# 驗證安裝
claude mcp list
```

#### 4. 執行測試（未來開發）

```bash
# 執行所有測試
npm test

# 執行 E2E 測試
npm run test:e2e

# 執行視覺測試
npm run test:visual

# 有頭模式（可見瀏覽器）
npm run test:headed

# 調試模式
npm run test:debug
```

---

## 📚 文檔

### 🚀 快速開始

- **[CLAUDE.md](CLAUDE.md)** - Claude Code 快速參考指南
  - 關鍵警告和陷阱
  - 快速設定指令
  - 文檔導航索引

### 📅 開發計劃

- **[開發路線圖](docs/development-plan/ROADMAP.md)** - 完整的 3 階段開發計劃
  - Phase 1: 核心架構文檔 (2-3天)
  - Phase 2: P0 測試實作 (3-5天)
  - Phase 3: 逐步擴展 (按需進行)
- **[文檔建立檢查清單](docs/development-plan/DOCUMENTS_CHECKLIST.md)** - 追蹤文檔建立進度
  - 10 個核心架構文檔清單
  - 狀態追蹤和完成度統計
  - 詳細的文檔規格說明

### 🏗️ 架構文檔

**測試框架架構**:
- **[測試框架架構](docs/architecture/test-framework.md)** - 測試框架設計
  - Helper 函數模組設計
  - 測試用例優先級系統 (P0/P1/P2)
  - 數據驗證框架

**技術架構文檔** (Phase 1 Day 3 完成):
- **[系統架構總覽](docs/technical-architecture/SYSTEM_ARCHITECTURE.md)** - 完整系統架構
  - 前端/後端架構
  - 地圖引擎集成 (AMap 2.0 / Cesium)
  - 狀態管理和數據流
- **[技術依賴圖](docs/technical-architecture/DEPENDENCY_GRAPH.md)** - 依賴關係和等待策略
  - AMap 2.0 / Cesium 依賴
  - API 調用依賴鏈
  - 等待策略和時序分析

**數據模型**:
- **[實體關係圖](docs/data-model/ENTITY_RELATIONSHIP.md)** - 數據模型和驗證規則
  - 核心實體定義 (Race, Pigeon, Trajectory等)
  - 實體關係 (ER Diagram)
  - 數據驗證框架和規則

**資訊架構** (Phase 1 完成):
- **[網站結構地圖](docs/information-architecture/SITE_MAP.md)** - 完整頁面結構
- **[頁面導航流程](docs/information-architecture/PAGE_FLOWS.md)** - 導航流程和決策點
  - 頁面轉換流程圖
  - 關鍵決策點分析
  - 錯誤處理流程

### 📖 測試指南

- **[指南索引](docs/guides/README.md)** - 所有測試指南導航
- **[2D/3D 模式切換指南](docs/guides/mode-switching.md)** - 模式選擇深入解析
- **[問題排解指南](docs/guides/troubleshooting.md)** - 4 個已知問題 + 解決方案
- **[測試策略指南](docs/guides/testing-strategies.md)** - 三重驗證、等待模式
- **[Playwright 工作流程](docs/guides/playwright-workflow.md)** - 互動式測試流程

### 🎯 測試計劃

完整的測試計劃文檔套件，包含 35+ 測試用例、25+ 輔助函數設計：

- [📋 測試計劃總覽](docs/test-plan/TEST_PLAN_OVERVIEW.md) - 完整測試策略、範圍與執行計劃
- [📝 詳細測試用例](docs/test-plan/TEST_CASES.md) - 35+ 條詳細測試用例（P0/P1/P2優先級）
- [⚠️ 已知問題解決方案](docs/test-plan/KNOWN_ISSUES_SOLUTIONS.md) - 4個已驗證的問題解決方案
- [🚀 Playwright MCP 工作流程](docs/test-plan/PLAYWRIGHT_MCP_WORKFLOW.md) - 交互式測試調適完整指南

### 🔌 API 參考

- **[API 接口文檔](docs/api-reference/API_ENDPOINTS.md)** - 6 個核心 API 端點文檔

### 📋 專案文檔

- [專案詳細規格](docs/PIGEON_RACING_TEST_PROJECT.md) - 完整的測試需求和規格說明
- [部署計劃書](docs/DEPLOYMENT_PLAN.md) - CI/CD 部署方案和成本分析
- [MVP 測試計劃](docs/MVP_PLAYWRIGHT_MCP_PLAN.md) - MVP 階段測試執行計劃
- [互動測試報告](docs/TEST_REPORT.md) - v0.1.0 測試結果和問題記錄
- [Git 倉庫配置指南](docs/GIT_SETUP.md) - 雙遠程倉庫配置與常用命令

### 🧪 MVP 測試資料

- [MVP 測試說明](mvp_test/README.md) - MVP 測試階段的目標和結果
- [測試執行日誌](mvp_test/test_log.md) - 詳細的測試步驟記錄
- [測試截圖](mvp_test/screenshots/) - 測試過程中的視覺記錄

---

## 🔍 測試重點

### 2D/3D 模式選擇驗證

**關鍵發現** (TC-03-008)：
- ✅ 按鈕顯示文字（"2D" 或 "3D"）指示將進入的模式
- ✅ 按鈕顯示 "3D" → 點擊「查看軌跡」→ 進入 3D 模式（Cesium 引擎）
- ✅ 按鈕顯示 "2D" → 點擊「查看軌跡」→ 進入 2D 模式（AMap 平面地圖）

```typescript
// 正確的模式選擇驗證方法
const buttonText = await modeButton.textContent();
if (buttonText.includes('3D')) {
  // 按鈕顯示 "3D" 表示將進入 3D 模式
  await expect(page.getByRole('button', { name: '視角1' })).toBeVisible();
} else {
  // 按鈕顯示 "2D" 表示將進入 2D 模式
  await expect(page.getByRole('button', { name: 'view_in_ar 3D模式' })).toBeVisible();
}
```

### 異常數據檢測

本專案的核心功能之一是自動檢測飛行數據異常，例如：

```typescript
// 異常數據範例
{
  "actual_distance": 46168.05,  // km - ❌ 異常！正常範圍: 1-1000 km
  "actual_speed": 106529.36,    // m/Min - ❌ 異常！正常範圍: 0-10000 m/Min
}
```

### 驗證規則

```typescript
const STANDARD_RULES = {
  avgSpeed: { min: 800, max: 2000 },        // 平均分速 (m/Min)
  maxSpeed: { min: 1000, max: 2500 },       // 最高分速
  avgAltitude: { min: 0, max: 3000 },       // 平均高度 (m)
  maxAltitude: { min: 0, max: 5000 },       // 最大高度
  actualDistance: { min: 1, max: 1000 },    // 實際距離 (km)
  straightDistance: { min: 1, max: 800 },   // 直線距離 (km)
};
```

---

## 🧪 測試案例（規劃中）

### E2E 測試

- `01-page-load.spec.ts` - 頁面載入和基礎功能測試
- `02-flight-data-validation.spec.ts` - 飛行數據驗證
- `03-waypoints-validation.spec.ts` - 航點數據驗證

### 視覺測試

- `map-rendering.spec.ts` - 地圖渲染測試
- `ui-consistency.spec.ts` - UI 一致性測試

---

## 📊 測試報告

### MVP 測試成果

- ✅ 成功驗證 Playwright MCP 可提取所有核心數據
- ✅ 成功識別異常數據（距離、速度異常）
- ✅ 完成 2D 軌跡功能測試
- ✅ 產出完整測試報告和截圖記錄

詳細報告請參閱：[TEST_REPORT.md](docs/TEST_REPORT.md)

---

## 🛠️ 開發指南

### 使用 Claude Code 進行測試

```bash
# 啟動 Claude Code
claude

# 執行測試指令範例
使用 playwright mcp 打開 https://skyracing.com.cn/
提取飛行數據並驗證是否有異常
```

### 添加新的測試案例

1. 在 `tests/e2e/` 或 `tests/visual/` 創建新的 `.spec.ts` 文件
2. 實作測試邏輯
3. 執行測試驗證
4. 提交 Pull Request

---

## 🤝 貢獻指南

歡迎貢獻！請遵循以下步驟：

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 📋 待辦事項

### ✅ 已完成

- [x] 完成測試計劃文檔（5個核心文檔）
- [x] 設計 35+ 測試用例
- [x] 設計 25+ 輔助函數
- [x] 記錄已知問題與解決方案（4個）
- [x] 整理 API 接口文檔（6個端點）

### 🚀 近期計劃（第一優先）

- [ ] 創建 Playwright 配置文件 (`playwright.config.ts`)
- [ ] 實作核心輔助函數模組（基於設計文檔）
  - [ ] `navigation.ts` - 導航輔助
  - [ ] `mode-switching.ts` - 模式切換（含問題#1/#2解決方案）
  - [ ] `trajectory-utils.ts` - 軌跡操作（含問題#3解決方案）
  - [ ] `wait-utils.ts` - 等待策略（含問題#4解決方案）
- [ ] 完成 P0 優先級測試腳本開發
  - [ ] `02-track-2d-static.spec.ts`
  - [ ] `03-track-2d-playback.spec.ts`
  - [ ] `04-track-3d-playback.spec.ts`

### 📊 中期計劃

- [ ] 完成 P1/P2 測試腳本
- [ ] 配置 GitHub Actions CI/CD
- [ ] 整合 Slack 通知
- [ ] 實作數據驗證器 (`validators/`)
- [ ] 建立截圖基準庫

### 🎯 長期計劃

- [ ] 實作視覺回歸測試
- [ ] 性能監控功能
- [ ] 測試報告可視化
- [ ] API 測試整合
- [ ] 跨瀏覽器測試擴展
- [ ] 歷史數據趨勢分析

---

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件

---

## 📞 聯絡資訊

- **專案維護者**：[Your Name]
- **Email**：your.email@example.com
- **Issue Tracker**：[GitHub Issues](https://github.com/your-username/pigeon-racing-test-project/issues)

---

## 🙏 致謝

- [Playwright](https://playwright.dev/) - 強大的瀏覽器自動化框架
- [Claude Code](https://claude.ai/) - AI 驅動的開發工具
- [Midscene.js](https://midscenejs.com/) - 視覺驗證工具

---

**最後更新**：2025-11-18

**專案狀態**：
- ✅ MVP 測試完成
- ✅ 測試計劃文檔完成（35+ 測試用例）
- ✅ **Phase 1 完成** - 核心架構文檔 (10個文檔)
- ✅ 文檔一致性驗證完成
- ✅ TC-03-008 測試用例已更正並驗證
- 🚧 Phase 2: P0 測試實作準備中

**文檔統計**：
- 📋 測試用例：35+
- 🔧 輔助函數：25+ (designed)
- 🔌 API 端點：6
- ⚠️ 已知問題：4（已解決）
- 🏗️ 架構文檔：10 (Phase 1 完成)

**近期更新** (2025-11-18)：
- ✅ **Phase 1 Day 3 完成** - 技術架構文檔
  - ✅ SYSTEM_ARCHITECTURE.md - 系統架構總覽
  - ✅ DEPENDENCY_GRAPH.md - 技術依賴圖
  - ✅ ENTITY_RELATIONSHIP.md - 數據模型ER圖
  - ✅ PAGE_FLOWS.md - 頁面導航流程
- ✅ 更新 CLAUDE.md 和 README.md 索引
- 📊 Phase 1 進度：10/10 文檔 (100%)
