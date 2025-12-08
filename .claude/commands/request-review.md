---
description: 開發完成後，生成審查請求寫入 .review/request.md
argument-hint: [審查類型: code|security|architecture|spec] [特別關注點]
---

開發工作已完成，請執行以下步驟生成審查請求：

## 步驟 1：收集變更資訊

1. 執行 `git status` 查看變更狀態
2. 執行 `git diff --stat` 查看已追蹤檔案的變更列表
3. 執行 `git diff` 查看已追蹤檔案的具體變更內容
4. **偵測新增檔案**：
   - 執行 `git status --porcelain | grep "^??"` 列出所有 untracked files
   - 對於與本次變更相關的新增檔案，使用 `cat` 或 `head -100` 查看內容
   - 將新增檔案列入「相關檔案」清單，並標記為「新增」

## 步驟 2：分析變更

根據變更內容判斷：
- **變更類型**：feature / bugfix / refactor / performance / security
- **影響範圍**：哪些模組/功能受影響
- **複雜度**：簡單修改 / 中等 / 複雜邏輯

## 步驟 3：填寫審查請求

將以下內容寫入 `.review/request.md`：

```markdown
# 審查請求

> 此檔案由開發 Agent 填寫，供審查 Agent 讀取

## 變更類型

- [x] [根據分析勾選對應類型]

## 變更摘要

[用 2-3 句話描述這次變更做了什麼、為什麼要做]

## 相關檔案

[列出所有修改的檔案，按重要性排序]

## 變更詳情

[**重要**：對於每個修改的檔案，必須說明：
1. 變更了哪個部分（函數名/章節名/行號範圍）
2. 具體改了什麼（原本是什麼 → 改成什麼）
3. 為什麼這樣改

格式範例：
### `path/to/file.md`
- **變更位置**：第 X 節「標題名稱」
- **原本**：checkbox 清單格式
- **改為**：表格格式（增加狀態、日期、備註欄位）
- **原因**：提高可讀性和追蹤效率
]

## 關鍵邏輯說明

[解釋核心邏輯，幫助審查者快速理解重點]

## 測試狀態

[標記已執行的測試]

## 特別關注點

[如有 $ARGUMENTS 指定的關注點，在此說明]

---

*請求時間*: [執行 `date "+%Y-%m-%d %H:%M"` 獲取]
*開發 Agent*: Claude Code
*建議審查類型*: [code/security/architecture/spec]
```

## 步驟 4：輸出提示

完成後，向用戶顯示：

1. **變更摘要**（一句話）
2. **建議的審查類型**（根據變更內容判斷適用的審查）
3. **在審查 Agent 終端機執行的命令**

### 審查類型判斷規則

根據變更內容，建議適用的審查類型：

| 變更特徵 | 建議審查 |
|---------|---------|
| 任何代碼修改 | `code` |
| 涉及用戶輸入、API、資料庫查詢、認證 | `security` |
| 新增模組、修改目錄結構、跨層調用 | `architecture` |
| 修改 `spec/` 目錄、新增功能欄位、API 設計 | `spec` |

### 輸出格式範例

```
📋 審查請求已生成

**變更摘要**：新增軌跡速度計算欄位

**建議審查類型**：
- ✅ `code` — 新增計算邏輯
- ✅ `security` — 涉及 expression evaluator 白名單
- ⬜ `architecture` — 無結構變更
- ✅ `spec` — 新增欄位需更新規格

**在審查 Agent 終端機依序執行**：
1. 讀取 .review/prompts/code-review.md 並執行 → 產生 response_code_{agent}.md
2. 讀取 .review/prompts/security-review.md 並執行 → 產生 response_security_{agent}.md
3. 讀取 .review/prompts/spec-review.md 並執行 → 產生 response_spec_{agent}.md
```

---

## 參數說明

- 無參數：自動判斷審查類型（可能建議多種）
- `code`：代碼品質審查（邏輯、命名、可讀性）
- `security`：安全審查（注入、驗證、授權）
- `architecture`：架構審查（設計模式、模組化）
- `spec`：規格審查（完整性、版本管理、代碼一致性）
- 額外文字：作為「特別關注點」寫入

## 使用範例

```
/request-review                          # 自動分析，建議適用的審查類型
/request-review security                 # 指定安全審查
/request-review code 請注意 edge case    # 附加關注點
/request-review spec                     # 規格一致性審查
```
