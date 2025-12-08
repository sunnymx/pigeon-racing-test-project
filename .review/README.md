# 雙 Agent 代碼審查協作系統

## 快速開始（使用 Slash Commands）

| 步驟 | 終端機 | 命令 |
|------|--------|------|
| 1 | Claude Code | `/request-review [code\|security\|architecture\|spec]` |
| 2 | Codex/Gemini | `讀取 .review/prompts/{type}-review.md 並執行` |
| 3 | Claude Code | `/review-result` |

---

## Slash Commands 說明

### `/request-review`

開發完成後，自動生成審查請求。

```bash
/request-review                          # 自動分析變更
/request-review security                 # 指定安全審查
/request-review code 請注意 edge case    # 附加關注點
/request-review spec                     # 規格一致性審查
```

**執行內容**：
1. 分析 `git diff` 變更
2. 判斷變更類型
3. 填寫 `.review/request.md`
4. 提示下一步操作

### `/review-result`

讀取審查結果並處理問題。

```bash
/review-result              # 互動式處理
/review-result --must-only  # 只處理 Must Fix
/review-result --fix-all    # 自動處理所有問題
```

**執行內容**：
1. 讀取所有 `.review/response_{type}_{agent}.md`（如 `response_code_codex.md`、`response_spec_gemini.md`）
2. 合併多 Agent 結果，按優先順序處理問題
3. 輸出處理報告
4. 詢問是否需要再次審查

---

## 手動流程（不使用 Commands）

### 步驟 1：開發完成後（Claude Code 終端機）

跟 Claude Code 說：
```
開發完成，請將變更摘要寫入 .review/request.md
```

### 步驟 2：啟動審查（Codex/Gemini 終端機）

跟審查 Agent 說（選擇其一）：

**代碼審查**：
```
讀取 .review/prompts/code-review.md 並執行
```

**安全審查**：
```
讀取 .review/prompts/security-review.md 並執行
```

**架構審查**：
```
讀取 .review/prompts/architecture-review.md 並執行
```

**規格審查**：
```
讀取 .review/prompts/spec-review.md 並執行
```

### 步驟 3：應用修正（Claude Code 終端機）

跟 Claude Code 說：
```
讀取 .review/response_{type}_{agent}.md 的審查結果，評估並修正問題
```

---

## 檔案說明

| 檔案 | 用途 | 誰寫入 |
|------|------|--------|
| `request.md` | 變更摘要 | 開發 Agent |
| `response_{type}_{agent}.md` | 審查結果（如 `response_code_codex.md`） | 審查 Agent |
| `prompts/code-review.md` | 代碼品質審查 prompt | - |
| `prompts/security-review.md` | 安全審查 prompt | - |
| `prompts/architecture-review.md` | 架構審查 prompt | - |
| `prompts/spec-review.md` | 規格審查 prompt | - |

---

## 審查類型選擇指南

| 變更類型 | 建議審查 |
|----------|----------|
| 新功能開發 | code-review + architecture-review |
| Bug 修復 | code-review |
| 安全相關 | security-review |
| 重構 | architecture-review |
| API 變更 | code-review + security-review |
| 規格/欄位變更 | spec-review |
| 新增功能欄位 | code-review + spec-review |

---

## 快速參考

```bash
# 查看變更（可在任一終端機執行）
git diff

# 查看待審查內容
cat .review/request.md

# 查看審查結果
ls .review/response_*.md
cat .review/response_code_codex.md  # 或其他 type_agent 組合
```
