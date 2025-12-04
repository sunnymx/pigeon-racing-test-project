# 雙 Agent 代碼審查協作系統

## 快速開始（使用 Slash Commands）

| 步驟 | 終端機 | 命令 |
|------|--------|------|
| 1 | Claude Code | `/request-review` |
| 2 | Codex/Gemini | 依建議類型執行審查（見下方） |
| 3 | Claude Code | `/review-result` |

### 多審查類型執行方式

當 `request.md` 建議多種審查類型時（如 `code + architecture`），請**依序執行**：

```bash
# 步驟 2a：代碼審查
讀取 .review/prompts/code-review.md 並執行

# 步驟 2b：架構審查
讀取 .review/prompts/architecture-review.md 並執行
```

> 每個審查會輸出獨立的結果檔（如 `response_codex.md`、`response_gemini.md`），`/review-result` 會自動讀取所有結果。

---

## Slash Commands 說明

### `/request-review`

開發完成後，自動生成審查請求。

```bash
/request-review                          # 自動分析變更
/request-review security                 # 指定安全審查
/request-review code 請注意 edge case    # 附加關注點
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
1. 讀取 `.review/response_*.md`（所有審查結果）
2. 按優先順序處理問題
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

根據 `request.md` 建議的審查類型執行。若建議多種類型，請**依序執行**：

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

> 提示：若 `request.md` 建議 `code + architecture`，請先執行代碼審查，再執行架構審查。

### 步驟 3：應用修正（Claude Code 終端機）

跟 Claude Code 說：
```
讀取 .review/response_*.md 的審查結果，評估並修正問題
```

---

## 檔案說明

| 檔案 | 用途 | 誰寫入 |
|------|------|--------|
| `request.md` | 變更摘要 | 開發 Agent |
| `response_{agent}.md` | 審查結果（如 `response_codex.md`） | 審查 Agent |
| `prompts/code-review.md` | 代碼品質審查 prompt | - |
| `prompts/security-review.md` | 安全審查 prompt | - |
| `prompts/architecture-review.md` | 架構審查 prompt | - |

---

## 審查類型選擇指南

| 變更類型 | 建議審查 |
|----------|----------|
| 新功能開發 | code-review + architecture-review |
| Bug 修復 | code-review |
| 安全相關 | security-review |
| 重構 | architecture-review |
| API 變更 | code-review + security-review |

---

## 快速參考

```bash
# 查看變更（可在任一終端機執行）
git diff

# 查看待審查內容
cat .review/request.md

# 查看審查結果
ls .review/response_*.md
cat .review/response_codex.md  # 或其他 agent
```
