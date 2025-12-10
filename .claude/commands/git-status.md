---
description: 快速檢查 git 狀態和最近提交歷史
---

Git 狀態快速檢查：

!echo "=== 當前分支 ==="
!git branch --show-current

!echo -e "\n=== 工作區狀態 ==="
!git status --short

!echo -e "\n=== 最近 5 次提交 ==="
!git log --oneline -5

!echo -e "\n=== 統計摘要 ==="
!echo "未追蹤檔案: $(git ls-files --others --exclude-standard | wc -l)"
!echo "已修改檔案: $(git diff --name-only | wc -l)"
!echo "已暫存檔案: $(git diff --cached --name-only | wc -l)"