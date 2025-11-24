# Ticket-{ID}: {Title}

**depends_on**: {dependencies or "none"}
**estimated_time**: {X-Yh}
**priority**: {P0/P1/P2/P3}
**status**: 🟡 Pending

---

## Summary

{What to achieve - 1-2 sentences}

---

## Why (Background)

{Business justification and context}

{Why is this ticket necessary? What problem does it solve?}

---

## Scope (In-Scope)

{What THIS ticket includes - be specific}

- {Feature/component 1 to be implemented}
- {Feature/component 2 to be implemented}
- {Specific behavior or logic}

---

## Out-of-Scope

{What THIS ticket does NOT include - CRITICAL for preventing scope creep}

- {Not implementing X (handled in Ticket-XXX)}
- {Not adding Y (handled in Ticket-YYY)}
- {Not refactoring Z (handled in Ticket-ZZZ)}

---

## Acceptance Criteria

{Testable outcomes - be specific and measurable}

- [ ] **AC1**: {specific, measurable condition}
  - Example: "Function `parse_invoice()` returns dict with keys: vendor, amount, date"

- [ ] **AC2**: {specific, measurable condition}
  - Example: "Handles edge case: missing vendor name returns None"

- [ ] **AC3**: {specific, measurable condition}
  - Example: "Test coverage ≥ 90% for new code"

---

## Implementation Steps

{Concrete actions - include code examples where helpful}

### Step 1: {Action description}

{Details about what to do}

```python
# Example code structure
def example_function():
    """What this function should do."""
    pass
```

### Step 2: {Action description}

{Details about what to do}

### Step 3: {Action description}

{Details about what to do}

---

## Test/Validation

### Unit Tests (to be created)

Create tests in `{test_file_path}`:

- `test_should_{behavior}_when_{condition}` - {test description}
- `test_should_handle_{edge_case}` - {test description}
- `test_should_raise_{exception}_when_{invalid_input}` - {test description}

### Verification Commands

```bash
# Run tests for this ticket
pytest {test_file_path} -v

# Check coverage
pytest --cov={module_path} --cov-report=term-missing

# Run full test suite
pytest -v

# Type checking
mypy {source_file_path}

# Style checking
flake8 {source_file_path}
```

### Expected Test Results

- Unit tests: {X} tests, all passing
- Coverage: ≥ 90% for new code
- No type errors
- No style violations

---

## Files to Modify/Add

### Files to Create

- `{source_file_path}` - {description of what this file does}
- `{test_file_path}` - {description of tests}

### Files to Modify

- `{existing_file_path}` (line {X}): {description of change}
- `{existing_file_path_2}`: {description of change}

### Files to Update (Documentation)

- `{doc_file_path}` - {what to update}

---

## Definition of Done

The ticket is considered complete when ALL of the following are true:

- [ ] All Acceptance Criteria met
- [ ] All tests passing (100%)
- [ ] Code coverage ≥ 90% for new code
- [ ] Type hints present on all functions
- [ ] PEP 8 compliant (flake8 passes)
- [ ] Docstrings added (all public functions/classes)
- [ ] No unnecessary complexity (keep it simple)
- [ ] Code reviewed (if applicable)
- [ ] Committed with message: `{commit_type}: {summary} (ticket-{ID})`
  - commit_type: feat / fix / refactor / test / docs

---

## Execution Log

**Status**: 🟡 Pending / 🔵 In Progress / ✅ Complete / 🔴 Blocked

**Started**: {timestamp}
**Completed**: {timestamp}
**Actual Time**: {X.Xh}

### Test Results

- Unit tests: {X}/{X} passing
- Coverage: {XX}%
- Type checks: {pass/fail}
- Style checks: {pass/fail}

### Attempts Log

- Attempt 1: {result} - {notes}
- Attempt 2: {result} - {notes}
- Attempt 3: {result} - {notes}

### Commit Information

- **Commit Hash**: {commit_hash}
- **Commit Message**: {commit_message}
- **Files Changed**: {X} files (+{lines_added}, -{lines_removed})

### Notes

{Any notes, learnings, or issues encountered during implementation}

---

## References

- Related Tickets: {Ticket-XXX}, {Ticket-YYY}
- Spec Document: {path_to_spec}
- API Documentation: {link_if_applicable}
- Related PRs: {PR_number_if_applicable}
