---
title: Onboarding a New Engineer
source_type: confluence
confluence_url: https://shiptify.atlassian.net/wiki/spaces/ENG/pages/300303/Onboarding
---

# Onboarding a New Engineer

This is the day-one checklist for new engineers joining the platform team.

## Accounts and access

- Request SSO access from IT (covers Jira, Confluence, GitLab).
- Ask your team lead to add you to the relevant GitLab groups.
- VPN profile is provisioned automatically after SSO.

## Local environment

- Clone the monorepo and run `make bootstrap`.
- Docker Desktop is required for the local stack (Postgres, Redis, the orchestrator).
- Environment variables are documented in each service's `.env.example`.

## First week

- Pick a "good first issue" from the team board.
- Pair with your onboarding buddy on the first merge request.
- Read the architecture overview and the deployment runbook.

## Support

If you are blocked, the fastest path is the team channel; escalations go through your lead.
