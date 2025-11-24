<!-- DISABLED: This skill is not in use
---
name: ai-driven-dev-workflow
description: Automated ticket-driven development router using AI-Driven Development Workflow methodology. This skill should be used when users request ticket generation from specs, ticket execution with TDD methodology, or ticket validation. Acts as a lightweight router to dispatch to specialized subagents.
---
-->

# AI-Driven Development Workflow (Router)

**Role**: Lightweight router that identifies user intent and dispatches to specialized subagents.

---

## When to Use This Skill

This skill activates when users mention:
- **Ticket generation**: "Generate tickets from spec", "Create tickets", "Break down requirements"
- **Ticket execution**: "Execute tickets", "Run TDD workflow", "Implement ticket-XXX"
- **Ticket validation**: "Validate tickets", "Check ticket quality", "Verify ticket structure"

---

## How It Works

This skill analyzes the user's request and routes to the appropriate subagent:

### 1. Ticket Generation Intent → `ticket-generator` subagent

**Keywords to detect**:
- "generate ticket(s)"
- "create ticket(s)"
- "break down spec/requirements"
- "convert spec to tickets"

**Example requests**:
- "Generate tickets from docs/specs/my-feature.md"
- "Create tickets for the new authentication feature"
- "Break down this spec into executable tickets"

**Action**: Use the `Task` tool to invoke the `ticket-generator` subagent with the spec file path.

---

### 2. Ticket Execution Intent → `ticket-executor` subagent

**Keywords to detect**:
- "execute ticket(s)"
- "implement ticket(s)"
- "run TDD workflow"
- "start working on ticket(s)"
- "resume from ticket-XXX"

**Example requests**:
- "Execute tickets in docs/tickets/my-feature/"
- "Implement ticket-003 using TDD"
- "Run tickets R15.1 through R15.3"
- "Resume from ticket-005"

**Action**: Use the `Task` tool to invoke the `ticket-executor` subagent with the ticket directory/file path and execution mode.

---

### 3. Ticket Validation Intent → `ticket-validator` subagent

**Keywords to detect**:
- "validate ticket(s)"
- "check ticket quality"
- "verify ticket structure"
- "review ticket(s)"
- "audit tickets"

**Example requests**:
- "Validate all tickets in docs/tickets/my-feature/"
- "Check if ticket-003 meets quality standards"
- "Review the generated tickets for completeness"

**Action**: Use the `Task` tool to invoke the `ticket-validator` subagent with the ticket directory/file path.

---

## Routing Logic

```
User Request → Analyze intent → Route to subagent

Intent Detection:
├── Generate/Create/Break down → ticket-generator
├── Execute/Implement/Run → ticket-executor
└── Validate/Check/Review → ticket-validator
```

---

## Example Routing Scenarios

### Scenario 1: User wants to generate tickets
**User**: "Generate tickets from docs/specs/authentication.md"

**Router Action**:
```
1. Detect intent: "generate tickets" → ticket-generator
2. Extract parameters:
   - spec_file: docs/specs/authentication.md
3. Invoke: Task(subagent_type="ticket-generator", prompt="...")
```

### Scenario 2: User wants to execute tickets
**User**: "Execute tickets in docs/tickets/auth-feature/ in semi mode"

**Router Action**:
```
1. Detect intent: "execute tickets" → ticket-executor
2. Extract parameters:
   - ticket_directory: docs/tickets/auth-feature/
   - execution_mode: semi
3. Invoke: Task(subagent_type="ticket-executor", prompt="...")
```

### Scenario 3: User wants to validate tickets
**User**: "Validate all tickets in docs/tickets/auth-feature/"

**Router Action**:
```
1. Detect intent: "validate" → ticket-validator
2. Extract parameters:
   - ticket_directory: docs/tickets/auth-feature/
3. Invoke: Task(subagent_type="ticket-validator", prompt="...")
```

---

## Subagent Descriptions

### `ticket-generator`
Converts specification documents into atomic tickets (2-4h each) following AI-Driven Development Workflow standards. Generates dependency graphs, validation, and README index.

### `ticket-executor`
Executes tickets using strict TDD methodology through 6 phases: READ → RED → GREEN → VERIFY → DOCUMENT → COMMIT. Supports auto/semi/manual execution modes with Max 3 Attempts Rule.

### `ticket-validator`
Validates ticket structure against AI-Driven Development Workflow standards. Checks for required sections, Out-of-Scope presence, AC quality, time estimates, and dependency integrity.

---

## Resources Location

All shared resources are available in this skill directory:

- **Templates**: `assets/ticket-template.md`, `assets/readme-template.md`, `assets/failure-report-template.md`
- **Scripts**: `scripts/validate_ticket.py`, `scripts/build_dependency_graph.py`, `scripts/check_test_coverage.py`
- **References**: `references/ai-driven-workflow-standard.md`, `references/tdd-workflow-guide.md`, `references/ticket-quality-checklist.md`

---

## 如何觸發此技能

### 自動觸發

當你在 Claude Code 中輸入包含以下關鍵詞的請求時，UserPromptSubmit Hook 會自動推薦此技能：

**英文關鍵詞**:
- ticket, execute ticket, ticket execution
- TDD, test-driven development
- implement ticket, validate ticket
- workflow, ai-driven development

**中文關鍵詞**:
- **動詞**：執行, 實作, 實現, 驗證, 完成
- **技術術語**：ticket, 工單, TDD, 測試驅動, 工作流程, 開發流程

### 手動啟用

```bash
# 使用 Skill tool
Skill(skill="ai-driven-dev-workflow")
```

### 推薦輸入示例

✅ **觸發率高**：
- "執行 ticket #123：實作 GPX 輔助欄位計算功能"
- "使用 TDD 方法論實現新的過濾規則"
- "驗證 ticket 格式是否符合標準"
- "完成工單中的任務並運行測試"
- "從規格生成開發 tickets"

⚠️ **觸發率低**：
- "做個任務"（未提及 ticket 或 TDD）
- "寫代碼"（太通用）
- "測試功能"（未提及工作流程）

### 技能觸發機制

此技能通過以下方式被觸發：
1. **關鍵詞匹配**：輸入包含「ticket」、「執行」、「TDD」等關鍵詞
2. **意圖模式匹配**：匹配如 `(execute|implement|執行|實作).*?(ticket|工單)` 的模式
3. **文件路徑觸發**：編輯 `tickets/**/*.md`, `spec/**/*.md` 等文件

**推薦使用方式**：
- 在輸入中明確提及「ticket」或「工單」
- 說明要執行的 ticket 編號或任務描述
- 提及 TDD 或測試驅動開發方法論

---

## Important Notes

- **This skill does NOT execute workflows directly** - it only routes to specialized subagents
- Keep routing logic lightweight and fast
- Always extract necessary parameters (file paths, modes) before invoking subagents
- If user intent is unclear, ask for clarification before routing
