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
# 執行所有測試（34 個獨立測試）
npx playwright test user-journey

# 使用 list 報告格式（顯示進度）
npx playwright test user-journey --reporter=list

# 生成 HTML 報告
npx playwright test user-journey --reporter=html
npx playwright show-report

# 執行特定階段
npx playwright test stage-3    # 2D 靜態軌跡
npx playwright test stage-5    # 3D 模式
```

### GitHub Actions CI

測試報告自動部署到 GitHub Pages：
- **報告網址**：https://sunnymx.github.io/pigeon-racing-test-project/
- **觸發方式**：手動觸發（Actions → Run workflow）

---

## 測試架構

### 7 階段使用者旅程（34 個測試）

| 階段 | 檔案 | 測試數 | 說明 |
|------|------|--------|------|
| 1 | `stage-1-homepage.spec.ts` | 3 | 首頁探索 |
| 2 | `stage-2-race-entry.spec.ts` | 5 | 進入賽事 |
| 3 | `stage-3-2d-static.spec.ts` | 6 | 2D 靜態軌跡 |
| 4 | `stage-4-2d-dynamic.spec.ts` | 7 | 2D 動態模式 |
| 5 | `stage-5-3d-mode.spec.ts` | 6 | 3D 模式 |
| 6 | `stage-6-loft-list.spec.ts` | 4 | 鴿舍列表 |
| 7 | `stage-7-error-monitor.spec.ts` | 3 | 錯誤監控 |

### Helper 模組

| 模組 | 功能 |
|------|------|
| `navigation.ts` | 頁面導航 |
| `mode-switching.ts` | 2D/3D 模式切換 |
| `trajectory-utils.ts` | 軌跡工具函數 |
| `adaptive-wait.ts` | 適應性等待策略 |
| `console-monitor.ts` | 控制台監控 |
| `stage-context.ts` | 階段上下文管理 |
| `trajectory-validator.ts` | 軌跡資料驗證 |

---

## 專案結構

```
pigeon-racing-test-project/
├── tests/
│   ├── e2e/
│   │   └── user-journey/        # 主測試套件（7 階段）
│   │       ├── fixtures.ts      # 共用設定
│   │       └── stage-*.spec.ts  # 測試檔案
│   ├── helpers/                 # 核心 Helper 模組（10 個）
│   └── shared/                  # 共用類型定義
├── docs/
│   ├── architecture/            # 測試框架架構
│   ├── guides/                  # 開發指南
│   │   ├── mode-switching.md    # 2D/3D 切換指南
│   │   ├── troubleshooting.md   # 問題排解
│   │   └── selectors.md         # 選擇器指南
│   └── test-plan/               # 測試計劃文檔
├── dev/active/                  # 進行中的開發任務
├── .github/workflows/
│   └── playwright.yml           # GitHub Actions CI
├── playwright.config.ts         # Playwright 配置
└── CLAUDE.md                    # Claude Code 指南
```

---

## 關鍵文檔

| 文檔 | 說明 |
|------|------|
| [CLAUDE.md](CLAUDE.md) | Claude Code 快速參考（必讀） |
| [docs/guides/mode-switching.md](docs/guides/mode-switching.md) | 2D/3D 模式切換指南 |
| [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) | 已知問題與解決方案 |
| [docs/guides/selectors.md](docs/guides/selectors.md) | 選擇器使用指南 |
| [docs/test-plan/TEST_CASES.md](docs/test-plan/TEST_CASES.md) | 35+ 詳細測試用例 |

---

## 測試目標網站

- **網址**：https://skyracing.com.cn/
- **功能**：賽鴿 GPS 追蹤系統
- **地圖引擎**：
  - 2D 模式：AMap (高德地圖)
  - 3D 模式：Cesium

---

## 開發指南

### 添加新測試

1. 在 `tests/e2e/user-journey/` 創建 `stage-X-*.spec.ts`
2. 使用 `fixtures.ts` 中的共用設定
3. 參考現有測試結構

### 修改 Helper

1. 查閱 `docs/architecture/helper-functions.md`
2. 在 `tests/helpers/` 修改對應模組
3. 確保向後相容

### 已知問題

| 問題 | 解決方案 |
|------|----------|
| 2D 軌跡初始載入失敗 | 重新選擇鴿子 |
| 靜態/動態模式混淆 | 計算標記點數量（≥15 靜態） |
| 軌跡點點擊無響應 | 使用 `.amap-icon > img` + `force: true` |
| 數據載入時序 | 等待 2-3 秒 |

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

**最後更新**：2025-12-08

| 項目 | 狀態 |
|------|------|
| 測試套件 | ✅ 34 個獨立測試 |
| Helper 模組 | ✅ 10 個核心模組 |
| GitHub Actions | ✅ 手動觸發 + Pages 部署 |
| 文檔 | ✅ 完整 |

---

## 授權

MIT License
