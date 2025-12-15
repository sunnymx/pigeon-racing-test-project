# Playwright MCP 工作流程指南

**快速參考**: [CLAUDE.md](../../CLAUDE.md#quick-start)
**詳細文檔**: [Playwright MCP Workflow](../test-plan/PLAYWRIGHT_MCP_WORKFLOW.md)

---

## 安裝設定

```bash
# 專案級安裝
claude mcp add playwright npx @playwright/mcp@latest --scope project

# 驗證安裝
claude mcp list
```

---

## 互動式測試工作流程

### 1. 導航和探索
```bash
使用 playwright mcp 打開 https://skyracing.com.cn/
```

### 2. 互動測試
```bash
# 導航
點擊第一個「進入」按鈕

# 選擇鴿子
點擊第一個 checkbox

# 查看模式按鈕狀態
獲取模式按鈕的文字內容

# 查看軌跡
點擊「查看軌跡」按鈕
```

### 3. 驗證結果
```bash
# 截圖
截取當前頁面

# 檢查元素
查找「視角1」按鈕是否可見
```

### 4. 轉換為代碼
將成功的互動流程轉為自動化腳本

---

## 最佳實踐

1. **先驗證後編碼** - 用 MCP 確認方法可行
2. **截圖記錄** - 保存關鍵狀態的截圖
3. **增量測試** - 一步一步驗證
4. **記錄發現** - 文檔化任何問題

---

**完整指南**: [Playwright MCP Workflow](../test-plan/PLAYWRIGHT_MCP_WORKFLOW.md)
**最後更新**: 2025-11-18
