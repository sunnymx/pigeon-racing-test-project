# 快速測試指南

依序提出以下問題來測試 Skills 觸發：

## TIER1

### 1.1. code-review
```
請審查 1_dev/src/gui.py 的程式碼品質，檢查是否有風格問題、可讀性問題或安全隱患。
```

### 1.2. security
```
檢查 1_dev/src/batch_preparer.py 是否有安全漏洞，特別是 API key 處理和輸入驗證部分。
```

### 1.3. fix-test
```
我運行 pytest 1_dev/tests/unit/test_gui_presenter.py -v 時有一些測試失敗了，能幫我診斷並提供修復建議嗎？
```

## TIER2

### 2.1. docker
```
我想為這個 Python 專案創建一個 Docker 容器，如何開始？
```

### 2.2. github
```
如何使用 GitHub API 創建一個新的 pull request？我的 GITHUB_TOKEN 已設置。
```

### 2.3. npm
```
我需要在非互動環境中安裝 NPM 套件，有什麼要注意的？
```

## ADVANCED

### A.1. code-review + security
```
審查 1_dev/src/batch_preparer.py 的安全性和程式碼品質，並修復任何發現的問題。
```

### A.2. code-review (工具限制)
```
審查 1_dev/src/gui.py 並自動修復所有問題。
```

