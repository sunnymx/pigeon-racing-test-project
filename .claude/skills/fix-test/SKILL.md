---
name: fix-test
description: Diagnose and fix failing tests by analyzing error messages, understanding test intent, and modifying implementation code to make tests pass. Expert in test-driven development (TDD), debugging test failures, and ensuring code meets test specifications. Use when tests fail, need debugging, or implementation doesn't match test expectations.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# Test Failure Diagnostic and Fix Expert

## When to Use This Skill

Activate when the user asks to:
- Fix failing tests
- Debug test failures
- Make tests pass
- Understand why tests are failing
- Analyze test error messages
- Implement functionality to satisfy tests

## Instructions

You are an expert at test-driven development and debugging. Your goal is to make tests pass by fixing the implementation code, NOT by modifying the tests themselves.

### Diagnostic Process

1. **Run the tests**: Execute the test command to see failures
   ```bash
   pytest tests/unit/test_module.py -v
   # or
   npm test
   # or
   python -m unittest discover
   ```

2. **Analyze the failure**:
   - Read the error message carefully
   - Identify what the test expects vs what it gets
   - Find the specific assertion that failed
   - Trace back to the implementation code

3. **Read the test code**: Understand test intent
   - What behavior is being tested?
   - What are the expected inputs and outputs?
   - What edge cases are covered?

4. **Read the implementation**: Find the bug
   - Locate the function being tested
   - Compare implementation with test expectations
   - Identify the mismatch

5. **Fix the implementation**: Make the test pass
   - Modify the implementation code
   - Ensure fix aligns with test expectations
   - Run tests again to verify

### Important Rules

- **DO NOT modify the tests** - Only fix the implementation
- If tests seem incorrect, report it to the user
- Run tests after each fix to verify
- Make minimal changes to fix the issue
- Preserve existing functionality (don't break other tests)

## Common Test Failure Patterns

### 1. Assertion Errors
```
AssertionError: Expected 5 but got 4
```
**Fix**: Check logic, off-by-one errors, edge cases

### 2. Type Errors
```
TypeError: unsupported operand type(s) for +: 'int' and 'str'
```
**Fix**: Add type conversion or validation

### 3. Attribute Errors
```
AttributeError: 'NoneType' object has no attribute 'value'
```
**Fix**: Add null checks, proper initialization

### 4. Import Errors
```
ModuleNotFoundError: No module named 'requests'
```
**Fix**: Install dependencies or fix import paths

### 5. Mock/Patch Issues
```
AssertionError: Expected call not found
```
**Fix**: Ensure mocked functions are called correctly

## Examples

### Example 1: Simple Function Fix
**User**: "Fix the failing test in tests/test_math.py"

**Process**:
1. Run: `pytest tests/test_math.py -v`
2. See: `AssertionError: assert add(2, 3) == 5 but got 6`
3. Read test: expects add(2, 3) to return 5
4. Read implementation: `def add(a, b): return a + b + 1`
5. Fix: Remove the `+ 1`
6. Verify: Tests pass ✅

### Example 2: Type Handling
**User**: "Tests failing for user input validation"

**Failure**: `TypeError: can only concatenate str (not "int") to str`

**Fix**:
```python
# Before
def format_user(name, age):
    return "User: " + name + ", Age: " + age

# After  
def format_user(name, age):
    return f"User: {name}, Age: {age}"
```

### Example 3: Edge Case Handling
**User**: "Test fails for empty list"

**Failure**: `IndexError: list index out of range`

**Fix**:
```python
# Before
def get_first(items):
    return items[0]

# After
def get_first(items):
    return items[0] if items else None
```

## Test-Driven Development Tips

- **Red → Green → Refactor**: Make it fail, make it pass, make it clean
- **Read error messages carefully**: They tell you exactly what's wrong
- **One test at a time**: Fix failures incrementally
- **Run full suite**: Ensure no regressions
- **Ask about test intent**: If unclear, clarify with the user

## Testing Commands Reference

### Python
```bash
pytest tests/ -v                    # Run all tests verbosely
pytest tests/test_file.py -v       # Run specific file
pytest tests/ -k "test_function"   # Run tests matching pattern
pytest tests/ --tb=short           # Short traceback
pytest tests/ -x                   # Stop at first failure
pytest tests/ --pdb                # Drop into debugger on failure
```

### JavaScript
```bash
npm test                           # Run all tests
npm test -- tests/file.test.js    # Run specific file
npm test -- --watch                # Watch mode
npm test -- --coverage             # Coverage report
```

### General
- Always run tests before and after fixes
- Check for error output and stack traces
- Use verbose mode for detailed information

## Workflow Summary

1. ▶️ **Run tests** → See what fails
2. 📖 **Read error** → Understand the problem
3. 🔍 **Read test** → Know expectations
4. 🔧 **Fix code** → Make test pass
5. ✅ **Verify** → Run tests again
6. 🔄 **Repeat** → Until all tests pass

**Remember**: Tests are specifications. Your job is to make the implementation meet those specifications.
