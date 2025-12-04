---
description: 讀取審查結果並逐一修正問題
argument-hint: [--fix-all | --must-only | --discuss]
---

請讀取審查結果並處理問題：

## 步驟 1：讀取審查結果

1. 列出所有審查結果檔案：`ls .review/response_*.md`
2. 讀取所有 `response_{agent}.md` 檔案（如 `response_codex.md`、`response_gemini.md`）
3. 解析每個檔案的以下內容：
   - **審查狀態**：approved / changes_requested / needs_discussion
   - **問題清單**：Must Fix / Should Fix / Discussion
   - **詳細說明**

> 註：Security 審查使用 Critical/High/Medium/Low 分級

## 步驟 2：處理邏輯

根據參數決定處理方式：

### 無參數（預設：互動式）
1. 顯示問題摘要（各類別數量）
2. 從 Must Fix 開始，逐一詢問是否修正
3. 修正後標記該問題為已處理
4. 完成 Must Fix 後，詢問是否處理 Should Fix

### `--must-only`
只處理 Must Fix 類別的問題，自動執行修正

### `--fix-all`
自動處理所有問題（Must Fix + Should Fix + Discussion）

### `--discuss`
不修正，只整理需要討論的問題並輸出

## 步驟 3：執行修正

對每個問題：
1. 顯示問題描述和建議修正方式
2. 定位相關代碼
3. 執行修正
4. 驗證修正結果

## 步驟 4：完成報告

修正完成後輸出：

```
## 審查結果處理報告

### 已修正
- [問題1描述] ✓
- [問題2描述] ✓

### 略過（需討論）
- [問題描述] - 原因：...

### 統計
- Must Fix: X/Y 已修正
- Should Fix: X/Y 已修正
- Discussion: X/Y 已處理

### 下一步
[如有重大修改，建議重新審查]
```

## 步驟 5：詢問後續

如果有重大修改，詢問用戶：
> 已完成修正。是否需要執行 `/request-review` 進行再次審查？

---

## 參數說明

| 參數 | 說明 |
|------|------|
| 無 | 互動式處理，逐一確認 |
| `--must-only` | 只處理 Must Fix |
| `--fix-all` | 自動處理所有問題 |
| `--discuss` | 只整理需討論的問題 |

## 使用範例

```
/review-result                # 互動式處理
/review-result --must-only    # 只修 Must Fix
/review-result --fix-all      # 全部自動修
/review-result --discuss      # 整理討論點
```
