# AI-Driven Development Workflow

**Version**: 2.0 (Skill + Subagent Architecture)
**Last Updated**: 2025-10-29

---

## Overview

This is a hybrid Skill + Subagent system for automated ticket-driven development using the AI-Driven Development Workflow methodology.

**Architecture**:
- **Skill (Router)**: Lightweight intent recognition and routing (`SKILL.md`)
- **Subagents (Workers)**: Specialized agents with isolated contexts for complex workflows
  - `ticket-generator`: Convert specs into atomic tickets
  - `ticket-executor`: Execute tickets using TDD (RED→GREEN→VERIFY)
  - `ticket-validator`: Validate ticket quality and structure

---

## Architecture Diagram

```
User Request
    ↓
Skill (Router) - Identifies intent
    ↓
┌───────────────┼───────────────┐
│               │               │
↓               ↓               ↓
ticket-generator  ticket-executor  ticket-validator
(Subagent)        (Subagent)        (Subagent)
│               │               │
└───────────────┴───────────────┘
    ↓
Result back to user
```

---

## Usage Examples

### 1. Generate Tickets from Spec

**User request**:
```
Generate tickets from docs/specs/authentication.md
```

**What happens**:
1. **Skill** detects intent: "generate tickets" → routes to `ticket-generator`
2. **ticket-generator** subagent:
   - Reads spec file
   - Breaks down into atomic tickets (2-4h each)
   - Generates ticket files using template
   - Builds dependency graph
   - Creates README index
   - Validates all tickets
3. **Result**: Ticket files created in `docs/tickets/authentication/`

**Output**:
```
✅ Ticket generation complete!

Generated:
- 5 tickets (10-15h total estimate)
- Dependency graph (no circular dependencies)
- README.md with execution plan

Location: docs/tickets/authentication/

Next steps:
- Review generated tickets
- Execute using: "Execute tickets in docs/tickets/authentication/"
```

---

### 2. Execute Tickets with TDD

**User request**:
```
Execute tickets in docs/tickets/authentication/ in semi mode
```

**What happens**:
1. **Skill** detects intent: "execute tickets" → routes to `ticket-executor`
2. **ticket-executor** subagent:
   - Scans directory for tickets
   - Builds execution order (respects dependencies)
   - Executes each ticket through 6 phases:
     - READ: Understand requirements
     - RED: Write failing tests
     - GREEN: Write minimal implementation (Max 3 Attempts)
     - VERIFY: Run quality checks (coverage, types, style)
     - DOCUMENT: Update ticket status and docs
     - COMMIT: Create atomic commit
   - Pauses after each phase for user confirmation (semi mode)
3. **Result**: Code implemented, tested, documented, committed

**Output** (per ticket):
```
📖 [READ] Understanding ticket-002
🔴 [RED] Writing tests (3 tests, failing as expected)
🟢 [GREEN] Writing implementation (tests pass, 1/3 attempts)
✅ [VERIFY] Quality checks (coverage 92%, all checks pass)
📝 [DOCUMENT] Updated ticket status to Complete
💾 [COMMIT] Created commit a1b2c3d

✅ Ticket-002 complete!
```

---

### 3. Validate Tickets

**User request**:
```
Validate all tickets in docs/tickets/authentication/
```

**What happens**:
1. **Skill** detects intent: "validate" → routes to `ticket-validator`
2. **ticket-validator** subagent:
   - Scans directory for all tickets
   - Validates each ticket:
     - Structure: All required sections present?
     - Content: AC testable? Steps have code examples?
     - Dependencies: No circular dependencies?
   - Runs validation script
   - Generates comprehensive report
3. **Result**: Validation report with pass/fail for each ticket

**Output**:
```
✅ Validation complete: docs/tickets/authentication/

Tickets: 5 total
- ✅ Pass: 4
- ❌ Fail: 1

Issues:
- ticket-003: Missing Out-of-Scope section (CRITICAL)

Next steps:
1. Fix ticket-003: Add Out-of-Scope section
2. Re-run validation
```

---

## Directory Structure

```
.claude/
├── skills/
│   └── ai-driven-dev-workflow/
│       ├── SKILL.md                    # Router (lightweight)
│       ├── README.md                   # This file
│       ├── assets/                     # Shared templates
│       │   ├── ticket-template.md
│       │   ├── readme-template.md
│       │   └── failure-report-template.md
│       ├── scripts/                    # Shared utility scripts
│       │   ├── validate_ticket.py
│       │   ├── build_dependency_graph.py
│       │   └── check_test_coverage.py
│       └── references/                 # Documentation
│           ├── ai-driven-workflow-standard.md
│           ├── tdd-workflow-guide.md
│           └── ticket-quality-checklist.md
└── agents/
    ├── ticket-generator.md             # Ticket generation agent
    ├── ticket-executor.md              # TDD execution agent (6 phases)
    └── ticket-validator.md             # Validation agent
```

---

## How It Works

### Skill (Router) - SKILL.md

**Role**: Identify user intent and route to appropriate subagent

**Keywords Detection**:
- **Generate/Create/Break down** → `ticket-generator`
- **Execute/Implement/Run** → `ticket-executor`
- **Validate/Check/Review** → `ticket-validator`

**Invocation**: Automatic (Claude detects based on description)

**Example**:
```python
# User says: "Generate tickets from spec"
# Skill detects: intent = "generate"
# Skill routes: Task(subagent_type="ticket-generator", prompt="...")
```

---

### Subagent: ticket-generator

**Role**: Convert specification documents into atomic, testable tickets

**Workflow** (7 steps):
1. Read and analyze specification
2. Identify core requirements
3. Break down into atomic units (2-4h each)
4. Generate tickets using template
5. Build dependency graph (Mermaid)
6. Create README index with execution plan
7. Validate all tickets

**Tools**: Read, Write, Glob, Grep, Bash

**Output**:
- Multiple `ticket-NNN-name.md` files
- `README.md` with execution plan
- `dependencies.mermaid` graph
- Validation report

---

### Subagent: ticket-executor

**Role**: Execute tickets using strict TDD methodology

**Workflow** (6 phases per ticket):
1. **READ**: Understand requirements, verify dependencies
2. **RED**: Write failing tests (confirm they fail for right reasons)
3. **GREEN**: Write minimal implementation (Max 3 Attempts Rule)
4. **VERIFY**: Run quality checks (coverage ≥90%, types, PEP 8)
5. **DOCUMENT**: Update ticket status, add execution log
6. **COMMIT**: Create atomic commit with clear message

**Execution Modes**:
- **Auto**: Execute all tickets without pausing (stop on failure)
- **Semi** (default): Pause after each phase for confirmation
- **Manual**: User controls phase transitions

**Tools**: Read, Write, Edit, Bash, TodoWrite

**Quality Gates**:
- ✅ All tests passing (100%)
- ✅ Code coverage ≥90%
- ✅ Type hints present
- ✅ PEP 8 compliant (flake8)
- ✅ Docstrings added
- ✅ Atomic commit

---

### Subagent: ticket-validator

**Role**: Validate ticket structure and quality

**Validation Criteria**:
1. **Structure**: All required sections present (especially Out-of-Scope)
2. **Content**: AC testable, implementation steps have code examples
3. **Dependencies**: No circular dependencies, all references valid
4. **Estimate**: 2-4h preferred, ≤8h acceptable

**Severity Levels**:
- ❌ **ERROR**: Must fix (missing sections, circular deps)
- ⚠️  **WARNING**: Should fix (vague AC, no code examples)
- ✅ **PASS**: All checks passed

**Tools**: Read, Glob, Grep, Bash

**Output**: Detailed validation report with actionable feedback

---

## Key Features

### 1. Max 3 Attempts Rule

**What**: Prevents infinite retry loops during ticket execution

**When**: Applied in GREEN and VERIFY phases

**How**:
```
Attempt 1 fails → Analyze and retry
Attempt 2 fails → Analyze and retry
Attempt 3 fails → Mark ticket 🔴 Blocked, generate failure report, STOP
```

**Why**: Recognizes when a ticket needs human intervention

---

### 2. Isolated Contexts (Subagents)

**Benefit**: Each subagent has its own context window

**Why it matters**:
- ✅ No context pollution (generator doesn't interfere with executor)
- ✅ Better focus (each subagent specialized)
- ✅ Scalable (can add more subagents)
- ✅ Debuggable (isolated execution)

---

### 3. TDD Enforcement

**Non-negotiable**: Tests BEFORE implementation

**Phases**:
- **RED**: Tests must fail first (confirms testing new functionality)
- **GREEN**: Minimal code to pass tests
- **VERIFY**: Quality checks ensure standards met

**Quality**:
- 90% code coverage
- Type hints on all functions
- PEP 8 compliance
- Docstrings present

---

### 4. Dependency Management

**What**: Tickets can depend on other tickets

**Format**: `depends_on: [001, 003]`

**Features**:
- ✅ Automatic execution order (topological sort)
- ✅ Circular dependency detection
- ✅ Wave-based parallel execution
- ✅ Dependency validation before execution

---

### 5. Atomic Commits

**Rule**: One ticket = one commit

**Format**:
```
{type}: {summary} (ticket-{ID})

- Acceptance Criteria met: AC1, AC2, AC3
- Tests: {X} new tests, all passing
- Coverage: {XX}%

Ticket: ticket-{ID}-{slug}.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: feat, fix, refactor, test, docs

---

## Quality Standards

Every completed ticket must meet:
- [ ] All tests passing (100%)
- [ ] Code coverage ≥ 90% for new code
- [ ] Type hints present on all functions
- [ ] PEP 8 compliant (flake8 passes)
- [ ] Docstrings added (all public functions/classes)
- [ ] No unnecessary complexity (keep it simple)
- [ ] Atomic commit with clear message

---

## Common Workflows

### Workflow 1: New Feature from Scratch

```
1. Write spec: docs/specs/my-feature.md
2. Generate tickets: "Generate tickets from docs/specs/my-feature.md"
3. Review tickets: Check docs/tickets/my-feature/README.md
4. Execute tickets: "Execute tickets in docs/tickets/my-feature/ in semi mode"
5. Complete feature: All tickets committed
```

---

### Workflow 2: Resume from Failure

```
1. Ticket-003 fails during execution
2. Failure report generated: ticket-003-failure-report.md
3. Review report, apply fix manually
4. Resume: "Resume tickets from ticket-003"
5. Continues with remaining tickets
```

---

### Workflow 3: Validate Before Execution

```
1. Generate tickets (step 1)
2. Validate tickets: "Validate all tickets in docs/tickets/my-feature/"
3. Fix any issues found
4. Re-validate to confirm
5. Execute tickets (confident they're quality)
```

---

## Advantages of Skill + Subagent Architecture

| Aspect | Old (Skill Only) | New (Skill + Subagent) |
|--------|------------------|------------------------|
| **Context** | Shared with main conversation | Isolated per subagent |
| **Complexity** | Limited to simple tasks | Handles complex multi-step workflows |
| **State Management** | Difficult | Easy (maintained in subagent context) |
| **Debugging** | Hard to isolate issues | Clear separation of concerns |
| **Scalability** | Limited | Easy to add new subagents |
| **User Experience** | Blocks main conversation | Runs independently, cleaner output |

---

## Migration from Old Skill

**Old approach** (single Skill):
- Everything in one SKILL.md file
- Complex workflows in main conversation
- Context gets crowded quickly

**New approach** (Skill + Subagent):
- SKILL.md is lightweight router
- Complex workflows in isolated subagents
- Clean separation, better UX

**Backward compatibility**: Not breaking - Skill still works, just routes now

---

## Troubleshooting

### Issue: Skill not routing to subagent

**Check**:
1. User request contains keywords (generate/execute/validate)?
2. Skill description matches user intent?
3. Subagent exists at `/Users/tf/.claude/subagents/{name}/prompt.md`?

**Solution**: Clarify user intent, ensure keywords present

---

### Issue: Subagent cannot find resources

**Check**:
1. Resource paths use `~/.claude/skills/ai-driven-dev-workflow/`?
2. Files exist at expected locations?

**Solution**: Use absolute paths in subagent prompts

---

### Issue: Validation script fails

**Check**:
1. Script executable? `chmod +x scripts/validate_ticket.py`
2. Python available? `python --version`
3. Correct path to script?

**Solution**: Verify script exists and is executable

---

## Future Enhancements

Potential additions:
- [ ] `ticket-merger` subagent: Merge related tickets
- [ ] `ticket-splitter` subagent: Split large tickets
- [ ] `ticket-analyzer` subagent: Analyze completed tickets for insights
- [ ] `dependency-optimizer` subagent: Suggest better dependency structures

---

## Resources

**Templates** (`assets/`):
- `ticket-template.md`: Standard ticket structure
- `readme-template.md`: Ticket directory index
- `failure-report-template.md`: Failure documentation

**Scripts** (`scripts/`):
- `validate_ticket.py`: Structural validation
- `build_dependency_graph.py`: Generate Mermaid graph
- `check_test_coverage.py`: Coverage validation

**References** (`references/`):
- `ai-driven-workflow-standard.md`: Complete workflow spec
- `tdd-workflow-guide.md`: TDD methodology guide
- `ticket-quality-checklist.md`: Quality assessment guide

---

## Version History

**v2.0** (2025-10-29):
- ✅ Migrated to Skill + Subagent architecture
- ✅ Created three specialized subagents
- ✅ Isolated contexts for complex workflows
- ✅ Improved scalability and maintainability

**v1.0** (Previous):
- Single Skill implementation
- All logic in SKILL.md
- Limited to simple workflows

---

## Contributing

To add a new subagent:
1. Create directory: `.claude/subagents/{subagent-name}/`
2. Add `prompt.md` with detailed instructions
3. Update `SKILL.md` router to detect intent and route
4. Test with sample requests
5. Document in this README

---

## Contact & Support

For questions or issues:
- Check `references/` documentation first
- Review subagent `prompt.md` files for detailed workflows
- Analyze failure reports for execution issues

---

**Status**: ✅ Production Ready
**Architecture**: Skill + Subagent (Hybrid)
**Test Coverage**: Manual testing recommended before first use
