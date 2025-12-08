# GitHub Actions CI 自動部署計劃

## 目標
設置 GitHub Actions CI/CD，支援手動觸發測試並將報告部署到 GitHub Pages。

## 狀態
- **階段**: 實作中
- **建立日期**: 2025-12-08

---

## 需求規格

| 項目 | 選擇 |
|------|------|
| CI 平台 | GitHub Actions |
| 觸發時機 | 手動觸發 (workflow_dispatch) |
| 報告呈現 | GitHub Pages |

---

## 檔案結構

### 計劃文件
```
dev/active/github-actions-ci/
├── README.md                    # 本文件 - 計劃總覽
└── specs/
    └── workflow.spec.md         # Workflow 規格設計
```

### 實作產出
```
.github/workflows/
└── playwright.yml               # GitHub Actions 工作流程
```

---

## 執行步驟

### 步驟 1: 建立計劃文件
- [x] 建立 `dev/active/github-actions-ci/README.md`
- [x] 建立 `dev/active/github-actions-ci/specs/workflow.spec.md`

### 步驟 2: 建立 Workflow 檔案
- [x] 建立 `.github/workflows/playwright.yml`

### 步驟 3: 啟用 GitHub Pages (手動操作)
- [ ] 到 Repository Settings → Pages
- [ ] Source 選擇 "GitHub Actions"

### 步驟 4: 驗證
- [ ] 手動觸發 workflow
- [ ] 確認測試執行成功
- [ ] 確認報告部署到 GitHub Pages

---

## 快速指令

### 手動觸發測試
1. 前往 GitHub Repository
2. Actions → Playwright Tests → Run workflow

### 查看報告
部署完成後：
- https://sunnymx.github.io/pigeon-racing-test-project/

---

## 相關文件
- [Workflow 規格](specs/workflow.spec.md)
- [Playwright 配置](../../playwright.config.ts)
- [測試案例](../../tests/e2e/user-journey/)
