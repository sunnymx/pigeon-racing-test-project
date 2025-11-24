---
name: pr-workflow
description: Pull request workflow management including addressing PR comments, updating descriptions, and managing review feedback. Expert in PR etiquette, code review responses, and collaborative development. Use when working with pull request comments, updating PRs, or managing code reviews.
---

# Pull Request Workflow Expert

## When to Use This Skill

Activate when:
- Addressing pull request review comments
- Updating PR titles and descriptions
- Responding to code review feedback
- Managing PR lifecycle

## Workflow: Address PR Comments

### Step 1: Understand the PR
```bash
# Read the diff to understand changes
git diff main...branch-name

# Check PR branch
git checkout branch-name
```

### Step 2: Read Review Comments

Use GitHub API to fetch comments:
```bash
# Get PR comments
curl -H "Authorization: token ${GITHUB_TOKEN}" \
     https://api.github.com/repos/owner/repo/pulls/PR_NUMBER/comments

# Get review comments
curl -H "Authorization: token ${GITHUB_TOKEN}" \
     https://api.github.com/repos/owner/repo/pulls/PR_NUMBER/reviews
```

### Step 3: Address Each Comment

For each review comment:
1. Understand the feedback
2. Make necessary code changes
3. Commit with clear message referencing the comment
4. Push to update the PR

```bash
# Make changes, then:
git add .
git commit -m "fix: address review comment - improve error handling"
git push
```

### Step 4: Respond to Comments

Reply to comments via API:
```bash
curl -X POST \
     -H "Authorization: token ${GITHUB_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"body":"Fixed in commit abc123. Thanks for the feedback!"}' \
     https://api.github.com/repos/owner/repo/pulls/comments/COMMENT_ID/replies
```

## Update PR Description

### Update Title and Description
```bash
curl -X PATCH \
     -H "Authorization: token ${GITHUB_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Updated PR Title",
       "body": "## Summary\nUpdated description...\n\n## Changes\n- Fixed issue X\n- Improved Y"
     }' \
     https://api.github.com/repos/owner/repo/pulls/PR_NUMBER
```

### PR Description Template
```markdown
## Summary
Brief overview of what this PR does

## Changes
- Change 1
- Change 2
- Change 3

## Testing
How the changes were tested

## Related Issues
Fixes #123
Closes #456

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests passing
- [ ] No breaking changes
```

## Best Practices

### Addressing Comments
1. **Acknowledge feedback**: Thank reviewers for their time
2. **Be specific**: Reference commits or lines in your response
3. **Explain decisions**: If you disagree, explain why politely
4. **Link commits**: Reference specific commits that address feedback
5. **Mark resolved**: Resolve conversations after addressing

### Commit Messages for Reviews
```bash
# Good commit messages when addressing reviews:
git commit -m "fix: handle edge case as suggested by @reviewer"
git commit -m "refactor: simplify logic per code review"
git commit -m "test: add test case requested in review"
git commit -m "docs: clarify function behavior per feedback"
```

### Communication
- **Be responsive**: Address comments promptly
- **Be respectful**: Remember reviewers are helping improve code
- **Be clear**: Explain your reasoning when needed
- **Be collaborative**: View reviews as discussions, not criticisms

## Example Workflow

**Scenario**: PR has 3 review comments

```bash
# 1. Fetch and read PR comments
curl -H "Authorization: token ${GITHUB_TOKEN}" \
     https://api.github.com/repos/owner/repo/pulls/123/comments > comments.json

# 2. Review each comment and make changes
# Comment 1: "Add error handling"
# Comment 2: "Extract magic number to constant"
# Comment 3: "Add unit test"

# 3. Make changes and commit
git add src/module.py
git commit -m "fix: add error handling as requested in review"
git push

git add src/constants.py src/module.py
git commit -m "refactor: extract magic number to constant"
git push

git add tests/test_module.py
git commit -m "test: add unit test for edge case"
git push

# 4. Reply to each comment
# Use API to post replies thanking reviewer and referencing commits

# 5. Request re-review
curl -X POST \
     -H "Authorization: token ${GITHUB_TOKEN}" \
     https://api.github.com/repos/owner/repo/pulls/123/requested_reviewers \
     -d '{"reviewers":["reviewer-username"]}'
```

## GitHub API Endpoints Reference

| Endpoint | Purpose |
|----------|---------|
| `GET /repos/:owner/:repo/pulls/:number` | Get PR details |
| `GET /repos/:owner/:repo/pulls/:number/comments` | Get PR comments |
| `GET /repos/:owner/:repo/pulls/:number/reviews` | Get PR reviews |
| `POST /repos/:owner/:repo/pulls/:number/comments/:id/replies` | Reply to comment |
| `PATCH /repos/:owner/:repo/pulls/:number` | Update PR title/description |
| `POST /repos/:owner/:repo/pulls/:number/requested_reviewers` | Request review |

## Resources

- GitHub PR API: https://docs.github.com/en/rest/pulls
- Code Review Best Practices: https://github.com/google/eng-practices/blob/master/review/reviewer/
