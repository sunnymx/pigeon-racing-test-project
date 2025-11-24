---
description: 智能分析變更內容，生成詳細的 commit message
---

智能分析 git 變更並執行提交：

1. 檢查當前 git 狀態
2. 分析所有變更檔案（使用 git diff）
3. 根據變更內容智能生成 commit message
4. 詢問確認後執行提交

分析重點：
- 新增檔案類型與用途
- 修改檔案的主要變更
- 刪除檔案的原因
- 自動判斷 commit 類型（feat/fix/docs/refactor/chore）

支援參數：
- 可指定 commit 類型：$ARGUMENTS

使用範例：
- /git-smart-commit
- /git-smart-commit feat
- /git-smart-commit fix