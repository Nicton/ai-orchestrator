---
title: Production Deployment Runbook
source_type: confluence
confluence_url: https://shiptify.atlassian.net/wiki/search?text=Deployment%20Runbook&spaces=OPS
---

# Production Deployment Runbook

How to safely ship a change to production.

## Pre-deploy

- All CI checks green on the target branch.
- Database migrations reviewed; backward-compatible (expand/contract) only.
- Feature flag created for any user-visible change.

## Deploy

1. Merge to `main`; the pipeline builds and pushes images.
2. Promote to staging and run the smoke suite.
3. Promote to production via the `deploy:prod` manual job.
4. Watch dashboards and error rates for 15 minutes.

## Rollback

- Re-run the previous successful `deploy:prod` job, or
- Toggle the feature flag off if the change is flag-gated.

## Incident

If error rate spikes, roll back first and investigate after. Open an incident in Jira
project OPS and notify the on-call channel.
