# Git Teaching Guide

**Last Updated:** 2025-11-14
**Technology Version:** Git 2.30+
**Reading Time:** 15-20 minutes

---

## Overview (5-min read)

**What is Git?**

Distributed version control system for tracking code changes, collaboration, and history management.

**When to use:**
- Track code changes over time
- Collaborate with teammates (branching, merging)
- Experiment safely (branches)
- Revert mistakes (rollback commits)

**Core concepts:**
1. **Branch Workflow** - Feature branches for isolated development
2. **Commit Best Practices** - Clear, atomic commits with meaningful messages
3. **Merge vs Rebase** - Integration strategies with different tradeoffs

**Quick Example:**

```bash
# Create feature branch
git checkout -b feature/add-login

# Make changes, commit
git add src/auth.py
git commit -m "Add login endpoint with JWT authentication"

# Push to remote
git push -u origin feature/add-login

# Merge to main (via pull request)
git checkout main
git pull
git merge feature/add-login
```

**Decision Tree:**
- Starting new work? → Create feature branch
- Small fix on main? → Hotfix branch
- Integrating changes? → Merge (preserves history) or Rebase (linear history)
- Pushed to remote? → DO NOT rebase (use merge)

---

## Deep Dive (15-min read)

### Concept 1: Branch Workflow (Feature Branches)

**Problem it solves:**
Working directly on main is risky. One person's incomplete work breaks others. Feature branches isolate changes.

**Code Example:**

```bash
# ❌ BEFORE: Working directly on main (risky)
git checkout main
# Edit files...
git commit -m "Work in progress"  # Breaks main for everyone!

# ✅ AFTER: Feature branch workflow
# 1. Create branch from latest main
git checkout main
git pull
git checkout -b feature/user-authentication

# 2. Work in isolation
git add src/auth.py tests/test_auth.py
git commit -m "Add user authentication with JWT

- Implement login endpoint
- Add password hashing with bcrypt
- Create JWT token generation
- Add unit tests for auth flow"

# 3. Push feature branch
git push -u origin feature/user-authentication

# 4. Create pull request (on GitHub/GitLab)
# 5. After review, merge to main

# Why this is better:
# - main branch always stable
# - Easy to abandon failed experiments (delete branch)
# - Code review before merging
# - Clear history of feature development
```

**Branch Naming Conventions:**

```bash
feature/add-user-auth       # New feature
bugfix/fix-login-crash      # Bug fix
hotfix/security-patch       # Urgent production fix
refactor/simplify-db-layer  # Code refactoring
```

**Common mistakes:**
- ❌ Working directly on main → Unstable codebase
- ❌ Long-lived branches (weeks) → Merge conflicts
- ✅ Short-lived feature branches (1-3 days)

---

### Concept 2: Commit Best Practices

**Problem it solves:**
Bad commit messages = impossible to understand history. Atomic commits = easy to revert specific changes.

**Code Example:**

```bash
# ❌ BEFORE: Bad commits
git commit -m "fix"  # What was fixed?
git commit -m "updated files"  # Which files? Why?
git commit -a -m "WIP"  # Not descriptive

# ✅ AFTER: Good commits
git commit -m "Fix login crash when email field is empty

- Add null check in validateEmail()
- Return 400 Bad Request with clear error message
- Add test case for empty email scenario

Fixes #142"

# Why this is better:
# - Clear what changed (Fix login crash)
# - Explains why (email field empty)
# - Lists specific changes (bullets)
# - Links to issue (#142)
```

**Commit Message Structure:**

```
<type>: <short summary> (50 chars max)

<detailed explanation> (72 chars per line)
- What changed
- Why it changed
- How it works now

Fixes #<issue-number>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring (no behavior change)
- `test:` Add/update tests
- `docs:` Documentation changes
- `chore:` Build, config, dependencies

**Atomic Commits:**

```bash
# ❌ BEFORE: One commit with mixed changes
git add .
git commit -m "Add feature and fix bug"  # Hard to revert!

# ✅ AFTER: Separate commits for each logical change
git add src/feature.py tests/test_feature.py
git commit -m "feat: Add user profile feature"

git add src/bugfix.py
git commit -m "fix: Resolve null pointer in login"

# Why this is better:
# - Easy to revert specific change
# - Clear history (one change per commit)
# - Cherry-pick commits to other branches
```

**Common mistakes:**
- ❌ Giant commits (50 files changed) → Hard to review
- ❌ Vague messages ("fix", "update") → No context
- ✅ Atomic commits with descriptive messages

---

### Concept 3: Merge vs Rebase

**Problem it solves:**
Integrate changes from main into feature branch. Merge preserves history, rebase creates linear history.

**Code Example:**

```bash
# Scenario: You're on feature branch, main has new commits

# ❌ WRONG: Pull main into feature (merge commit spam)
git checkout feature/my-feature
git pull origin main  # Creates merge commit every time

# ✅ Option 1: MERGE (preserves history, safe for shared branches)
git checkout main
git pull
git checkout feature/my-feature
git merge main  # Creates merge commit
git push

# Use when:
# - Branch already pushed to remote
# - Working with teammates on same branch
# - Want to preserve exact history

# ✅ Option 2: REBASE (linear history, cleaner)
git checkout main
git pull
git checkout feature/my-feature
git rebase main  # Replays your commits on top of main
git push --force-with-lease  # Rewrite history (careful!)

# Use when:
# - Branch not pushed yet (local only)
# - Working alone on feature
# - Want clean linear history

# Why this matters:
# - Merge: Easy to understand, safe, more commits
# - Rebase: Clean history, but rewrites commits (dangerous if pushed)
```

**Interactive Rebase (Clean Up Commits):**

```bash
# Before pushing, clean up messy commits
git rebase -i HEAD~3  # Edit last 3 commits

# Interactive editor shows:
pick abc123 Add feature
pick def456 Fix typo
pick ghi789 Fix typo again

# Squash typo fixes into first commit:
pick abc123 Add feature
squash def456 Fix typo
squash ghi789 Fix typo again

# Result: One clean commit instead of three
```

**Common mistakes:**
- ❌ Rebasing pushed commits → Breaks teammates' branches
- ❌ Merging main into feature repeatedly → Pollutes history
- ✅ Rebase before push, merge after push

---

## Best Practices Checklist

- [ ] **Use feature branches for all work** - Never commit directly to main
- [ ] **Write descriptive commit messages** - Explain what and why
- [ ] **Make atomic commits** - One logical change per commit
- [ ] **Pull before push** - Avoid conflicts
- [ ] **Do not rebase pushed commits** - Breaks shared history

---

## Troubleshooting

### Issue 1: Merge Conflict

**Symptoms:**
```
CONFLICT (content): Merge conflict in src/api.py
```

**Cause:** Same lines changed in both branches

**Solution:**
```bash
# 1. See conflicted files
git status

# 2. Open file, look for conflict markers
<<<<<<< HEAD
your changes
=======
their changes
>>>>>>> main

# 3. Edit file to resolve (keep one or merge both)
# 4. Mark as resolved
git add src/api.py
git commit -m "Resolve merge conflict in api.py"
```

---

### Issue 2: Accidentally Committed to Wrong Branch

**Symptoms:** Committed to main instead of feature branch

**Solution:**
```bash
# 1. Create feature branch (preserves commit)
git branch feature/my-work

# 2. Reset main to previous commit
git reset --hard HEAD~1  # Remove last commit from main

# 3. Switch to feature branch
git checkout feature/my-work  # Commit now on feature branch
```

---

### Issue 3: Need to Undo Last Commit

**Symptoms:** Committed too early or wrong files

**Solution:**
```bash
# Keep changes, undo commit (most common)
git reset --soft HEAD~1  # Commit undone, files still staged

# Undo commit and staging
git reset HEAD~1  # Files back to unstaged

# Completely discard commit and changes (DANGEROUS)
git reset --hard HEAD~1  # All changes lost!
```

---

## Further Learning

**Official Documentation:**
- [Pro Git Book](https://git-scm.com/book/en/v2)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)

**Related Topics:**
- Pull request workflow - See `teaching-github.md` (future)
- Git hooks - See project `.git/hooks/`

---

**Last Updated:** 2025-11-14
**Maintainer:** Teaching System
