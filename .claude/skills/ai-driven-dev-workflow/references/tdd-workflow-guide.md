# TDD Workflow Guide (RED → GREEN → VERIFY)

Complete guide for Test-Driven Development workflow following CLAUDE.md standards.

---

## Philosophy

**"Tests first, always"** - TDD is non-negotiable. Writing tests before implementation ensures:
- Clear requirements understanding
- Testable, modular code
- Built-in regression prevention
- Living documentation
- Confidence in refactoring

---

## The 3 Core Phases

### Phase 1: RED - Write Failing Tests

**Goal**: Define expected behavior through tests that MUST fail initially.

#### Steps

1. **Read Acceptance Criteria**
   - Extract testable conditions
   - Identify edge cases
   - Plan test scenarios

2. **Write Test Cases**
   ```python
   def test_should_{behavior}_when_{condition}():
       """Clear docstring explaining what's being tested."""
       # Arrange: Set up test data
       input_data = {...}

       # Act: Execute the function
       result = function_under_test(input_data)

       # Assert: Verify expected outcome
       assert result == expected_value
   ```

3. **Run Tests - Confirm RED**
   ```bash
   pytest path/to/test_file.py -v
   ```

   **Expected output**: ❌ FAILED

   **Valid failure reasons**:
   - `ModuleNotFoundError`: Function/module doesn't exist (good!)
   - `AttributeError`: Expected attribute missing (good!)
   - `AssertionError`: Logic exists but wrong (good!)

   **Invalid failure reasons**:
   - `SyntaxError`: Test has bugs (fix the test!)
   - `ImportError`: Missing dependencies (install them!)
   - Tests pass immediately (not testing anything new!)

4. **Validate Test Quality**
   - [ ] Test name follows convention: `test_should_{behavior}_when_{condition}`
   - [ ] Test has clear docstring
   - [ ] Test uses Arrange-Act-Assert pattern
   - [ ] Test fails for the RIGHT reason (missing implementation, not bugs)
   - [ ] Test covers ONE specific scenario
   - [ ] Test is independent (no shared state)

#### Common Pitfalls

❌ **DON'T**:
```python
def test_function():  # Vague name
    result = some_function()
    assert result  # What are we testing?
```

✅ **DO**:
```python
def test_should_return_empty_list_when_input_is_none():
    """Test that some_function handles None input gracefully."""
    result = some_function(None)
    assert result == []
```

---

### Phase 2: GREEN - Write Minimal Implementation

**Goal**: Write just enough code to make tests pass. No more, no less.

#### Steps

1. **Implement Minimal Solution**
   ```python
   def function_under_test(input_data):
       """
       Brief description of what this function does.

       Args:
           input_data: Description of input

       Returns:
           Description of return value
       """
       # Minimal implementation
       if input_data is None:
           return []
       # Add more logic as needed
   ```

2. **Run Tests - Confirm GREEN**
   ```bash
   pytest path/to/test_file.py -v
   ```

   **Expected output**: ✅ PASSED (all tests)

3. **Apply Max 3 Attempts Rule**

   If tests fail:

   **Attempt 1**:
   - Analyze failure reason
   - Review test expectations
   - Fix implementation
   - Re-run tests

   **Attempt 2** (if Attempt 1 failed):
   - Deeper analysis of root cause
   - Check for edge cases
   - Verify test logic is correct
   - Fix and re-run

   **Attempt 3** (if Attempt 2 failed):
   - Critical analysis: Is the approach wrong?
   - Consider alternative implementation
   - Last chance to make it work
   - Fix and re-run

   **After 3 attempts**:
   - If still failing → STOP
   - Mark ticket as 🔴 Blocked
   - Generate failure report
   - DON'T continue to next phase

4. **Refactor (if needed)**
   - Clean up code while keeping tests green
   - Remove duplication
   - Improve readability
   - Run tests after each refactor

#### Principles

1. **YAGNI** (You Aren't Gonna Need It)
   - Don't add features not in requirements
   - Don't optimize prematurely
   - Keep it simple

2. **Minimal Code**
   - Write least code to pass tests
   - Add complexity only when tests demand it

3. **Keep Tests Green**
   - Run tests after every change
   - If tests fail, fix immediately
   - Never move forward with failing tests

---

### Phase 3: VERIFY - Full Validation

**Goal**: Ensure all quality standards are met (CLAUDE.md Completion Checklist).

#### Quality Gates

##### 1. Full Test Suite
```bash
pytest -v
```
**Requirement**: 100% of tests passing

**What to check**:
- All new tests pass
- All existing tests still pass
- No tests skipped or marked as xfail

---

##### 2. Code Coverage
```bash
pytest --cov=module_name --cov-report=term-missing
```
**Requirement**: ≥90% coverage for new code

**What to check**:
- Line coverage ≥90%
- Branch coverage (if applicable)
- No untested critical paths
- Missing lines are documented as "why untested"

**Acceptable exceptions** (must document):
- Defensive error handling
- Platform-specific code
- Deprecated code paths

---

##### 3. Type Hints
```bash
mypy source_file.py
```
**Requirement**: No type errors

**What to check**:
- All function signatures have type hints
- Return types specified
- Complex types properly annotated
- No `Any` without justification

**Example**:
```python
def parse_invoice(file_path: str) -> dict[str, Any]:
    """Type hints on all parameters and return."""
    ...
```

---

##### 4. PEP 8 Compliance
```bash
flake8 source_file.py
```
**Requirement**: Zero violations

**What to check**:
- Line length ≤79 characters (or project standard)
- Proper indentation (4 spaces)
- Two blank lines between classes
- Naming conventions (snake_case, PascalCase)

**Auto-fix** (when possible):
```bash
black source_file.py  # Auto-format
isort source_file.py  # Sort imports
```

---

##### 5. Docstrings
**Requirement**: All public functions/classes have docstrings

**What to check**:
- Module-level docstring
- All public functions have docstrings
- Docstrings follow Google or NumPy style
- Parameters and returns documented

**Example** (Google style):
```python
def normalize_string(text: str) -> str:
    """
    Normalize a string by converting to lowercase and removing extra spaces.

    Args:
        text: The input string to normalize

    Returns:
        The normalized string with lowercase and single spaces

    Examples:
        >>> normalize_string("  HELLO  World  ")
        'hello world'
    """
    ...
```

---

##### 6. Complexity Check
**Requirement**: Functions ~20 lines max, no unnecessary complexity

**What to check**:
- Function length reasonable (<20 lines ideal)
- Cyclomatic complexity low (≤10)
- No deep nesting (≤3 levels)
- Clear, readable code

**Tools**:
```bash
radon cc source_file.py  # Cyclomatic complexity
radon mi source_file.py  # Maintainability index
```

---

#### Verification Checklist

- [ ] All tests passing (100%)
- [ ] Coverage ≥90%
- [ ] Type hints present
- [ ] PEP 8 compliant
- [ ] Docstrings complete
- [ ] Complexity acceptable
- [ ] No security issues
- [ ] No hardcoded secrets

**If ANY check fails**:
1. Increment attempt counter
2. Fix the issues
3. Return to GREEN phase
4. Re-run all verifications
5. Apply Max 3 Attempts Rule

---

## Complete TDD Cycle Example

### Scenario: Implement `extract_amount()` function

#### RED Phase

**Write failing test**:
```python
# tests/test_string_utils.py
def test_should_extract_amount_when_dollar_sign_present():
    """Test that extract_amount extracts numeric value from $100."""
    result = extract_amount("$100")
    assert result == 100.0

def test_should_return_none_when_no_amount_present():
    """Test that extract_amount returns None for invalid input."""
    result = extract_amount("No amount here")
    assert result is None
```

**Run tests**:
```bash
$ pytest tests/test_string_utils.py -v
...
ModuleNotFoundError: No module named 'string_utils'
```

✅ Tests are RED (as expected) - Ready for GREEN phase

---

#### GREEN Phase

**Write minimal implementation**:
```python
# src/utils/string_utils.py
import re
from typing import Optional

def extract_amount(text: str) -> Optional[float]:
    """
    Extract numeric amount from text string.

    Args:
        text: Text potentially containing a numeric amount

    Returns:
        The extracted amount as float, or None if not found
    """
    # Remove currency symbols and commas
    cleaned = re.sub(r'[$,]', '', text)

    # Try to extract number
    match = re.search(r'\d+\.?\d*', cleaned)
    if match:
        return float(match.group())
    return None
```

**Run tests**:
```bash
$ pytest tests/test_string_utils.py -v
...
test_should_extract_amount_when_dollar_sign_present PASSED
test_should_return_none_when_no_amount_present PASSED

2 passed in 0.05s
```

✅ Tests are GREEN (attempt 1/3) - Ready for VERIFY phase

---

#### VERIFY Phase

**1. Full test suite**:
```bash
$ pytest -v
...
125 passed in 3.45s
```
✅ All tests passing

**2. Coverage**:
```bash
$ pytest --cov=src/utils/string_utils --cov-report=term-missing
...
src/utils/string_utils.py    92%    5-7
```
✅ Coverage ≥90%

**3. Type hints**:
```bash
$ mypy src/utils/string_utils.py
Success: no issues found
```
✅ No type errors

**4. PEP 8**:
```bash
$ flake8 src/utils/string_utils.py
(no output)
```
✅ No violations

**5. Docstrings**:
Manual check - ✅ Function has complete docstring

**6. Complexity**:
Function is 10 lines - ✅ Within guidelines

---

## Recovery from Failures

### When RED Phase Fails

**Problem**: Tests pass immediately (not testing new functionality)

**Solution**:
1. Analyze what the test is actually testing
2. Ensure test requires non-existent code
3. Strengthen test assertions
4. Verify test is importing correct module

---

### When GREEN Phase Fails (After 3 Attempts)

**Problem**: Cannot make tests pass after 3 tries

**Solution**:
1. STOP - Don't continue
2. Generate failure report (use template)
3. Analyze root causes:
   - Wrong approach?
   - Incomplete understanding?
   - Missing dependencies?
   - Tests too strict?
4. Document all 3 attempts with errors
5. Suggest fixes (multiple options)
6. Mark ticket as 🔴 Blocked

---

### When VERIFY Phase Fails

**Problem**: Quality gates not met

**Common issues**:

**Coverage <90%**:
- Add tests for untested branches
- Remove dead code
- Document why code can't be tested

**Type errors**:
- Add missing type hints
- Fix incorrect types
- Use proper generic types

**PEP 8 violations**:
- Run auto-formatters (black, isort)
- Fix naming issues
- Split long lines

**Missing docstrings**:
- Add docstrings to all public functions
- Follow Google or NumPy style
- Include examples where helpful

---

## Best Practices

### Test Organization

```
tests/
├── unit/                    # Unit tests (mocked dependencies)
│   ├── test_string_utils.py
│   └── test_parser.py
├── integration/             # Integration tests (real dependencies)
│   └── test_invoice_parser_integration.py
└── conftest.py             # Shared fixtures
```

### Test Fixtures

```python
# conftest.py
import pytest

@pytest.fixture
def sample_invoice():
    """Provide sample invoice data for tests."""
    return {
        "vendor": "ABC Company",
        "amount": 1234.56,
        "date": "2025-01-15"
    }

# test_parser.py
def test_should_parse_invoice_when_valid(sample_invoice):
    """Test using shared fixture."""
    result = parse_invoice(sample_invoice)
    assert result["vendor"] == "ABC Company"
```

### Test Naming

✅ **Good**:
- `test_should_return_empty_list_when_input_is_none`
- `test_should_raise_value_error_when_amount_negative`
- `test_should_normalize_vendor_name_when_suffix_present`

❌ **Bad**:
- `test_function` (too vague)
- `test_1` (meaningless)
- `test_edge_case` (which edge case?)

---

## TDD Anti-Patterns

### 1. Writing Implementation First
❌ **Wrong**:
```
Write code → Write tests → Run tests
```

✅ **Correct**:
```
Write tests → Run tests (RED) → Write code → Run tests (GREEN)
```

### 2. Testing Implementation Details
❌ **Wrong**:
```python
def test_uses_specific_algorithm():
    """Test that function uses binary search."""
    # Testing HOW it works, not WHAT it does
```

✅ **Correct**:
```python
def test_should_find_item_in_sorted_list():
    """Test that function finds item correctly."""
    # Testing behavior, not implementation
```

### 3. Over-Mocking
❌ **Wrong**:
```python
def test_with_too_many_mocks():
    with mock.patch('module.func1'):
        with mock.patch('module.func2'):
            with mock.patch('module.func3'):
                # Too many mocks = testing mocks, not code
```

✅ **Correct**:
```python
def test_with_minimal_mocking():
    with mock.patch('module.external_api_call'):
        # Only mock external dependencies
        result = function_under_test()
```

---

## References

- Kent Beck's "Test Driven Development: By Example"
- CLAUDE.md Completion Checklist
- pytest documentation: https://docs.pytest.org/
- Python Testing Best Practices

---

**Remember**: TDD is not about testing, it's about DESIGN. Tests guide you to write better code.
