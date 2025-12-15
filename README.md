# 賽鴿追蹤系統 - 前端自動化測試專案

> 使用 Playwright 建立 E2E 自動化測試，驗證賽鴿 GPS 追蹤系統的 2D/3D 軌跡顯示功能

[![Playwright Tests](https://github.com/sunnymx/pigeon-racing-test-project/actions/workflows/playwright.yml/badge.svg)](https://github.com/sunnymx/pigeon-racing-test-project/actions/workflows/playwright.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

---

## 快速開始

### 安裝

```bash
# 克隆專案
git clone https://github.com/sunnymx/pigeon-racing-test-project.git
cd pigeon-racing-test-project

# 安裝依賴
npm install

# 安裝 Playwright 瀏覽器
npx playwright install chromium
```

### 執行測試

```bash
# 執行所有測試
npx playwright test

# 使用 list 報告格式（顯示進度）
npx playwright test --reporter=list

# 執行特定測試案例
npx playwright test tc-01    # 首頁測試
npx playwright test tc-03    # 2D 靜態軌跡
npx playwright test tc-05    # 3D 模式

# 生成 HTML 報告
npx playwright test --reporter=html
npx playwright show-report
```

### GitHub Actions CI

測試報告自動部署到 GitHub Pages：
- **報告網址**：https://sunnymx.github.io/pigeon-racing-test-project/
- **觸發方式**：手動觸發（Actions → Run workflow）

---

## 測試架構

### 11 個測試案例

| TC | 檔案 | 說明 | 優先級 |
|----|------|------|--------|
| 01 | `tc-01-001-homepage.spec.ts` | 首頁賽事列表 | P0 |
| 02 | `tc-02-001-race-entry.spec.ts` | 進入賽事 | P0 |
| 03 | `tc-03-001-2d-static.spec.ts` | 2D 靜態軌跡 | P0 |
| 04 | `tc-04-001-2d-dynamic.spec.ts` | 2D 動態模式 | P0 |
| 05 | `tc-05-001-3d-mode.spec.ts` | 3D 模式 | P0 |
| 06 | `tc-06-001-trajectory-details.spec.ts` | 軌跡詳情 | P0 |
| 07 | `tc-07-001-multi-select.spec.ts` | 多選鴿子 | P1 |
| 08 | `tc-08-001-loft-list.spec.ts` | 鴿舍列表 | P1 |
| 09 | `tc-09-001-checkbox-panel.spec.ts` | 選擇面板 | P2 |
| 10 | `tc-10-001-radar-mode.spec.ts` | 雷達模式 | P2 |
| 11 | `tc-11-001-error-monitoring.spec.ts` | 錯誤監控 | P0 |

### Helper 模組

| 模組 | 功能 |
|------|------|
| `fixtures.ts` | 共用 Setup 函數 (setupHomepage, setup2DTrajectory 等) |
| `mode-switching.ts` | 2D/3D 模式切換 |
| `trajectory.ts` | 軌跡操作與驗證 |
| `trajectory-details.ts` | 軌跡詳情頁操作 |
| `multi-select.ts` | 多選鴿子功能 |
| `loft-list.ts` | 鴿舍列表操作 |
| `checkbox-panel.ts` | 複選框面板 |
| `radar-mode.ts` | 雷達模式 |
| `error-monitor.ts` | 控制台錯誤監控 |

---

## 專案結構

```
pigeon-racing-test-project/
├── tests/
│   ├── e2e/                     # 測試案例 (11 個)
│   │   └── tc-*.spec.ts
│   └── helpers/                 # Helper 模組 (9 個)
│
├── spec/
│   └── USER_JOURNEY_RECORD/     # 測試規格 (11 個記錄點)
│       ├── #01-homepage/
│       ├── #02-race-entry/
│       ├── ...
│       └── #11-error-monitor/
│
├── archive/                     # 封存區
│   ├── tests/                   # 舊版測試代碼
│   ├── docs/                    # 所有文檔
│   └── dev/                     # 已完成開發分支
│
├── .github/workflows/
│   └── playwright.yml           # GitHub Actions CI
│
├── playwright.config.ts         # Playwright 配置
├── CLAUDE.md                    # Claude Code 開發指南
└── README.md                    # 本文件
```

---

## 團隊協作流程

### 流程圖

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Week 0: 規格確認                                                         │
│                                                                         │
│  PM ──→ 確認前端開發規格                                                 │
│    │                                                                    │
│    ├──→ 更新 spec/USER_JOURNEY_RECORD/                                  │
│    │                                                                    │
│    └──→ 通知後端預計部署時間                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Week 1-2: 並行開發                                                       │
│                                                                         │
│  前端 ──→ 功能開發                                                       │
│                                          (同時進行)                      │
│  後端 ──→ 根據 spec/ 準備測試案例                                        │
│           └──→ 可先寫框架，細節等部署後調整                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Week 2 末: 部署測試區                                                    │
│                                                                         │
│  前端 ──→ 部署到測試伺服器                                               │
│                                                                         │
│  後端 ──→ 執行自動測試 (npx playwright test)                             │
│                                                                         │
│  QA   ──→ 執行手動測試                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 測試結果判斷 (PM 主導)                                                   │
│                                                                         │
│  手動 ✗  自動 ✗  ──→ 前端 bug，前端修復                                  │
│  手動 ✓  自動 ✗  ──→ 測試程式問題，後端修改測試                           │
│  手動 ✓  自動 ✓  ──→ 通過，準備上線                                      │
│  手動 ✗  自動 ✓  ──→ 測試涵蓋不足，後端補測試                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 角色職責

| 角色 | 職責 | 關注文件 |
|------|------|----------|
| **PM** | 規格確認、測試結果判斷、協調 | `spec/`、測試報告 |
| **前端** | 功能開發、bug 修復 | 自己的代碼 |
| **後端** | 測試代碼開發與維護 | `tests/`、`spec/` |
| **QA** | 手動測試執行、問題回報 | 測試區網站、`spec/` |

### 時間預留建議

| 階段 | 建議時間 | 說明 |
|------|----------|------|
| 規格確認 | 1-2 天 | PM + 前端對齊 |
| 測試準備 | 與前端開發並行 | 後端不用等前端完成 |
| 測試執行 | 1 天 | 自動測試 + 手動測試 |
| Bug 修復 | 預留 2-3 天 | buffer |

### 規格變更通知機制

```
前端開發中發現需改規格
         ↓
通知 PM（Slack / 會議）
         ↓
PM 評估影響 → 更新 spec/USER_JOURNEY_RECORD/
         ↓
PM 通知後端調整測試案例
```

**重點**：規格變更要有紀錄，避免測試與實際功能脫節

---

## 測試目標網站

- **網址**：https://hungdev.skyracing.com.cn/
- **功能**：賽鴿 GPS 追蹤系統
- **地圖引擎**：
  - 2D 模式：AMap (高德地圖)
  - 3D 模式：Cesium

---

## 開發指南

### 添加新測試

1. 在 `tests/e2e/` 創建 `tc-XX-001-*.spec.ts`
2. 使用 `tests/helpers/fixtures.ts` 的 Setup 函數
3. 參考 `spec/USER_JOURNEY_RECORD/` 的規格

### 修改 Helper

1. 在 `tests/helpers/` 修改對應模組
2. 確保向後相容
3. 文檔參考: `archive/docs/architecture/helper-functions.md`

### 已知問題

| 問題 | 解決方案 |
|------|----------|
| 2D 軌跡初始載入失敗 | 重新選擇鴿子 |
| 靜態/動態模式混淆 | 計算標記點數量（≥15 靜態） |
| 軌跡點點擊無響應 | 使用 `.amap-icon > img` + `force: true` |
| 數據載入時序 | 等待 2-3 秒 |

詳細說明: `archive/docs/guides/troubleshooting.md`

---

## Git 配置

```bash
# 推送到主倉庫
git push origin main

# 推送到團隊倉庫
git push minxin main
```

---

## 專案狀態

**最後更新**：2025-12-15

| 項目 | 狀態 |
|------|------|
| 測試案例 | 11 個 (P0: 7, P1: 2, P2: 2) |
| Helper 模組 | 9 個 |
| 測試規格 | 11 個記錄點 |
| GitHub Actions | 手動觸發 + Pages 部署 |

---

## 授權

MIT License
