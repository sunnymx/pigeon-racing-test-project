---
name: github
description: GitHub and Git operations expert. Covers GitHub API usage, repository management, branch operations, pull request workflows, and Git commands. Use when working with GitHub, creating PRs, pushing code, managing branches, or interacting with GitHub API.
allowed-tools: [Bash, Read, Write]
---

# GitHub and Git Expert

## When to Use This Skill

Activate when working with:
- Git operations (commit, push, pull, branch)
- GitHub API interactions
- Pull request creation and management
- Repository operations
- Branch management
- Code review workflows

## Environment

You have access to `GITHUB_TOKEN` environment variable for GitHub API interactions.

## Important Rules

**ALWAYS use GitHub API instead of web browser**
**ALWAYS use Git commands for repository operations**
**NEVER push directly to `main` or `master` branch**

## GitHub API Usage

### Using curl with GITHUB_TOKEN

```bash
# Get repository info
curl -H "Authorization: token ${GITHUB_TOKEN}" \
     https://api.github.com/repos/username/repo

# List pull requests
curl -H "Authorization: token ${GITHUB_TOKEN}" \
     https://api.github.com/repos/username/repo/pulls

# Create an issue
curl -X POST \
     -H "Authorization: token ${GITHUB_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"title":"Bug report","body":"Description"}' \
     https://api.github.com/repos/username/repo/issues
```

## Git Operations

### Branch Management

```bash
# View current branch and remotes
git remote -v && git branch

# Create and switch to new branch
git checkout -b feature/new-feature

# Quick commit and push
git add . && git commit -m "feat: add new feature" && git push -u origin feature/new-feature
```

### Push Workflow

**DO THIS** (if user requests push):
1. Check current branch: `git branch`
2. Create new branch if on openhands-workspace: `git checkout -b better-branch-name`
3. Add and commit changes: `git add . && git commit -m "message"`
4. Push to branch: `git push -u origin branch-name`
5. Create PR using API or tool
6. Send user the PR link

**NEVER create multiple PRs** - update existing PR instead

## Pull Request Workflows

### Creating a PR

Use API or gh CLI:
```bash
# Using gh CLI (if available)
gh pr create --title "Feature: Add new functionality" \
             --body "Description of changes" \
             --base main

# Or use GitHub API
curl -X POST \
     -H "Authorization: token ${GITHUB_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Feature: Add functionality",
       "head": "feature-branch",
       "base": "main",
       "body": "Description"
     }' \
     https://api.github.com/repos/owner/repo/pulls
```

### Updating PRs

```bash
# Update existing PR
git add .
git commit -m "address review comments"
git push

# Update PR title/description via API
curl -X PATCH \
     -H "Authorization: token ${GITHUB_TOKEN}" \
     -d '{"title":"Updated title","body":"Updated description"}' \
     https://api.github.com/repos/owner/repo/pulls/123
```

## Authentication Issues

If encountering authentication issues:

```bash
# Update remote URL with token
git remote set-url origin https://${GITHUB_TOKEN}@github.com/username/repo.git
```

## Git Config

**DO NOT modify** - Git config (username and email) is pre-set.

## Best Practices

1. **Branch naming**: Use descriptive names like `feature/user-auth` or `bugfix/login-error`
2. **Commit messages**: Follow conventional commits (`feat:`, `fix:`, `docs:`, etc.)
3. **Small commits**: Make frequent, focused commits
4. **Test before push**: Ensure code works before pushing
5. **Update existing PRs**: Don't create new PRs unnecessarily
6. **PR descriptions**: Include what changed and why

## Quick Commands

```bash
# One-line add, commit, push
git add . && git commit -m "message" && git push -u origin branch

# Check status
git status

# View recent commits
git log --oneline -5

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Pull latest changes
git pull origin main
```

## Example Workflow

```bash
# 1. Check current state
git remote -v && git branch

# 2. Create feature branch
git checkout -b create-widget

# 3. Make changes, then commit and push
git add . && \
git commit -m "feat: create widget component" && \
git push -u origin create-widget

# 4. Create PR (use API or tool)
# 5. Send user PR link
```

## Resources

- GitHub API Docs: https://docs.github.com/en/rest
- Git Documentation: https://git-scm.com/doc
- GitHub CLI: https://cli.github.com/
