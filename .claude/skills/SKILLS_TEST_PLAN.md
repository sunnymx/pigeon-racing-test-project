# Claude Code Skills 測試計劃

**創建日期**: 2025-11-03
**Skills 版本**: Claude Code Skills (2025年10月發布)
**總計 Skills**: 13 個
**格式驗證**: ✅ 全部通過

---

## 📊 Skills 概覽

### Tier 1: 核心開發 Skills (3)
- code-review
- security
- fix-test

### Tier 2: 技術棧 Skills (8)
- docker
- kubernetes
- github
- npm
- ssh
- pdflatex
- gitlab
- bitbucket

### Tier 3: 工作流程 Skills (1)
- pr-workflow

### Plugin Skills (1)
- ai-driven-dev-workflow

---

## 🎯 測試目標

1. **自動觸發驗證**: 確認 Claude 能根據問題描述自動載入正確的 skill
2. **功能完整性**: 驗證每個 skill 提供的指導是否實用且完整
3. **工具限制**: 確認 `allowed-tools` 限制是否生效
4. **衝突處理**: 測試多個 skills 同時觸發的情況
5. **描述優化**: 識別 description 不夠明確的 skills

---

## 🧪 測試場景

### Tier 1: 核心開發 Skills

#### Test 1.1: code-review skill

**測試問題**:
```
請審查 1_dev/src/gui.py 的程式碼品質，檢查是否有風格問題、可讀性問題或安全隱患。
```

**預期行為**:
- ✅ code-review skill 自動啟動
- ✅ 使用結構化格式反饋（風格、可讀性、安全性）
- ✅ 提供具體行號和改進建議
- ✅ 只使用 allowed-tools: Read, Grep, Glob, Bash

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了分類的反饋（風格/可讀性/安全）？
- [ ] 是否包含具體的行號引用？
- [ ] 是否提供可執行的改進建議？

---

#### Test 1.2: security skill

**測試問題**:
```
檢查 1_dev/src/batch_preparer.py 是否有安全漏洞，特別是 API key 處理和輸入驗證部分。
```

**預期行為**:
- ✅ security skill 自動啟動
- ✅ 檢查硬編碼秘密、SQL 注入、認證問題
- ✅ 提供 OWASP Top 10 相關的建議
- ✅ 只使用 allowed-tools: Read, Grep, Glob, Bash

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否檢查了 API key 和敏感數據處理？
- [ ] 是否提供了安全最佳實踐建議？
- [ ] 是否參考了 OWASP 標準？

---

#### Test 1.3: fix-test skill

**測試問題**:
```
測試 tests/unit/test_gui_presenter.py 有一些失敗，幫我診斷並修復問題。
```

**預期行為**:
- ✅ fix-test skill 自動啟動
- ✅ 運行測試並分析錯誤訊息
- ✅ 修復實現代碼（不修改測試）
- ✅ 使用 allowed-tools: Read, Write, Edit, Bash, Grep, Glob

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否運行了測試並分析了錯誤？
- [ ] 是否修復了實現代碼而非測試？
- [ ] 修復後測試是否通過？

---

### Tier 2: 技術棧 Skills

#### Test 2.1: docker skill

**測試問題**:
```
我想為這個 Python 專案創建一個 Docker 容器，如何開始？
```

**預期行為**:
- ✅ docker skill 自動啟動
- ✅ 提供 Dockerfile 範例
- ✅ 說明 Docker 命令和最佳實踐

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了 Dockerfile 範例？
- [ ] 是否解釋了 Docker 基本命令？

---

#### Test 2.2: kubernetes skill

**測試問題**:
```
如何在本地使用 KIND 部署這個應用的 Kubernetes 集群？
```

**預期行為**:
- ✅ kubernetes skill 自動啟動
- ✅ 提供 KIND 安裝步驟
- ✅ 說明 kubectl 基本操作

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了 KIND 設置指南？
- [ ] 是否說明了 Pod/Deployment 操作？

---

#### Test 2.3: github skill

**測試問題**:
```
如何使用 GitHub API 創建一個新的 pull request？我的 GITHUB_TOKEN 已設置。
```

**預期行為**:
- ✅ github skill 自動啟動
- ✅ 提供 GitHub API curl 命令範例
- ✅ 說明 PR 創建流程

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了 API 使用範例？
- [ ] 是否說明了認證機制？

---

#### Test 2.4: npm skill

**測試問題**:
```
我需要在非互動環境中安裝 NPM 套件，有什麼要注意的？
```

**預期行為**:
- ✅ npm skill 自動啟動
- ✅ 提供 `yes | npm install` 建議
- ✅ 說明套件管理最佳實踐

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提到非互動環境的處理？
- [ ] 是否提供了實用的命令範例？

---

#### Test 2.5: ssh skill

**測試問題**:
```
如何生成 SSH 密鑰並連接到遠程伺服器？
```

**預期行為**:
- ✅ ssh skill 自動啟動
- ✅ 提供密鑰生成命令（ED25519/RSA）
- ✅ 說明 SSH 配置和連接

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了密鑰生成指南？
- [ ] 是否說明了 SSH 配置？

---

#### Test 2.6: pdflatex skill

**測試問題**:
```
我有一個 LaTeX 文檔需要編譯成 PDF，應該如何操作？
```

**預期行為**:
- ✅ pdflatex skill 自動啟動
- ✅ 提供 pdflatex 編譯命令
- ✅ 說明 TexLive 安裝

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了編譯命令？
- [ ] 是否說明了依賴安裝？

---

#### Test 2.7: gitlab skill

**測試問題**:
```
如何在 GitLab 上創建和管理 merge request？
```

**預期行為**:
- ✅ gitlab skill 自動啟動
- ✅ 提供 GitLab MR 操作指南

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了 MR 創建流程？

---

#### Test 2.8: bitbucket skill

**測試問題**:
```
Bitbucket 的 pull request 流程是什麼？
```

**預期行為**:
- ✅ bitbucket skill 自動啟動
- ✅ 提供 Bitbucket PR 操作指南

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了 PR 流程說明？

---

### Tier 3: 工作流程 Skills

#### Test 3.1: pr-workflow skill

**測試問題**:
```
我收到了一些 PR 評論，應該如何回應並更新 PR 描述？
```

**預期行為**:
- ✅ pr-workflow skill 自動啟動
- ✅ 提供 PR 評論處理指南
- ✅ 說明 PR 描述更新方法

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了評論回應策略？
- [ ] 是否說明了 PR 生命週期管理？

---

### Plugin Skills

#### Test 4.1: ai-driven-dev-workflow skill

**測試問題**:
```
我想使用 AI-Driven Development Workflow 來生成並執行開發票券。
```

**預期行為**:
- ✅ ai-driven-dev-workflow skill 自動啟動
- ✅ 提供 ticket 生成和執行指南
- ✅ 說明 TDD 工作流程

**驗證檢查點**:
- [ ] Skill 是否自動載入？
- [ ] 是否提供了 ticket 生成指南？
- [ ] 是否說明了執行流程？

---

## 🔬 進階測試場景

### Test A1: 多 Skills 同時觸發

**測試問題**:
```
審查 1_dev/src/batch_preparer.py 的安全性和程式碼品質，並修復任何發現的問題。
```

**預期行為**:
- ✅ code-review 和 security skills 可能同時或依序啟動
- ✅ Claude 協調兩個 skills 的輸出

**驗證檢查點**:
- [ ] 是否載入了多個 skills？
- [ ] Skills 之間是否協調良好？
- [ ] 是否避免了重複的建議？

---

### Test A2: Description 歧義測試

**測試問題**:
```
幫我處理一下程式碼。
```

**預期行為**:
- ⚠️  問題太模糊，可能不會觸發任何 skill
- ✅ Claude 應該詢問更多細節

**驗證檢查點**:
- [ ] Claude 是否要求澄清？
- [ ] 如果觸發了 skill，是否選擇正確？

---

### Test A3: 工具限制測試

**測試問題**:
```
審查 1_dev/src/gui.py 並自動修復所有問題。
```

**預期行為**:
- ✅ code-review skill 啟動
- ⚠️  code-review 的 allowed-tools 不包含 Write/Edit
- ✅ Claude 應該報告問題但提示需要其他 skill 來修復

**驗證檢查點**:
- [ ] code-review skill 是否正確識別了問題？
- [ ] 是否遵守了 allowed-tools 限制？
- [ ] 是否建議使用其他 skill 來修復？

---

## 📈 測試記錄模板

為每個測試場景記錄以下資訊：

```markdown
### Test X.Y: [Skill Name]

**執行日期**: YYYY-MM-DD
**測試問題**: [實際使用的問題]
**結果**: ✅ 通過 / ⚠️  部分通過 / ❌ 失敗

**觀察**:
- Skill 是否自動載入: [是/否]
- 載入速度: [快/中/慢]
- 提供的指導品質: [1-5星]
- 工具使用是否正確: [是/否]

**改進建議**:
- [如果有的話]

**截圖/日誌**: [如適用]
```

---

## 🎯 成功標準

### 必要條件 (Must-Have)
- [ ] 所有 Tier 1 skills (3/3) 能正確觸發
- [ ] 至少 75% 的 Tier 2 skills (6/8) 能正確觸發
- [ ] 所有 skills 的 allowed-tools 限制生效
- [ ] 沒有 skill 在錯誤的場景下被觸發

### 理想條件 (Nice-to-Have)
- [ ] 所有 skills (13/13) 能正確觸發
- [ ] 多 skills 同時觸發時協調良好
- [ ] Description 優化建議已記錄
- [ ] 至少 90% 的測試場景獲得 4 星以上評價

---

## 📝 後續行動

測試完成後，根據結果進行以下操作：

1. **優化 Description**: 對於觸發率低的 skills，改進 description 欄位
2. **調整 Allowed-Tools**: 確認工具限制是否合理
3. **合併重複 Skills**: 如果發現功能重疊，考慮合併
4. **補充文檔**: 為使用頻繁的 skills 添加更多範例
5. **性能優化**: 記錄載入速度，識別需要簡化的 skills

---

## 🔗 相關資源

- Skills 格式驗證報告: [由驗證腳本生成]
- Claude Code Skills 規範: https://docs.claude.com/en/docs/claude-code/skills
- Skills README: `.claude/skills/README.md`
- AI-Driven Development Workflow: `docs/AI-Driven_Development_Workflow.md`

---

**測試計劃版本**: 1.0
**建立日期**: 2025-11-03
**狀態**: 📋 待執行
