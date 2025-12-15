# Workflow 規格設計

## 版本歷史

| 版本 | 日期 | 變更說明 |
|------|------|----------|
| 1.0.0 | 2025-12-08 | 初始版本 |

---

## 概述

設計 GitHub Actions workflow 用於執行 Playwright E2E 測試，並將報告自動部署到 GitHub Pages。

---

## Workflow 配置

### 觸發條件

```yaml
on:
  workflow_dispatch:  # 僅支援手動觸發
```

**說明**：使用 `workflow_dispatch` 讓用戶可以在 GitHub Actions 頁面手動觸發測試。

---

## Jobs 設計

### Job 1: test

執行 Playwright 測試並生成報告。

| 項目 | 設定 |
|------|------|
| 執行環境 | `ubuntu-latest` |
| Node 版本 | 20 |
| 瀏覽器 | Chromium (with dependencies) |

**步驟流程**：
1. `actions/checkout@v4` - 檢出程式碼
2. `actions/setup-node@v4` - 安裝 Node.js
3. `npm ci` - 安裝依賴
4. `npx playwright install --with-deps chromium` - 安裝 Playwright 瀏覽器
5. `npx playwright test` - 執行測試
6. `actions/upload-pages-artifact@v3` - 上傳報告

### Job 2: deploy

將報告部署到 GitHub Pages。

| 項目 | 設定 |
|------|------|
| 依賴 | `needs: test` |
| 執行環境 | `ubuntu-latest` |
| 權限 | `pages: write`, `id-token: write` |

---

## 完整 Workflow 範本

```yaml
name: Playwright Tests

on:
  workflow_dispatch:

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        run: npx playwright test
        continue-on-error: true

      - name: Upload HTML report
        uses: actions/upload-pages-artifact@v3
        if: always()
        with:
          path: playwright-report/

  deploy:
    needs: test
    if: always()
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 關鍵設計決策

### 1. `continue-on-error: true`
測試失敗時仍繼續執行，確保報告能夠上傳。

### 2. `if: always()`
無論測試結果如何，都會執行報告上傳和部署步驟。

### 3. `timeout-minutes: 60`
設定較長的超時時間（60分鐘），因為：
- 34 個測試本地執行約 5 分鐘
- CI 環境可能較慢
- 包含瀏覽器安裝時間

### 4. `cache: 'npm'`
快取 npm 依賴，加速後續執行。

---

## 與現有配置的相容性

### playwright.config.ts

現有配置已支援 CI 環境：

```typescript
forbidOnly: !!process.env.CI,    // CI 環境禁止 .only
retries: process.env.CI ? 2 : 1, // CI 環境重試 2 次
workers: process.env.CI ? 1 : 2, // CI 環境使用 1 個 worker
```

**無需修改現有配置**。

---

## 報告輸出

### 報告路徑
- 本地：`playwright-report/`
- GitHub Pages：`https://<username>.github.io/<repo>/`

### 報告內容
- 測試結果摘要
- 失敗測試截圖
- 失敗測試錄影
- Trace 檔案

---

## 後續擴展選項

### 1. 增加觸發條件
```yaml
on:
  workflow_dispatch:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### 2. 定時執行
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 點
```

### 3. Slack 通知
```yaml
- name: Send Slack notification
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {"text": "Playwright tests completed"}
```
