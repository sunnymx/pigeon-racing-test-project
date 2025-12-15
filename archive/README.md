# Archive - 封存文件

**封存日期**: 2025-12-15

此目錄包含專案所有歷史文件與參考文檔，測試執行不依賴此目錄。

---

## 目錄結構

```
archive/
├── tests/     # 舊版測試代碼 (41 個檔案)
├── docs/      # 所有文檔 (9 個目錄)
└── dev/       # 已完成的開發分支 (6 個目錄)
```

---

## tests/ - 舊版測試代碼

包含開發過程中的實驗性代碼：

| 目錄 | 說明 |
|------|------|
| `comparison/` | DevTools vs Playwright 對比實驗 |
| `devtools/` | Chrome DevTools 版本實驗 |
| `e2e/` | 舊版 E2E 測試 |
| `fixtures/` | 舊版 fixture 函數 |
| `helpers/` | 舊版 helper 函數 |
| `utils/` | 舊版工具函數 |
| `validators/` | 舊版驗證器 |

**現行代碼位置**: `tests/e2e/` + `tests/helpers/`

---

## docs/ - 所有文檔

| 目錄 | 說明 |
|------|------|
| `architecture/` | 測試框架架構、Helper 函數說明 |
| `guides/` | 開發指南 (mode-switching, troubleshooting, selectors 等) |
| `test-plan/` | 測試計畫文檔 (66 個測試案例清單) |
| `development-plan/` | 開發計畫與路線圖 |
| `technical-architecture/` | 系統架構文檔 |
| `data-model/` | 數據模型文檔 |
| `information-architecture/` | 網站結構文檔 |
| `api-reference/` | API 端點文檔 |
| `GIT_SETUP.md` | Git 雙遠程配置說明 |

**現行參考**: `spec/USER_JOURNEY_RECORD/` (測試規格)

---

## dev/ - 已完成的開發分支

| 目錄 | 說明 |
|------|------|
| `cesium-detection-fix/` | Cesium 3D 檢測修復 |
| `devtools-mcp-comparison/` | DevTools vs MCP 對比 |
| `dynamic-mode-autoplay-fix/` | 動態模式自動播放修復 |
| `github-actions-ci/` | GitHub Actions CI 配置 |
| `selector-architecture-improvement/` | 選擇器架構改進 |
| `test-flow-refactor/` | 測試流程重構 |

---

## 如何恢復使用

如需參考封存內容：

```bash
# 查看舊版測試邏輯
cat archive/tests/helpers/trajectory.ts

# 查看 API 文檔
cat archive/docs/api-reference/API_ENDPOINTS.md

# 查看開發筆記
ls archive/dev/cesium-detection-fix/
```

如需恢復到活躍開發：

```bash
# 恢復單個文件
cp archive/docs/test-plan/TEST_CASES.md docs/

# 恢復整個目錄
cp -r archive/docs/api-reference docs/
```

---

## 注意事項

1. 此目錄內容**不影響測試執行**
2. 所有代碼已被 `tests/e2e/` 和 `tests/helpers/` 取代
3. 可安全刪除以減少專案大小（如有需要）
