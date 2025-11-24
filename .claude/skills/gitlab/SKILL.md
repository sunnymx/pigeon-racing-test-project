---
name: gitlab
description: GitLab platform operations including merge requests, CI/CD pipelines, and repository management. Use when working with GitLab, creating merge requests, or managing GitLab-specific workflows.
---

# GitLab Expert

## When to Use This Skill

Activate when working with:
- GitLab merge requests (MRs)
- GitLab CI/CD pipelines
- GitLab API interactions
- GitLab-specific Git operations

## GitLab vs GitHub Differences

- **Pull Request** → **Merge Request (MR)**
- **Organization** → **Group**
- **Actions** → **CI/CD Pipelines**

## GitLab API

Use `GITLAB_TOKEN` for API authentication:

```bash
# Get project info
curl --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
     "https://gitlab.com/api/v4/projects/PROJECT_ID"

# List merge requests
curl --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
     "https://gitlab.com/api/v4/projects/PROJECT_ID/merge_requests"
```

## Merge Request Operations

### Create MR
```bash
curl --request POST --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
     --header "Content-Type: application/json" \
     --data '{
       "source_branch": "feature-branch",
       "target_branch": "main",
       "title": "Feature: Add new functionality",
       "description": "Detailed description"
     }' \
     "https://gitlab.com/api/v4/projects/PROJECT_ID/merge_requests"
```

### Update MR
```bash
curl --request PUT --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
     --data "title=Updated Title" \
     "https://gitlab.com/api/v4/projects/PROJECT_ID/merge_requests/MR_IID"
```

## CI/CD Pipeline

### .gitlab-ci.yml Example
```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - npm install
    - npm run build

test:
  stage: test
  script:
    - npm test

deploy:
  stage: deploy
  script:
    - npm run deploy
  only:
    - main
```

## GitLab Runner

```bash
# Register runner
gitlab-runner register

# Run jobs locally
gitlab-runner exec shell job-name
```

## Resources

- GitLab API Docs: https://docs.gitlab.com/ee/api/
- GitLab CI/CD: https://docs.gitlab.com/ee/ci/
