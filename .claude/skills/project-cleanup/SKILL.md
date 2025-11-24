---
name: project-cleanup
description: "Organizes test scripts, updates documentation, and performs project cleanup tasks after feature implementation or bug fixes. Use when completing work sessions or after resolving issues."
---

# Project Cleanup Skill

This skill automates post-development cleanup tasks to maintain code quality and documentation consistency.

## When to Use

Invoke this skill when:
- Completing a feature implementation
- After fixing bugs or issues
- Finishing a development session
- Needing to organize test files
- Updating documentation after changes

## What This Skill Does

### 1. Test Script Organization
- Moves test scripts from project root to `tests/` directory
- Creates appropriate subdirectories (`tests/ui/`, `tests/integration/`, etc.)
- Updates or creates `tests/README.md` with comprehensive testing guide
- Preserves any existing test fixtures

### 2. Documentation Updates
- Updates `docs/README.md` with:
  - Known issues and their fixes
  - New dependencies or environment requirements
  - Testing instructions
  - Version number updates
- Updates `CLAUDE.md` with:
  - Architecture changes
  - New features or API changes
  - Testing procedures
  - Known limitations

### 3. Changelog Management
- Creates or updates `docs/CHANGELOG_YYYY-MM-DD.md`
- Documents all changes made in the session
- Includes code examples where relevant
- Records dependency version updates

### 4. File Organization
- Identifies misplaced files
- Suggests appropriate locations
- Creates missing directory structures

## Instructions

### Step 1: Scan for Test Scripts

Check the project root for test files:
- `test_*.py`
- `*_test.py`
- Any file with "test" in the name

### Step 2: Organize Tests

Move test files to appropriate directories:
- UI tests → `tests/ui/`
- Integration tests → `tests/integration/`
- Unit tests → `tests/unit/`
- Performance tests → `tests/performance/`

Create `tests/README.md` if it doesn't exist, including:
- Directory structure
- How to run each test type
- Prerequisites (dependencies, running services)
- Common issues and solutions
- Generated artifacts (screenshots, reports)

### Step 3: Update Documentation

**For `docs/README.md`:**
- Add a "Known Issues & Fixes" section if recent bugs were resolved
- Update dependency versions if packages were upgraded
- Add testing instructions section
- Update version number and last updated date

**For `CLAUDE.md`:**
- Document any architectural changes
- Add new features to relevant sections
- Update testing procedures
- Add any new dependencies to the dependency management section
- Update frontend/backend integration notes if applicable

### Step 4: Create/Update Changelog

In `docs/CHANGELOG_YYYY-MM-DD.md`:
- Use today's date in filename
- Document all changes with appropriate emoji markers:
  - 🐛 Bug fixes
  - ✨ New features
  - 📝 Documentation updates
  - 🔧 Configuration changes
  - 🧪 Testing improvements
  - ♻️ Code refactoring
- Include code snippets for significant changes
- List updated dependency versions

### Step 5: Verify Organization

Check that:
- All test files are in `tests/` subdirectories
- No orphaned test scripts remain in root
- README files are up-to-date
- CLAUDE.md reflects current state
- Changelog captures all session work

### Step 6: Report Summary

Provide a summary including:
- Number of files moved/organized
- Documentation files updated
- Changelog created/updated
- Any remaining manual tasks

## Examples

### Example 1: After Bug Fix

**Scenario:** Fixed map responsive issue

**Actions:**
1. Move `test_map_resize.py`, `test_map_responsive.py` to `tests/ui/`
2. Create `tests/README.md` with map testing instructions
3. Add "Known Issues & Fixes" section to `docs/README.md` documenting the bug and fix
4. Update `CLAUDE.md` frontend responsive design section
5. Create `docs/CHANGELOG_2025-11-05.md` with bug fix details

### Example 2: After Feature Implementation

**Scenario:** Implemented new data export feature

**Actions:**
1. Move `test_export.py` to `tests/integration/`
2. Update `tests/README.md` with export testing section
3. Add feature to `docs/README.md` features list
4. Document export API in `CLAUDE.md`
5. Update changelog with feature description

### Example 3: After Dependency Update

**Scenario:** Upgraded Python packages

**Actions:**
1. Update `docs/README.md` dependency installation section
2. Update `CLAUDE.md` dependency management section
3. Document version changes in changelog
4. Add any compatibility notes

## Output Format

Provide a structured summary:

```markdown
## Cleanup Summary

### Files Organized
- Moved X test files to tests/
- Created Y new directories

### Documentation Updated
- ✅ docs/README.md
  - Added "Known Issues" section
  - Updated version to X.Y.Z
- ✅ CLAUDE.md
  - Updated frontend responsive design section
  - Added testing procedures
- ✅ Created docs/CHANGELOG_2025-11-05.md

### Test Documentation
- ✅ Created/Updated tests/README.md
  - Added X test descriptions
  - Included troubleshooting guide

### Remaining Tasks
- [ ] Manual task 1 (if any)
- [ ] Manual task 2 (if any)
```

## Best Practices

1. **Preserve Existing Content**: Don't overwrite existing documentation, append or merge carefully
2. **Use Clear Sections**: Organize documentation with clear headings
3. **Include Examples**: Add code examples for complex changes
4. **Date Everything**: Use YYYY-MM-DD format consistently
5. **Be Specific**: Document exact file paths, line numbers where relevant
6. **Cross-Reference**: Link between related documentation sections

## Files This Skill Typically Modifies

- `tests/**/*.py` (moves existing files)
- `tests/README.md` (creates or updates)
- `docs/README.md` (updates)
- `CLAUDE.md` (updates)
- `docs/CHANGELOG_YYYY-MM-DD.md` (creates or updates)

## Allowed Tools

This skill uses the following tools:
- `Read` - Read existing documentation
- `Write` - Create new documentation files
- `Edit` - Update existing files
- `Bash` - Move files, create directories
- `Glob` - Find test files
- `Grep` - Search for patterns in files

## Version History

- **1.0.0** (2025-11-05): Initial creation
  - Test organization
  - Documentation updates
  - Changelog management
