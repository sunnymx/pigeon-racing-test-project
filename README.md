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
│   ├── PIGEON_RACING_TEST_PROJECT.md    # 專案詳細規格
│   ├── DEPLOYMENT_PLAN.md               # 部署計劃書
│   ├── MVP_PLAYWRIGHT_MCP_PLAN.md       # MVP 測試計劃
│   └── TEST_REPORT.md                   # 測試報告
├── mvp_test/                   # MVP 測試記錄
│   ├── README.md               # MVP 測試說明
│   ├── test_log.md             # 測試執行日誌
│   ├── data_samples/           # 提取的數據範例
│   └── screenshots/            # 測試截圖
├── tests/                      # 測試代碼（未來開發）
│   ├── e2e/                    # E2E 測試
│   ├── visual/                 # 視覺測試
│   ├── validators/             # 數據驗證器
│   └── utils/                  # 工具函數
├── config/                     # 配置文件
├── .mcp.json                   # MCP 配置
├── .gitignore                  # Git 忽略文件
└── README.md                   # 本文件
```

---

## 🚀 快速開始

### 前置需求

- Node.js v18 或更高版本
- Claude Code CLI
- 穩定的網路連接

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

### 核心文檔

- [專案詳細規格](docs/PIGEON_RACING_TEST_PROJECT.md) - 完整的測試需求和規格說明
- [部署計劃書](docs/DEPLOYMENT_PLAN.md) - CI/CD 部署方案和成本分析
- [MVP 測試計劃](docs/MVP_PLAYWRIGHT_MCP_PLAN.md) - MVP 階段測試執行計劃
- [測試報告](docs/TEST_REPORT.md) - 最新測試結果和問題記錄

### MVP 測試資料

- [MVP 測試說明](mvp_test/README.md) - MVP 測試階段的目標和結果
- [測試執行日誌](mvp_test/test_log.md) - 詳細的測試步驟記錄
- [測試截圖](mvp_test/screenshots/) - 測試過程中的視覺記錄

---

## 🔍 測試重點

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

### 近期計劃

- [ ] 完成測試腳本開發（基於 MVP 驗證結果）
- [ ] 實作數據驗證器 (`validators/`)
- [ ] 配置 GitHub Actions CI/CD
- [ ] 整合 Slack 通知

### 中期計劃

- [ ] 增加更多測試案例
- [ ] 實作視覺回歸測試
- [ ] 性能監控功能
- [ ] 測試報告可視化

### 長期計劃

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

**最後更新**：2025-11-17

**專案狀態**：MVP 測試完成 ✅ | 開發中 🚧
