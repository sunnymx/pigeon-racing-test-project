# {Feature Name} - Tickets Overview

**Feature**: {One-line feature description}
**Total Tickets**: {N} tickets
**Estimated Time**: {min}-{max} hours
**Status**: {X}/{N} complete ({XX}%)
**Created**: {YYYY-MM-DD}
**Last Updated**: {YYYY-MM-DD}

---

## 📊 Project Progress

| Metric | Value | Target |
|--------|-------|--------|
| Tickets Complete | {X}/{N} | {N}/{N} |
| Estimated Time | {min}-{max}h | - |
| Actual Time | {actual}h | - |
| Efficiency | {XX}% | 100% |
| Status | 🟡 In Progress | ✅ Complete |

---

## 📋 Ticket List

| Ticket | Title | Priority | Est. Time | Actual Time | Status | Depends On | Blocks |
|--------|-------|----------|-----------|-------------|--------|------------|--------|
| [001](ticket-001-xxx.md) | {Title} | P{X} | {X-Yh} | - | 🟡 Pending | none | 003 |
| [002](ticket-002-xxx.md) | {Title} | P{X} | {X-Yh} | - | 🟡 Pending | none | 003 |
| [003](ticket-003-xxx.md) | {Title} | P{X} | {X-Yh} | - | 🟡 Pending | 001, 002 | - |

**Status Legend**:
- 🟡 Pending: Not started
- 🔵 In Progress: Currently being worked on
- ✅ Complete: Finished and validated
- 🔴 Blocked: Failed after 3 attempts or dependency blocked

---

## 🎯 Execution Strategy

### Recommended Approach

**Wave 1: {Wave description}** (Can run in parallel)
- Execute `ticket-001`, `ticket-002` simultaneously
- Estimated time: {X-Yh}
- Goal: {What this wave achieves}

**Wave 2: {Wave description}** (Sequential)
- Execute `ticket-003` after Wave 1 complete
- Estimated time: {X-Yh}
- Goal: {What this wave achieves}

### Timeline Estimate

- **Week 1**: Wave 1 ({X-Yh})
- **Week 2**: Wave 2 ({X-Yh})
- **Total**: {N} weeks

---

## 🔗 Dependencies Graph

```mermaid
graph TD
    subgraph Wave 1 (Parallel)
        T001[Ticket-001: {title}]
        T002[Ticket-002: {title}]
    end

    subgraph Wave 2 (Sequential)
        T003[Ticket-003: {title}]
    end

    T001 --> T003
    T002 --> T003

    style T001 fill:#90EE90
    style T002 fill:#90EE90
    style T003 fill:#FFD700
```

**Legend**:
- Green: Can execute in parallel
- Yellow: Requires dependencies
- Red: Blocked

---

## 📝 Notes

{Any important notes about this feature or ticket set}

**Key Constraints**:
- {Constraint 1}
- {Constraint 2}

**Assumptions**:
- {Assumption 1}
- {Assumption 2}

---

## 🚀 Getting Started

### Execute All Tickets (Semi-Automatic)

```bash
# Use AI-Driven Development Workflow skill
# Ask Claude: "Execute tickets in docs/tickets/{feature-name}/ in semi mode"
```

### Execute Specific Ticket

```bash
# Ask Claude: "Execute ticket-001 from docs/tickets/{feature-name}/"
```

### Resume from Failure

```bash
# Ask Claude: "Resume tickets from ticket-003 in docs/tickets/{feature-name}/"
```

---

## 📚 Related Documentation

- Spec Document: `docs/specs/{feature-name}.md`
- Workflow Standard: `docs/AI-Driven_Development_Workflow.md`
- Implementation Guide: `CLAUDE.md`

---

## 🔄 Update Log

| Date | Ticket | Status | Notes |
|------|--------|--------|-------|
| {YYYY-MM-DD} | 001 | ✅ Complete | {notes} |
| {YYYY-MM-DD} | 002 | 🔴 Blocked | {notes} |
