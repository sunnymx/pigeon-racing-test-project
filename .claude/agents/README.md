# Claude Code Agents

This directory contains specialized AI agents for different development workflows.

## 📋 Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **bug-fixer** | Diagnose and fix bugs | When bugs are reported or issues need investigation |
| **code-reviewer** | Comprehensive code review | After code changes for quality assessment |
| **ticket-executor** | Execute tickets with TDD | For implementing well-defined features |
| **ticket-generator** | Generate tickets from specs | For planning new features from specifications |
| **ticket-reviewer** | Post-execution review | After ticket completion for quality check |
| **ticket-validator** | Validate ticket quality | For checking ticket structure and completeness |

---

## 🔧 Bug Fixing Workflow

### bug-fixer Agent

**Use when**: User reports a bug, unexpected behavior, or visual issue

**Process**: 5 phases
```
REPRODUCE → DIAGNOSE → FIX → VERIFY → DOCUMENT
```

**Example**:
```
User: "Button appears at startup but shouldn't"
AI: Using bug-fixer agent to diagnose and fix...

Phase 1: REPRODUCE
- Created screenshot test ✅
- Confirmed bug exists

Phase 2: DIAGNOSE
- Root cause: Event bound too early
- Fix strategy: Defer event binding

Phase 3: FIX
- Attempt 1: Success ✅

Phase 4: VERIFY
- Tests pass ✅
- Visual check ✅
- No regressions ✅

Phase 5: DOCUMENT
- Created ISSUE-001-FIX-6.md
- Git commit created
```

**Key Features**:
- Iterative fixing (max 3 attempts)
- Root cause focus
- Visual verification support
- Complete documentation

---

## 📝 Feature Development Workflow

### ticket-generator → ticket-executor → ticket-reviewer

**1. Generate Tickets** (`ticket-generator`)
```
Input: Feature specification document
Output: Multiple atomic tickets (2-4h each)
```

**2. Execute Tickets** (`ticket-executor`)
```
Process: READ → RED → GREEN → VERIFY → DOCUMENT → COMMIT
Mode: auto / semi / manual
```

**3. Review Quality** (`ticket-reviewer`)
```
Check: Architecture, tests, technical debt
Output: Review report with actionable feedback
```

---

## 🔍 Code Review Workflow

### code-reviewer Agent

**Use when**:
- After significant code changes
- Before merging features
- For refactoring assessment

**Output**: Concise review report (150-200 lines)
- Executive summary with scores
- Critical/High/Medium issue matrix
- Improvement roadmap
- Test coverage analysis

---

## 🎯 Choosing the Right Agent

### Decision Tree

```
User reports problem?
├─ Yes → bug-fixer
└─ No
    ├─ Have detailed spec?
    │  ├─ Yes → ticket-generator → ticket-executor
    │  └─ No → Clarify requirements first
    └─ Need code review?
       ├─ After commit → code-reviewer
       └─ After ticket → ticket-reviewer
```

### Common Scenarios

| Scenario | Recommended Agent(s) |
|----------|---------------------|
| **Bug report** | bug-fixer |
| **New feature** | ticket-generator → ticket-executor |
| **Code review needed** | code-reviewer |
| **Unclear bug** | bug-fixer (diagnosis) → ticket-generator (if needed) |
| **Quality check** | ticket-reviewer or code-reviewer |
| **Ticket validation** | ticket-validator |

---

## 📚 Agent Details

### bug-fixer

**File**: `bug-fixer.md`
**Model**: sonnet
**Color**: red

**Capabilities**:
- Problem reproduction (automated tests, screenshots)
- Root cause diagnosis (static + dynamic analysis)
- Iterative fixing (max 3 attempts)
- Comprehensive verification (auto + visual + manual)
- Complete documentation

**Best for**:
- GUI issues with visual artifacts
- Runtime behavior problems
- Timing/race conditions
- Intermittent bugs

---

### code-reviewer

**File**: `code-reviewer.md`
**Model**: sonnet
**Color**: blue

**Review Areas**:
- Code quality (PEP 8, naming, DRY)
- Architecture (SOLID, coupling, cohesion)
- Error handling (specific exceptions, cleanup)
- Testing (coverage, edge cases, mocks)
- Performance (algorithms, bottlenecks)
- Documentation (docstrings, type hints)

**Output**: Concise actionable report

---

### ticket-executor

**File**: `ticket-executor.md`
**Tools**: Read, Write, Edit, Bash, TodoWrite

**Process**:
1. **READ**: Understand requirements
2. **RED**: Write failing tests
3. **GREEN**: Implement (max 3 attempts)
4. **VERIFY**: Full validation
5. **DOCUMENT**: Update ticket
6. **COMMIT**: Atomic commit

**Quality Gates**:
- 90% test coverage
- Type hints required
- PEP 8 compliance

---

### ticket-generator

**File**: `ticket-generator.md`

**Input**: Specification document
**Output**:
- Atomic tickets (2-4h each)
- Dependency graph
- README with execution plan

**Standards**: AI-Driven Development Workflow

---

### ticket-reviewer

**File**: `ticket-reviewer.md`

**Focus**:
- Architectural flaws
- Test weaknesses
- Hidden technical debt
- Integration issues

**Method**: Systematic fact-checking beyond automated tests

---

### ticket-validator

**File**: `ticket-validator.md`

**Validates**:
- Required sections present
- Content quality
- Dependencies clear
- Acceptance criteria measurable

---

## 🚀 Quick Start

### Fix a Bug

```
User: "I found a bug where [description]"
Assistant: Let me use the bug-fixer agent...
```

### Implement a Feature

```
User: "Please implement [feature] according to docs/specs/feature.md"
Assistant: I'll use ticket-generator to create tickets, then ticket-executor to implement...
```

### Review Code

```
User: "Please review my recent changes"
Assistant: Using code-reviewer agent for comprehensive review...
```

---

## 📖 Best Practices

### When to Use Multiple Agents

**Bug → Feature**:
```
bug-fixer (diagnose) → ticket-generator (plan fix) → ticket-executor (implement)
```

**Feature → Review**:
```
ticket-executor (implement) → ticket-reviewer (check quality)
```

**Complex Bug**:
```
bug-fixer (multiple iterations) → code-reviewer (review solution)
```

### Agent Collaboration

Agents are designed to work together:
- **bug-fixer** focuses on diagnosis and quick fixes
- **ticket-executor** focuses on structured implementation
- **code-reviewer** focuses on quality assessment
- **ticket-reviewer** focuses on post-execution validation

---

## 🎓 Learning from Experience

### bug-fixer Agent Creation Story

The `bug-fixer` agent was created based on the real ISSUE-001 experience:
- **Problem**: "進階監控" button visibility bug
- **Journey**: 6 fix iterations (FIX-1 through FIX-6)
- **Lesson**: Bug fixing needs specialized workflow different from feature development
- **Result**: New agent designed from actual debugging process

See `docs/AGENT-ANALYSIS-BUG-FIXING.md` for full analysis.

---

## 📝 Documentation

Each agent has:
- **Agent file**: `.claude/agents/{name}.md` - Complete workflow definition
- **Usage examples**: In this README
- **Integration guide**: How agents work together

For detailed workflow information, see individual agent files.

---

**Last Updated**: 2025-10-31
**Total Agents**: 6
**Status**: Active
