# Hermes Automation Scripts

This directory contains automation scripts for SINTAK ERP development workflow.

## Available Scripts

### `scripts/create-pr.sh`
Quick GitHub PR creation without gh CLI.

**Usage:**
```bash
bash .hermes/scripts/create-pr.sh "PR title" "PR body"
```

**Example:**
```bash
bash .hermes/scripts/create-pr.sh "feat: add user permissions" "## Summary
- Add role-based permissions
- Update auth middleware

## Test Plan
- [x] Build passes
- [x] Manual testing done"
```

## Setup

GitHub token required in `~/.hermes/.env`:
```
GITHUB_TOKEN=ghp_your_token_here
```

Generate token: https://github.com/settings/tokens (scope: `repo`)
