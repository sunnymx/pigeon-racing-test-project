# Failure Report: Ticket-{ID}

**Date**: {YYYY-MM-DD HH:MM:SS}
**Ticket**: ticket-{ID}-{slug}.md
**Status**: 🔴 Failed after {N} attempts
**Phase**: {RED/GREEN/VERIFY}

---

## Summary

{One-line description of what failed and why}

---

## Attempts Log

### Attempt 1
**Time**: {HH:MM:SS}
**Phase**: {RED/GREEN/VERIFY}
**Result**: ❌ Failed

**Error**:
```
{error_message}
```

**Stacktrace**:
```
{stacktrace}
```

**Action Taken**: {What was tried to fix the issue}

---

### Attempt 2
**Time**: {HH:MM:SS}
**Phase**: {RED/GREEN/VERIFY}
**Result**: ❌ Failed

**Error**:
```
{error_message}
```

**Stacktrace**:
```
{stacktrace}
```

**Action Taken**: {What was tried to fix the issue}

---

### Attempt 3
**Time**: {HH:MM:SS}
**Phase**: {RED/GREEN/VERIFY}
**Result**: ❌ Failed

**Error**:
```
{error_message}
```

**Stacktrace**:
```
{stacktrace}
```

**Action Taken**: {What was tried to fix the issue}

**Final Status**: 🔴 Max attempts reached (3/3). Stopping execution.

---

## Root Cause Analysis

### Primary Cause

{Detailed analysis of the root cause}

### Contributing Factors

1. **{Factor 1}**: {Description}
2. **{Factor 2}**: {Description}
3. **{Factor 3}**: {Description}

### Why This Happened

{Explanation of why the issue occurred and wasn't caught earlier}

---

## Suggested Fixes

### Option 1: {Fix approach 1} (Recommended)

**Approach**: {High-level description}

**Steps**:
1. {Step 1}
2. {Step 2}
3. {Step 3}

**Code Example**:
```python
# Example fix
{code}
```

**Pros**:
- {Pro 1}
- {Pro 2}

**Cons**:
- {Con 1}

**Estimated Time**: {X}h

---

### Option 2: {Fix approach 2}

**Approach**: {High-level description}

**Steps**:
1. {Step 1}
2. {Step 2}

**Code Example**:
```python
# Alternative fix
{code}
```

**Pros**:
- {Pro 1}

**Cons**:
- {Con 1}
- {Con 2}

**Estimated Time**: {X}h

---

### Option 3: {Fix approach 3} (Workaround)

**Approach**: {High-level description}

**Steps**:
1. {Step 1}
2. {Step 2}

**Note**: This is a workaround, not a proper fix. Consider Options 1 or 2 for production.

---

## Impact Assessment

### Blocked Tickets

The following tickets are blocked by this failure:

| Ticket | Title | Dependency | Impact |
|--------|-------|------------|--------|
| {ID} | {Title} | Depends on ticket-{ID} | 🔴 Cannot proceed |
| {ID} | {Title} | Indirectly depends | ⚠️ May be delayed |

### Affected Components

- **{Component 1}**: {How it's affected}
- **{Component 2}**: {How it's affected}

### Workarounds (if available)

1. **Workaround 1**: {Description}
   - Limitation: {What doesn't work}
   - Use case: {When to use this}

2. **Workaround 2**: {Description}
   - Limitation: {What doesn't work}
   - Use case: {When to use this}

---

## Test Context

### Test Results

**Before Failure**:
- Tests passing: {X}/{Y}
- Coverage: {XX}%
- Last green commit: {commit_hash}

**At Failure**:
- Tests passing: {X}/{Y}
- Failing tests:
  - `test_{name}`: {reason}
  - `test_{name}`: {reason}

### Environment

- Python version: {version}
- OS: {os_name}
- Key dependencies:
  - {package}: {version}
  - {package}: {version}

---

## Next Steps

### Immediate Actions

1. **Review this failure report** thoroughly
2. **Choose a fix approach** (Option 1 recommended)
3. **Apply the fix** manually or with assistance
4. **Re-run tests** to verify fix
5. **Re-execute ticket**:
   ```
   Ask Claude: "Execute ticket-{ID} from docs/tickets/{feature-name}/"
   ```

### If Fix Doesn't Work

1. **Document additional attempts** in this file
2. **Escalate** if stuck after 2 more attempts
3. **Consider alternative approach** (Option 2 or 3)
4. **Update ticket** to reflect new strategy

### Resume Execution

After fixing ticket-{ID}:
```
Ask Claude: "Resume tickets from ticket-{ID} in docs/tickets/{feature-name}/"
```

---

## Prevention

### How to Prevent This in the Future

1. **{Prevention measure 1}**: {Description}
2. **{Prevention measure 2}**: {Description}
3. **{Prevention measure 3}**: {Description}

### Tests to Add

- `test_{scenario}`: {What to test}
- `test_{edge_case}`: {What to test}

---

## References

- Original ticket: `docs/tickets/{feature-name}/ticket-{ID}-{slug}.md`
- Related issues: {issue_links}
- Documentation: {doc_links}

---

**Status**: 🔴 Awaiting fix
**Last Updated**: {YYYY-MM-DD HH:MM:SS}
