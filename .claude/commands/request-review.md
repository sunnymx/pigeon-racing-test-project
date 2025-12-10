---
description: 開發完成後，生成審查請求寫入 .review/request.md
argument-hint: [特別關注點]
---

請執行以下步驟生成審查請求：

## 1. 清理舊檔案

```bash
rm -f .review/request.md .review/response_*.md 2>/dev/null
```

## 2. 收集資訊

1. 執行 `git diff --stat` 確認變更範圍
2. 從最近的工作脈絡或 commit 訊息中，提取這次開發的**目標**

## 3. 寫入 request.md

```markdown
# 審查請求

## 目標
[用 1-2 句話說明這次開發要達成什麼]

## 特別關注（可選）
[如有 $ARGUMENTS 或特殊顧慮，在此說明]

---
*請求時間*: [YYYY-MM-DD HH:MM]
```

## 4. 提示用戶

輸出：
```
審查請求已生成。

請在審查 Agent 終端機執行：
→ 讀取 .review/prompts/code-review.md 並執行
```

---

審查 Agent 責任：自己執行 `git diff` 取得變更內容
