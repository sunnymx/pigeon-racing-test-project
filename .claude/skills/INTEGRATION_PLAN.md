# Agents + Skills 整合計劃

**創建日期**: 2025-11-03
**目標**: 讓 agents 執行時自動觸發對應的 skills

---

## 🎯 整合策略

### 核心原則

**Skills 自動觸發機制**：
- Skills 通過 **description 匹配** 自動載入
- Agents 執行時，**相關 skills 會自動觸發**
- **無需** 在 agent 中顯式調用 skills

---

## 📋 整合方案

### 方案 1: 優化 Agent Descriptions（✅ 推薦）

在每個 agent 的 `description` 中添加觸發 skills 的關鍵字。

#### ticket-executor Agent

**當前**:
```yaml
description: Execute tickets using strict TDD methodology...
```

**優化後**:
```yaml
description: Execute tickets using strict TDD methodology through 6 phases (READ→RED→GREEN→VERIFY→DOCUMENT→COMMIT). Use when user requests ticket execution, implementing tickets, running TDD workflow, or resuming from failed tickets. Supports auto/semi/manual execution modes with Max 3 Attempts Rule. During execution, may require code review, security audits, test debugging, Docker containerization, and GitHub integration.
```

**觸發的 Skills**:
- "code review" → `code-review` skill
- "security audits" → `security` skill
- "test debugging" → `fix-test` skill
- "Docker containerization" → `docker` skill
- "GitHub integration" → `github` skill

---

#### bug-fixer Agent

**當前**:
```yaml
description: Diagnose and fix bugs...
```

**優化後**:
```yaml
description: Diagnose and fix bugs through iterative root cause analysis. Expert in runtime diagnostics, visual verification, and multi-iteration fixes. Use when bugs are reported, issues need investigation, or problems require exploratory fixing. May involve test debugging, code review, security checks, and deployment troubleshooting.
```

**觸發的 Skills**:
- "test debugging" → `fix-test` skill
- "code review" → `code-review` skill
- "security checks" → `security` skill
- "deployment" → `docker`, `kubernetes` skills

---

#### code-reviewer Agent

**當前**:
```yaml
description: Comprehensive code review...
```

**優化後**:
```yaml
description: Comprehensive code review and refactoring analysis. Expert in code quality, architecture, security best practices, and SOLID principles. Use when code changes are made, review is requested, or quality assessment needed. Checks style violations, readability, security vulnerabilities, test coverage, and deployment configurations.
```

**觸發的 Skills**:
- "security vulnerabilities" → `security` skill
- "test coverage" → `fix-test` skill
- "deployment configurations" → `docker`, `kubernetes` skills

---

### 方案 2: 在 Agent 執行步驟中添加提示

在 agent 的關鍵步驟中，明確提到需要使用的技能。

#### ticket-executor Phase 4: VERIFY

**在 `ticket-executor.md` 中添加**:

```markdown
### Phase 4: VERIFY - Full Validation

**Quality Checks** (from CLAUDE.md):

1. **Full test suite**: `pytest -v` (100% passing required)
   - If tests fail, analyze and fix test failures

2. **Code coverage**: `pytest --cov={module} --cov-report=term-missing` (≥90% required)

3. **Type hints**: `mypy {source_file}` (no errors)

4. **PEP 8 compliance**: `flake8 {source_file}` (no violations)

5. **Code quality review**:
   - Review code for style violations, readability issues
   - Check for security vulnerabilities in authentication, API handling
   - Verify best practices and design patterns

6. **Security scan**:
   - Check for hardcoded secrets or API keys
   - Verify input validation and sanitization
   - Review authentication and authorization logic

7. **Deployment readiness** (if applicable):
   - Verify Docker configuration
   - Check Kubernetes manifests
   - Review CI/CD pipeline integration
```

**效果**: 當執行到此步驟時，關鍵字會觸發對應的 skills

---

### 方案 3: 創建 Agent-Specific Skills

為特定 agent 工作流程創建專門的 skills。

#### 範例：Ticket Execution Quality Skill

**檔案**: `.claude/skills/ticket-execution-quality/SKILL.md`

```markdown
---
name: ticket-execution-quality
description: Comprehensive quality checks for ticket execution workflow including code review, security scanning, test coverage, and deployment validation. Use during ticket executor VERIFY phase, after implementation, or before committing code.
allowed-tools: [Read, Grep, Glob, Bash]
---

# Ticket Execution Quality Checker

## When to Use
- During `ticket-executor` VERIFY phase (Phase 4)
- After GREEN phase implementation
- Before final COMMIT phase
- When quality gates need validation

## Quality Checks

### 1. Code Quality Review
Review implementation for:
- **Style**: PEP 8 compliance, naming conventions
- **Readability**: Clear logic, proper abstractions
- **Best practices**: DRY, SOLID principles
- **Complexity**: Function length, nesting depth

### 2. Security Scan
Check for:
- **Secrets**: Hardcoded API keys, passwords, tokens
- **Injection**: SQL injection, command injection risks
- **Authentication**: Proper auth/authz implementation
- **Input validation**: Sanitization and validation

### 3. Test Coverage
Verify:
- **Coverage**: ≥ 90% for new code
- **Edge cases**: All scenarios tested
- **Mocks**: Proper use of test doubles
- **Assertions**: Meaningful test assertions

### 4. Deployment Readiness
Check (if applicable):
- **Docker**: Dockerfile best practices
- **Config**: Environment variable usage
- **Dependencies**: Proper version pinning

## Integration with ticket-executor

This skill automatically activates during the VERIFY phase when:
- pytest coverage checks are run
- Code quality validation is needed
- Security scanning is required
```

---

## 🚀 實施步驟

### Step 1: 優化 Agent Descriptions（2小時）

**任務**:
1. 檢視所有 6 個 agents
2. 在每個 agent 的 description 中添加關鍵字
3. 確保關鍵字匹配現有 skills 的 descriptions

**檢查清單**:
- [ ] ticket-executor.md - 添加 "code review", "security", "testing"
- [ ] bug-fixer.md - 添加 "test debugging", "security checks"
- [ ] code-reviewer.md - 添加 "security vulnerabilities", "test coverage"
- [ ] ticket-generator.md - 添加 "validation", "dependency analysis"
- [ ] ticket-reviewer.md - 添加 "architecture review", "test analysis"
- [ ] ticket-validator.md - 添加 "quality standards", "completeness check"

---

### Step 2: 在關鍵步驟中添加提示（1小時）

**任務**:
1. 找出 agents 中的關鍵決策點
2. 添加明確的技能提示
3. 保持指令簡潔清晰

**重點 Agents**:
- ticket-executor Phase 4 (VERIFY)
- bug-fixer Phase 2 (DIAGNOSE)
- code-reviewer 審查清單

---

### Step 3: 創建專門的 Skills（可選，3小時）

**任務**:
1. 識別常見的 agent 工作流程
2. 創建專門的 quality-check skills
3. 測試 skill 觸發機制

**建議的 Skills**:
- `ticket-execution-quality` - 票券執行品質檢查
- `bug-diagnosis-helper` - Bug 診斷輔助
- `deployment-validator` - 部署驗證

---

### Step 4: 測試整合（2小時）

**測試場景**:
1. 執行 ticket-executor，觀察是否觸發 code-review skill
2. 執行 bug-fixer，觀察是否觸發 fix-test skill
3. 執行 code-reviewer，觀察是否觸發 security skill

**測試方法**:
```
# Test 1: ticket-executor 整合
請使用 ticket-executor 執行 docs/tickets/test-feature/ticket-001.md

# 預期：應該自動觸發 code-review 和 security skills

# Test 2: bug-fixer 整合
我發現一個 bug，按鈕不應該在啟動時出現

# 預期：應該自動觸發 fix-test skill
```

---

## 📊 預期效果

### Before（優化前）
```
User: 執行票券
  ↓
ticket-executor agent 啟動
  ↓
執行 6 階段流程
  ↓
完成（沒有 skills 支援）
```

### After（優化後）
```
User: 執行票券
  ↓
ticket-executor agent 啟動
  ↓
READ phase
  ↓
RED phase → fix-test skill 自動觸發（如果測試失敗）
  ↓
GREEN phase
  ↓
VERIFY phase → code-review skill 自動觸發
            → security skill 自動觸發
            → fix-test skill 自動觸發（coverage check）
  ↓
DOCUMENT phase
  ↓
COMMIT phase → github skill 自動觸發（如果需要 PR）
```

---

## 🎯 成功指標

### 量化指標
- ✅ 所有 6 個 agents 的 descriptions 已優化
- ✅ 關鍵執行步驟已添加 skill 提示
- ✅ 至少創建 1-2 個 agent-specific skills
- ✅ 完成 3 個測試場景

### 質化指標
- ✅ Skills 在 agent 執行時自動觸發
- ✅ Agent 回應品質提升（利用 skills 的專業知識）
- ✅ 工作流程更智能、更全面
- ✅ 減少手動調用 skills 的需求

---

## 📝 後續優化

### Phase 2（未來）
1. **監控 Skill 觸發率**：
   - 追蹤哪些 skills 最常被觸發
   - 識別未被使用的 skills

2. **優化 Skill Descriptions**：
   - 根據實際使用情況調整關鍵字
   - 改進觸發精準度

3. **創建更多專門 Skills**：
   - 根據 agent 工作流程需求
   - 提取可重用的檢查邏輯

---

## 🔗 相關資源

- Agent 定義: `.claude/agents/`
- Project Skills: `.claude/skills/`
- Personal Skill: `~/.claude/skills/ai-driven-dev-workflow/`
- 官方文檔: https://docs.claude.com/en/docs/claude-code/skills

---

**狀態**: 📋 待實施
**預計工作量**: 8 小時
**優先級**: 高
