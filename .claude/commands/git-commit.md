---
description: 快速執行 git add 和 commit，自動生成簡單訊息
---

執行基礎 git commit 流程：

1. 先顯示當前 git 狀態
!git status --short

2. 執行 git add 加入所有變更
!git add -A

3. 使用當前日期時間生成 commit message 並提交
!git commit -m "[$(date +'%Y-%m-%d %H:%M')] 工作進度更新

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

4. 顯示最後的提交結果
!git log -1 --oneline