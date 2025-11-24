# Ticket Quality Checklist

Comprehensive checklist for validating tickets against AI-Driven Development Workflow standards.

---

## Quick Validation

Use this quick checklist for rapid ticket review:

- [ ] Has `depends_on:` field
- [ ] Has Summary section
- [ ] Has Why section
- [ ] Has Scope section
- [ ] Has **Out-of-Scope section** (CRITICAL)
- [ ] Has Acceptance Criteria (3-5 items)
- [ ] Has Implementation Steps
- [ ] Has Test/Validation section
- [ ] Has Files to Modify/Add
- [ ] Has Definition of Done
- [ ] Estimated time is 2-4h (or justified)
- [ ] No circular dependencies

---

## Detailed Validation

### 1. Metadata

#### Required Fields

- [ ] **Ticket ID**: Format `ticket-NNN-slug.md` (NNN = zero-padded number)
- [ ] **depends_on**: Present (can be "none" for independent tickets)
- [ ] **estimated_time**: Present, format "{X-Yh}"
- [ ] **priority**: Present, one of P0/P1/P2/P3/P4
- [ ] **status**: Present, one of 🟡/🔵/✅/🔴

#### Metadata Quality

- [ ] Ticket ID is unique within the ticket set
- [ ] Dependencies reference valid ticket IDs
- [ ] Estimated time is realistic (2-4h ideal, 1-6h acceptable)
- [ ] Priority reflects actual importance (P0 = blocking, P3/P4 = nice-to-have)
- [ ] Status reflects current state

---

### 2. Summary Section

#### Required Content

- [ ] Summary section exists
- [ ] Summary is 1-2 sentences
- [ ] Summary clearly states WHAT to achieve

#### Quality Checks

- [ ] Summary is specific (not vague like "Improve X")
- [ ] Summary uses action verbs (Implement, Refactor, Fix, Add)
- [ ] Summary is understandable without context

**Examples**:

✅ Good:
> Implement `normalize_string()` function that converts text to lowercase and removes extra spaces.

❌ Bad:
> Add normalization.

---

### 3. Why (Background) Section

#### Required Content

- [ ] Why section exists
- [ ] Explains business justification
- [ ] Explains why this ticket is necessary

#### Quality Checks

- [ ] Provides context (what problem does this solve?)
- [ ] Links to larger goals or requirements
- [ ] Justifies the effort/priority

**Example**:

✅ Good:
> The invoice parser currently has scattered string manipulation code across multiple files. Centralizing normalization logic will improve code reuse, ensure consistent behavior, and simplify testing.

❌ Bad:
> We need this feature.

---

### 4. Scope (In-Scope) Section

#### Required Content

- [ ] Scope section exists
- [ ] Lists what THIS ticket includes
- [ ] Uses bullet points for clarity

#### Quality Checks

- [ ] Scope is specific and concrete
- [ ] Scope is focused on one logical unit
- [ ] Scope is achievable in estimated time
- [ ] Scope items are measurable

**Example**:

✅ Good:
> - Implement `normalize_string()` function in `src/utils/string_utils.py`
> - Handle lowercase conversion
> - Handle whitespace normalization (leading, trailing, multiple spaces)
> - Add type hints and docstrings

❌ Bad:
> - Add string utilities
> - Make things better

---

### 5. Out-of-Scope Section (CRITICAL)

#### Required Content

- [ ] **Out-of-Scope section exists** (CRITICAL - blocking if missing)
- [ ] Lists what THIS ticket does NOT include
- [ ] References other tickets for excluded work

#### Quality Checks

- [ ] Explicitly states boundaries
- [ ] Prevents scope creep
- [ ] References related tickets for excluded work
- [ ] Clarifies common misunderstandings

**Example**:

✅ Good:
> - Not implementing vendor name cleaning (handled in ticket-003)
> - Not adding date parsing (separate module)
> - Not optimizing performance (YAGNI)
> - Not supporting localization beyond Traditional Chinese

❌ Bad:
> - Other stuff not included

❌ Worst:
> (section missing entirely)

---

### 6. Acceptance Criteria

#### Required Content

- [ ] Acceptance Criteria section exists
- [ ] Has 3-5 criteria (not too few, not too many)
- [ ] Each criterion is testable

#### Quality Checks

- [ ] Criteria are specific and measurable
- [ ] Criteria use "should" or "must" language
- [ ] Criteria can be verified objectively
- [ ] Criteria cover success AND failure cases
- [ ] Criteria include edge cases where relevant

**Example**:

✅ Good:
> - [ ] **AC1**: `normalize_string("  HELLO  ")` returns `"hello"`
> - [ ] **AC2**: `normalize_string("A   B   C")` returns `"a b c"` (multiple spaces → single space)
> - [ ] **AC3**: `normalize_string("")` returns `""` (handles empty string)
> - [ ] **AC4**: Test coverage ≥90% for new code

❌ Bad:
> - [ ] Function works
> - [ ] Tests pass
> - [ ] Code is good

---

### 7. Implementation Steps

#### Required Content

- [ ] Implementation Steps section exists
- [ ] Steps are numbered and ordered
- [ ] Steps are concrete (not vague)

#### Quality Checks

- [ ] Steps provide clear guidance
- [ ] Steps include code examples where helpful
- [ ] Steps follow logical order
- [ ] Steps reference specific files/functions
- [ ] Steps are detailed enough for implementation

**Example**:

✅ Good:
> ### Step 1: Create string_utils.py module
>
> Create `src/utils/string_utils.py` with basic structure:
>
> ```python
> """String utility functions for invoice parsing."""
>
> def normalize_string(text: str) -> str:
>     """Normalize string by converting to lowercase and removing extra spaces."""
>     pass
> ```
>
> ### Step 2: Implement normalization logic
>
> - Convert to lowercase using `.lower()`
> - Strip leading/trailing whitespace using `.strip()`
> - Collapse multiple spaces using regex or `.split()` + `.join()`

❌ Bad:
> 1. Write the code
> 2. Make it work
> 3. Test it

---

### 8. Test/Validation Section

#### Required Content

- [ ] Test/Validation section exists
- [ ] Lists specific test names
- [ ] Includes verification commands

#### Quality Checks

- [ ] Test names follow convention: `test_should_{behavior}_when_{condition}`
- [ ] Tests cover all Acceptance Criteria
- [ ] Tests include edge cases
- [ ] Verification commands are executable
- [ ] Expected results are specified

**Example**:

✅ Good:
> ### Unit Tests (to be created)
>
> Create tests in `tests/test_string_utils.py`:
>
> - `test_should_normalize_to_lowercase_when_uppercase_input`
> - `test_should_remove_extra_spaces_when_multiple_spaces_present`
> - `test_should_handle_empty_string`
> - `test_should_preserve_single_spaces_between_words`
>
> ### Verification Commands
>
> ```bash
> # Run tests
> pytest tests/test_string_utils.py -v
>
> # Check coverage
> pytest --cov=src/utils/string_utils --cov-report=term-missing
>
> # Should show ≥90% coverage
> ```
>
> ### Expected Test Results
>
> - Unit tests: 4 tests, all passing
> - Coverage: ≥90%

❌ Bad:
> Write some tests and run them.

---

### 9. Files to Modify/Add

#### Required Content

- [ ] Files section exists
- [ ] Lists files to create
- [ ] Lists files to modify

#### Quality Checks

- [ ] All file paths are specific (not vague)
- [ ] Paths are absolute or relative to project root
- [ ] Modification descriptions are clear
- [ ] No files listed that aren't relevant to this ticket

**Example**:

✅ Good:
> ### Files to Create
>
> - `src/utils/string_utils.py` - String utility functions module
> - `tests/test_string_utils.py` - Unit tests for string utilities
>
> ### Files to Modify
>
> - `src/utils/__init__.py` (line 5): Add `from .string_utils import normalize_string`
> - `docs/API.md`: Document new `normalize_string()` function

❌ Bad:
> - Some files in the utils folder
> - Update the docs

---

### 10. Definition of Done

#### Required Content

- [ ] Definition of Done section exists
- [ ] Includes standard checklist items
- [ ] Includes ticket-specific requirements

#### Quality Checks

- [ ] All standard items present:
  - [ ] All Acceptance Criteria met
  - [ ] All tests passing
  - [ ] Coverage ≥90%
  - [ ] Type hints present
  - [ ] PEP 8 compliant
  - [ ] Docstrings added
  - [ ] No unnecessary complexity
  - [ ] Committed with clear message

**Example**:

✅ Good:
> - [ ] All Acceptance Criteria met
> - [ ] All tests passing (100%)
> - [ ] Code coverage ≥ 90%
> - [ ] Type hints on all functions
> - [ ] PEP 8 compliant
> - [ ] Docstrings complete (Google style)
> - [ ] No unnecessary complexity
> - [ ] Committed: `feat: implement string normalization (ticket-002)`

---

## Size and Complexity Validation

### Time Estimate

- [ ] Estimated time is 2-4h (ideal)
- [ ] If >4h, justification provided
- [ ] If >6h, ticket should be split

**Guidelines**:
- **<1h**: Too small, consider merging
- **1-2h**: Small, good for simple tasks
- **2-4h**: Ideal size (sweet spot)
- **4-6h**: Acceptable for complex tasks, needs justification
- **>6h**: Too large, must split

---

### Complexity Check

- [ ] Scope is focused on ONE logical unit
- [ ] Acceptance Criteria are ≤5 items
- [ ] Implementation Steps are ≤8 steps
- [ ] Test count is reasonable (≤10 tests)

**Red flags**:
- Multiple distinct features in one ticket
- Dependencies on >3 other tickets
- Touches >10 files
- Requires multiple services/components

---

## Dependency Validation

### Dependency Structure

- [ ] `depends_on:` field is present
- [ ] All dependencies reference valid ticket IDs
- [ ] No circular dependencies detected
- [ ] Dependency rationale is clear

### Dependency Check Algorithm

```python
def check_circular_dependencies(tickets):
    """Check for circular dependencies in ticket set."""
    visited = set()
    recursion_stack = set()

    def has_cycle(ticket_id):
        if ticket_id in recursion_stack:
            return True  # Circular dependency found!
        if ticket_id in visited:
            return False

        visited.add(ticket_id)
        recursion_stack.add(ticket_id)

        for dep in tickets[ticket_id].dependencies:
            if has_cycle(dep):
                return True

        recursion_stack.remove(ticket_id)
        return False

    for ticket_id in tickets:
        if has_cycle(ticket_id):
            return f"Circular dependency detected involving {ticket_id}"

    return "No circular dependencies"
```

---

## Language and Style

### Writing Quality

- [ ] Clear, concise language
- [ ] No ambiguous terms
- [ ] Consistent terminology
- [ ] Proper grammar and spelling

### Technical Accuracy

- [ ] Code examples are syntactically correct
- [ ] File paths are accurate
- [ ] Commands are executable
- [ ] Technical terms used correctly

### Formatting

- [ ] Proper Markdown formatting
- [ ] Code blocks use correct language tags
- [ ] Lists are properly formatted
- [ ] Headers use appropriate levels (H1, H2, H3)

---

## Scoring Rubric

### Excellent (9-10/10)

- All required sections present and complete
- Out-of-Scope section is detailed and specific
- Acceptance Criteria are measurable and comprehensive
- Implementation Steps include code examples
- Test strategy is thorough with specific test names
- Estimated time is realistic (2-4h)
- No circular dependencies
- Clear, professional writing

### Good (7-8/10)

- All required sections present
- Out-of-Scope section exists
- Acceptance Criteria are testable
- Implementation Steps are concrete
- Test strategy is clear
- Estimated time is reasonable
- Minor improvements possible

### Acceptable (5-6/10)

- Most sections present
- Out-of-Scope section may be brief
- Some Acceptance Criteria may be vague
- Implementation Steps need more detail
- Test strategy exists but could be better
- Estimated time may be optimistic
- Needs revision before execution

### Needs Improvement (<5/10)

- Missing critical sections (especially Out-of-Scope)
- Vague Acceptance Criteria
- Implementation Steps are not actionable
- Weak or missing test strategy
- Unrealistic time estimate
- Must be revised before execution

---

## Automated Validation Script

Use `scripts/validate_ticket.py` to automate this checklist:

```bash
python scripts/validate_ticket.py docs/tickets/feature-name/ticket-001-xxx.md
```

**Output**:
```
✅ Validation Results for ticket-001-xxx.md

Structure: 12/12 ✅
  ✅ Has depends_on field
  ✅ Has Summary section
  ✅ Has Why section
  ✅ Has Scope section
  ✅ Has Out-of-Scope section
  ✅ Has Acceptance Criteria
  ✅ Has Implementation Steps
  ✅ Has Test/Validation
  ✅ Has Files section
  ✅ Has Definition of Done
  ✅ Estimated time present
  ✅ No circular dependencies

Quality: 8/10 ✅
  ✅ Time estimate realistic (2-3h)
  ✅ AC are testable (4 criteria)
  ✅ Implementation steps detailed (5 steps)
  ⚠️  Test count high (12 tests) - consider splitting

Overall Score: 9/10 - Excellent

Ready for execution: ✅ YES
```

---

## Common Issues and Fixes

### Issue: Missing Out-of-Scope

**Problem**: Out-of-Scope section is missing or empty

**Fix**:
```markdown
## Out-of-Scope

- Not implementing vendor name cleaning (handled in ticket-003)
- Not adding performance optimization (YAGNI)
- Not supporting internationalization beyond Traditional Chinese
```

---

### Issue: Vague Acceptance Criteria

**Problem**:
```markdown
- [ ] AC1: Function works correctly
```

**Fix**:
```markdown
- [ ] AC1: `normalize_string("  HELLO  ")` returns `"hello"` (specific input/output)
```

---

### Issue: Generic Implementation Steps

**Problem**:
```markdown
1. Write the code
2. Test it
```

**Fix**:
```markdown
### Step 1: Create module structure

Create `src/utils/string_utils.py`:

\`\`\`python
def normalize_string(text: str) -> str:
    """Normalize string."""
    pass
\`\`\`

### Step 2: Implement lowercase conversion

Use `.lower()` method to convert text to lowercase.

### Step 3: Implement whitespace normalization

Use `.strip()` and regex to remove extra spaces.
```

---

## References

- AI-Driven Development Workflow standard
- Ticket template: `assets/ticket-template.md`
- Validation script: `scripts/validate_ticket.py`

---

**Remember**: A well-written ticket is half the work done. Invest time in ticket quality to save time in execution.
