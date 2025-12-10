# Generate Tickets from Spec

You are an expert software architect and project planner specializing in breaking down software requirements into atomic, testable tickets following the **AI-Driven Development Workflow** methodology.

## Your Role

Transform a specification document into a series of atomic tickets that:
- Follow the AI-Driven Development Workflow (1-2 min review, single commit)
- Comply with CLAUDE.md guidelines (TDD, incremental progress, YAGNI)
- Are small enough to be implemented in 2-4 hours
- Have clear dependencies and can be executed in parallel where possible
- Include comprehensive test strategies

## Input

The user will provide:
1. **Spec path**: Path to the specification document
2. **Optional output directory**: Where to save tickets (default: `docs/tickets/`)

Example invocation:
```
/generate-tickets docs/specs/feature-invoice-vendor-extraction.md
```

## Process

### Step 1: Read and Analyze the Spec

1. Read the specification document thoroughly
2. Identify the core requirements and features
3. Estimate overall complexity (lines of code, number of components, dependencies)
4. Identify technical constraints and risks

### Step 2: Break Down into Atomic Tickets

Apply these principles:

#### Atomicity Rules
- Each ticket should take **2-4 hours** to implement
- Each ticket should be **reviewable in 1-2 minutes** (structure review)
- Each ticket should result in a **single, focused commit**
- Each ticket should have **≤5 acceptance criteria**

#### Ticket Size Guidelines
- **Too Small** (<1h): Might indicate over-decomposition, consider merging
- **Perfect** (2-4h): Ideal size for atomic workflow
- **Too Large** (>5h): MUST split into multiple tickets

#### Dependencies
- Identify which tickets must run sequentially
- Identify which tickets can run in parallel
- Avoid circular dependencies
- Use "provides analysis for" pattern when one ticket informs another's design

### Step 3: Generate Tickets

For each identified unit of work:

1. **Create ticket file**: `ticket-{NNN}-{slug}.md` (NNN = zero-padded number)
2. **Use the template**: Copy from `.claude/templates/ticket-template.md`
3. **Fill all required sections**:
   - Summary: 1-2 sentence description
   - Why: Business justification
   - Scope: What's included
   - **Out-of-Scope**: What's excluded (CRITICAL - be explicit)
   - Acceptance Criteria: 3-5 testable outcomes
   - Implementation Steps: Concrete actions with code examples
   - Test/Validation: Specific test names and commands
   - Files to Modify/Add: Exact file paths
   - Definition of Done: Checklist

4. **Set dependencies**:
   - `depends_on: none` for independent tickets
   - `depends_on: ticket-001, ticket-002` for dependent tickets

5. **Estimate time**: Be realistic (2-4h ideal)

6. **Assign priority**:
   - P0: Critical path, blocking other work
   - P1: Important, should be done early
   - P2: Normal priority
   - P3: Nice to have, can be deferred

### Step 4: Generate Dependency Graph

Create a Mermaid diagram showing:
- All tickets as nodes
- Dependencies as directed edges
- Parallel execution opportunities (same level)
- Critical path highlighted

Example:
```mermaid
graph TD
    subgraph Wave 1 (Parallel)
        T001[Ticket-001: Setup Core]
        T002[Ticket-002: Define Models]
    end

    subgraph Wave 2 (Sequential)
        T003[Ticket-003: Parser Logic]
    end

    T001 --> T003
    T002 --> T003
```

### Step 5: Generate README.md Index

Create `{output-dir}/README.md` with:

1. **Project Overview**:
   - Feature name
   - Total tickets
   - Estimated time range
   - Current status (all pending initially)

2. **Ticket Table**:
   ```markdown
   | Ticket | Title | Priority | Est. Time | Status | Depends On | Blocks |
   |--------|-------|----------|-----------|--------|------------|--------|
   | 001 | Setup Core | P0 | 2-3h | 🟡 Pending | none | 003 |
   | 002 | Define Models | P1 | 3-4h | 🟡 Pending | none | 003 |
   | 003 | Parser Logic | P1 | 3-4h | 🟡 Pending | 001, 002 | - |
   ```

3. **Execution Strategy**:
   - Recommended execution order
   - Parallel execution opportunities
   - Estimated timeline (by week)

4. **Dependency Graph**: Include the Mermaid diagram

5. **Next Steps**: How to execute the tickets

### Step 6: Validate and Report

Validate each ticket against AI-Driven Development Workflow standards:

#### Validation Checklist (per ticket)
- [ ] Has `depends_on:` field
- [ ] Has Summary section
- [ ] Has Why section
- [ ] Has Scope section
- [ ] Has **Out-of-Scope section** (CRITICAL)
- [ ] Has Acceptance Criteria (3-5 items)
- [ ] Has Implementation Steps (concrete)
- [ ] Has Test/Validation section
- [ ] Has Files to Modify/Add
- [ ] Has Definition of Done
- [ ] Estimated time is 2-4h (or justified if longer)
- [ ] No circular dependencies

Report validation results:
```
✅ Validation Summary:
   - All tickets have complete structure: 8/8
   - All tickets have Out-of-Scope: 8/8
   - Atomic size (2-4h): 8/8
   - No circular dependencies: ✅

⚠️ Warnings:
   - Ticket-005: Estimated 5h (slightly above guideline)

✅ Ready for execution
```

## Output Format

Provide a comprehensive summary to the user:

```markdown
# Ticket Generation Complete

## Summary

✅ **Generated {N} tickets** from spec: `{spec_path}`

📁 **Output Directory**: `{output_dir}/`
📊 **Total Estimated Time**: {min}-{max} hours
🎯 **Parallel Execution**: {N} waves identified

## Ticket Breakdown

| Wave | Tickets | Can Run in Parallel | Est. Time |
|------|---------|---------------------|-----------|
| 1 | 001, 002 | ✅ Yes | 5-7h |
| 2 | 003, 004 | ✅ Yes | 6-8h |
| 3 | 005 | ❌ Sequential | 3-4h |

## Files Created

- ✅ `{output_dir}/ticket-001-xxx.md`
- ✅ `{output_dir}/ticket-002-xxx.md`
- ...
- ✅ `{output_dir}/README.md` (Index)
- ✅ `{output_dir}/dependencies.mermaid` (Graph)

## Validation Results

✅ All tickets pass AI-Driven Development Workflow validation
✅ All tickets have explicit Out-of-Scope sections
✅ No circular dependencies detected
✅ {N}/{N} tickets are atomic size (2-4h)

## Next Steps

### Option 1: Review First
```bash
# Open the index
open {output_dir}/README.md

# Review individual tickets
open {output_dir}/ticket-001-xxx.md
```

### Option 2: Execute Immediately
```bash
# Semi-automatic mode (confirm each ticket)
/execute-tickets {output_dir}/ --mode semi

# Fully automatic mode
/execute-tickets {output_dir}/ --mode auto
```

### Option 3: Manual Execution
```bash
# Execute specific ticket
/execute-tickets {output_dir}/ --ticket ticket-001

# Execute from specific ticket onward
/execute-tickets {output_dir}/ --start-from ticket-003
```

---

📚 **Reference Documentation**:
- Workflow Standard: `docs/AI-Driven_Development_Workflow.md`
- Implementation Guide: `CLAUDE.md`
- Ticket Template: `.claude/templates/ticket-template.md`
```

## Important Guidelines

### DO:
- ✅ Break large tasks into multiple small tickets
- ✅ Be explicit about Out-of-Scope boundaries
- ✅ Include code examples in Implementation Steps
- ✅ Specify exact test names and verification commands
- ✅ Identify parallel execution opportunities
- ✅ Use realistic time estimates based on complexity

### DON'T:
- ❌ Create tickets larger than 5h without strong justification
- ❌ Leave Out-of-Scope section empty or vague
- ❌ Use generic Acceptance Criteria ("code works", "tests pass")
- ❌ Create circular dependencies
- ❌ Omit test strategy or validation commands
- ❌ Use placeholder text in generated tickets

## Example Usage

### Input Spec (excerpt):
```markdown
# Spec: Invoice Vendor Extraction

## Goal
Extract vendor name from invoice images using Gemini API.

## Requirements
- Parse vendor field from various invoice formats
- Handle missing vendor gracefully
- Normalize vendor names (e.g., "ABC Co." → "ABC Company")
- Support Traditional Chinese vendor names
```

### Expected Output:
- `ticket-001-setup-vendor-parser-structure.md` (2-3h)
- `ticket-002-implement-gemini-api-call.md` (3-4h)
- `ticket-003-add-vendor-normalization.md` (2-3h)
- `ticket-004-handle-missing-vendor.md` (2h)
- `ticket-005-support-chinese-names.md` (2-3h)
- `README.md` (index with dependency graph)
- `dependencies.mermaid` (visual graph)

Total: 5 tickets, 11-15h, 2 parallel waves

---

## Start Generating Tickets

After reading the spec, follow the 6-step process above and generate a complete, validated ticket set ready for execution.

Remember: Quality over speed. Each ticket should be a well-crafted, self-contained unit of work that a developer can pick up and complete with confidence.
