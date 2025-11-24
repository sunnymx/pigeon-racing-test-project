---
name: bitbucket
description: Bitbucket platform operations including pull requests, pipelines, and repository management. Use when working with Bitbucket, creating pull requests, or managing Bitbucket-specific workflows.
---

# Bitbucket Expert

## When to Use This Skill

Activate when working with:
- Bitbucket pull requests
- Bitbucket Pipelines
- Bitbucket API interactions
- Bitbucket-specific operations

## Bitbucket API

Use app passwords or OAuth for authentication:

```bash
# Get repository info (Cloud)
curl -u username:app_password \
     https://api.bitbucket.org/2.0/repositories/workspace/repo

# List pull requests
curl -u username:app_password \
     https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests
```

## Pull Request Operations

### Create PR
```bash
curl -X POST -u username:app_password \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Feature: Add functionality",
       "source": {"branch": {"name": "feature-branch"}},
       "destination": {"branch": {"name": "main"}},
       "description": "Detailed description"
     }' \
     https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests
```

## Bitbucket Pipelines

### bitbucket-pipelines.yml Example
```yaml
image: node:16

pipelines:
  default:
    - step:
        name: Build and Test
        caches:
          - node
        script:
          - npm install
          - npm test
          - npm run build
  branches:
    main:
      - step:
          name: Deploy to Production
          deployment: production
          script:
            - npm run deploy
```

## Resources

- Bitbucket API: https://developer.atlassian.com/cloud/bitbucket/rest/
- Bitbucket Pipelines: https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/
