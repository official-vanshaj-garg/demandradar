# DemandRadar Command Notes

This file records useful commands used while building DemandRadar.

## Git Basics

### git status --short
Shows changed, staged, or untracked files.
Empty output means the working tree is clean.

### git branch --show-current
Shows the current branch.

### git log --oneline -5
Shows recent commits in compact form.

### git add .
Stages all changed files for the next commit.

### git commit -m "message"
Creates a local snapshot of staged changes.

### git push
Uploads local commits to GitHub.

## Project Notes

Current layer: Layer 1 — UI shell audit and cleanup.

Do not add backend, database, AI, auth, payments, admin panels, or real map integration yet.
