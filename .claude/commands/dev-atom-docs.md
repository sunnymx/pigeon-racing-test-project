---
description: Create atomic task structure with index and independent task files (for projects > 20 tasks)
argument-hint: Describe what you need planned (e.g., "refactor authentication system", "implement microservices")
---

You are an elite strategic planning specialist. Create a comprehensive, actionable plan with atomic task structure for: $ARGUMENTS

## Instructions

1. **Analyze the request** and determine the scope of planning needed
2. **Examine relevant files** in the codebase to understand current state
3. **Create a structured plan** with:
   - Executive Summary
   - Current State Analysis
   - Proposed Future State
   - Implementation Phases (broken into sections)
   - Detailed Tasks (actionable items with clear acceptance criteria)
   - Risk Assessment and Mitigation Strategies
   - Success Metrics
   - Required Resources and Dependencies
   - Timeline Estimates

4. **Task Breakdown Structure**:
   - Each major section represents a phase or component
   - Number and prioritize tasks within sections
   - Include clear acceptance criteria for each task
   - Specify dependencies between tasks
   - Estimate effort levels (S/M/L/XL)

5. **Create atomic task management structure**:
   - Create directory: `dev/active/[task-name]/`
   - Generate four files:
     - `[task-name]-plan.md` - The comprehensive strategic plan
     - `[task-name]-context.md` - Key files, decisions, dependencies
     - `[task-name]-index.md` - Task dashboard with status overview and quick links
     - `tasks/T###-[task-name].md` - Individual atomic task files (one per task)
   - Include "Last Updated: YYYY-MM-DD" in each file

## Architecture Principles for Atomic Tasks

**Separation of Concerns**: Each task is an independent, self-contained unit
**Single Responsibility**: One task = One clear objective
**Referential Integrity**: Tasks link to each other via Task IDs (T001, T002, etc.)
**Version Control Friendly**: Small files result in clear, reviewable git diffs
**Manual Maintenance**: No scripts needed - structure is simple enough for hand editing

## Output Structure

```
dev/active/[task-name]/
├── [task-name]-plan.md         # Complete strategic plan (same as dev-docs)
├── [task-name]-context.md      # Key context (same as dev-docs)
├── [task-name]-index.md        # NEW: Task dashboard and navigation
└── tasks/                      # NEW: Atomic task directory
    ├── T001-task-name.md
    ├── T002-task-name.md
    ├── T003-task-name.md
    └── ...
```

## Index File Template (`[task-name]-index.md`)

```markdown
# [Project Name] - Task Index

**Project Code**: [code]
**Last Updated**: YYYY-MM-DD
**Total Tasks**: ## tasks
**Status**: 🟡 Status (X/## completed)
**Estimated Time**: X-Y hours

---

## ⏱️ Quick Status

| Phase | Status | Completion | Time Est. | Time Actual |
|-------|--------|------------|-----------|-------------|
| Phase 1: [Name] | Status | X/Y | Xmin | - |
| Phase 2: [Name] | Status | X/Y | Xmin | - |
| **TOTAL** | **Status** | **X/Y** | **Xmin** | **-** |

---

## 📋 Task List by Phase

### Phase 1: [Phase Name] ([Estimated Time])

**Priority**: 🔴 P0 / 🟡 P1 / 🟢 P2
**Estimated Time**: X minutes
**Dependencies**: None / Task IDs

---

#### ✅/🟡/⬜ Task [ID]: [Task Name]
**File**: [tasks/T###-task-name.md](tasks/T###-task-name.md)
**Time Estimate**: X minutes
**Status**: ✅ Completed / 🟡 In Progress / ⬜ Not Started / 🚫 Blocked
**Dependencies**: Task IDs or None

**Checklist Summary** (Top-level only):
- [ ] Main step 1
- [ ] Main step 2

**Acceptance Criteria Summary** (Top-level only):
- [ ] Key criterion 1
- [ ] Key criterion 2

**Notes**:
```
Brief notes or warnings if any
```

---

[Repeat for each task in each phase]

---

## 📊 Validation & Testing

[Testing tasks section]

---

## 📝 Post-Completion Checklist

- [ ] All implementation tasks completed
- [ ] All validation levels passed
- [ ] Document actual time spent
- [ ] Update this index with completion status
- [ ] Create lessons-learned.md (optional)
- [ ] Commit changes with descriptive message

---

## 🎯 Success Metrics

### Before Fix
- [Metric]: [Value]

### After Fix (Target)
- [Metric]: [Target] ✅

### Actual Results (Fill After Completion)
- [Metric]: [Actual]

---

## 📞 Quick Links

- [📋 Complete Plan]([task-name]-plan.md) - Full strategic plan
- [📚 Context & Decisions]([task-name]-context.md) - Background and key decisions
- [📁 All Tasks](tasks/) - Individual task files

---

## 📈 Progress Tracking

**Completed**: X/Y (Z%)
**In Progress**: X/Y (Z%)
**Blocked**: X/Y (Z%)
**Not Started**: X/Y (Z%)

**Next Actions**:
1. [Next immediate action]
2. [Second priority action]

---

**Last Updated**: YYYY-MM-DD HH:MM:SS
```

## Individual Task File Template (`tasks/T###-[task-name].md`)

```markdown
# T###: [Task Name]

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Completed | 🚫 Blocked
**Priority**: P0-Critical | P1-High | P2-Medium | P3-Low
**Effort**: S (5min) | M (10-15min) | L (20-30min) | XL (>30min)
**Phase**: Phase # - [Phase Name]
**Estimated Time**: X minutes
**Dependencies**: [Task IDs] or None
**Blocks**: [Task IDs] or None

---

## 📖 Task Overview

[Clear description of what this task accomplishes - 2-3 sentences]

**Context**:
[Why this task is needed and how it fits into the overall plan]

---

## 🎯 Objectives

**Primary Goal**: [Main objective]

**Success Criteria**:
- [Criterion 1]
- [Criterion 2]

---

## 📋 Detailed Checklist

[IMPORTANT: This is the COMPLETE checklist from the original plan task]

### Part A: [Section Name]
- [ ] Step 1: [Detailed step description]
- [ ] Step 2: [Detailed step description]
- [ ] Step 3: [Detailed step description]

### Part B: [Section Name] (if applicable)
- [ ] Step 1: [Detailed step description]
- [ ] Step 2: [Detailed step description]

[Continue with all sub-sections from the original task]

---

## ✅ Acceptance Criteria

[IMPORTANT: Copy ALL acceptance criteria from the original plan task]

### Functional Requirements
- [ ] [Detailed criterion from original plan]
- [ ] [Detailed criterion from original plan]
- [ ] [Detailed criterion from original plan]

### Technical Requirements
- [ ] [Detailed criterion from original plan]
- [ ] [Detailed criterion from original plan]

### Visual Requirements (if applicable)
- [ ] [Detailed criterion from original plan]

---

## 🧪 Verification Steps

[IMPORTANT: Copy verification steps from the original plan]

### Manual Testing
1. [Test step 1 from original plan]
2. [Test step 2 from original plan]
3. [Verification checkpoint from original plan]

### Automated Checks (if applicable)
```bash
# [Command from original plan]
```

**Expected Result**: [Expected output from original plan]

---

## 📚 Technical Details

[IMPORTANT: Include all technical details from the original plan]

**File Locations**:
- **File**: `[path]` (Line X-Y)
- **Related Files**: [List]

**Code Changes**:
```[language]
// [Code snippet from original plan if provided]
```

**Important Notes**:
```
[Any technical notes, warnings, or context from original plan]
```

---

## ⚠️ Risks & Mitigation

[Copy from original plan if this task has specific risks]

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [Impact level] | [How to mitigate] |

---

## 🔗 Related Tasks

**Depends On**: [T### - Task Name](T###-task-name.md) or None
**Blocks**: [T### - Task Name](T###-task-name.md) or None
**Related**: [T### - Task Name](T###-task-name.md) (optional)

---

## 📝 Notes & Progress

**Started**: [YYYY-MM-DD HH:MM] or Not started
**Completed**: [YYYY-MM-DD HH:MM] or Not completed
**Actual Time**: [X minutes] or TBD

**Progress Notes**:
- [Date/Time] - [Note about progress or blockers]

---

**Last Updated**: YYYY-MM-DD HH:MM:SS
```

## Quality Standards

### For Plan and Context Files
- IDENTICAL to `/dev-docs` output
- Same comprehensive strategic planning
- Same risk assessment depth
- Same timeline estimates

### For Index File
- Maintain same task organization as original tasks.md
- Preserve all phase information and dependencies
- Include same quick status tables
- Provide clear navigation to individual tasks

### For Individual Task Files
- **COMPLETE CONTENT**: Each task file must contain ALL details from the corresponding section in the original tasks.md
- **NO SUMMARIZATION**: Do not abbreviate checklists, acceptance criteria, or verification steps
- **PRESERVE STRUCTURE**: Maintain the exact same level of detail as the original plan
- **SELF-CONTAINED**: Each task should be understandable without referring to other files (except for dependency context)

## Content Migration Rule

**CRITICAL**: When splitting tasks from the monolithic tasks.md format to atomic files:

1. **Identify source content**: Find the task section in the original plan (e.g., "Task 1.1: Fix Interpolation Expressions")
2. **Copy EVERYTHING**: Include all sub-sections, all checklist items, all acceptance criteria, all code examples
3. **Preserve formatting**: Keep code blocks, tables, lists exactly as they were
4. **Add task metadata**: Add Status, Priority, Effort, Dependencies at the top
5. **Create navigation**: Add Related Tasks section with links to dependencies
6. **Maintain detail level**: If the original had 20 checklist items, the atomic file should have all 20

**Example Transformation**:

Original tasks.md:
```markdown
### Task 1.1: Fix Interpolation Expressions
**Checklist**:
- [ ] Open frontend/index.html
- [ ] Line 1359: Change {{ tracks.length }} → {{ store.tracks.length }}
- [ ] Line 1669: Change {{ currentTrackPoints.length }} → {{ store.currentTrackPoints.length }}
- [ ] Save file
- [ ] Run verification command
- [ ] Verify grep returns empty

**Acceptance Criteria**:
- [ ] No undefined.length errors
- [ ] Track count displays correctly
- [ ] Track points count displays
```

Atomic file T001-fix-interpolation-expressions.md:
```markdown
# T001: Fix Interpolation Expressions

**Status**: ⬜ Not Started
**Priority**: P0 - Critical
**Effort**: S (5 minutes)

## 📋 Detailed Checklist
- [ ] Open frontend/index.html
- [ ] Line 1359: Change {{ tracks.length }} → {{ store.tracks.length }}
- [ ] Line 1669: Change {{ currentTrackPoints.length }} → {{ store.currentTrackPoints.length }}
- [ ] Save file
- [ ] Run verification command: grep -n '{{ \(tracks\|results\|currentTrackPoints\)\.length }}' frontend/index.html
- [ ] Verify grep returns empty (no matches)

## ✅ Acceptance Criteria
### Functional Requirements
- [ ] No undefined.length errors in console
- [ ] Track count displays correctly: 顯示選中的軌跡 (2/25)
- [ ] Track points count displays: 總計 1234 個點
- [ ] Results count displays: 篩選結果 (共 3 條可疑軌跡)

[... ALL other details from original ...]
```

## Context References

- Check `PROJECT_KNOWLEDGE.md` for architecture overview (if exists)
- Consult `BEST_PRACTICES.md` for coding standards (if exists)
- Reference `TROUBLESHOOTING.md` for common issues to avoid (if exists)

## Task Numbering Convention

- Use T### format (T001, T002, ..., T099)
- Sequential numbering within project
- Preserve task order from original plan phases
- Gap numbering allowed for future insertions (e.g., T010, T020, T030)

## When to Use This Command

**Use `/dev-atom-docs`** when:
- Project has > 20 tasks
- Long-term project (> 1 month)
- Multiple phases or contributors
- Need granular progress tracking
- Want clear git history per task

**Use `/dev-docs`** when:
- Project has < 20 tasks
- Short-term project (< 1 week)
- Single contributor
- Prefer single-file simplicity

---

**Note**: This command creates the same comprehensive planning as `/dev-docs`, but organizes output into an atomic task structure for better maintainability and tracking. The total content volume is identical - just distributed across multiple files for better organization.

**Last Updated**: 2025-11-21
