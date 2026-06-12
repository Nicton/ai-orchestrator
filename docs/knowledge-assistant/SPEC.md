# AI Business Analyst / Product Knowledge Assistant

## Goal

Create a system that lets employees ask product, process, requirement, and documentation questions in natural language, using text or voice, and receive fast answers with sources.

## Core business problem

Knowledge is fragmented across:

- Confluence
- Jira
- project documentation
- release history
- chat history
- people

This causes slow answers, conflicting interpretations, difficult onboarding, and poor planning quality.

## User promise

A user asks a question like:

`We need to add a new carrier type in TMS. Which systems will be affected?`

The system should:

1. Accept voice or text input.
2. Turn voice into text when needed.
3. Detect intent.
4. Retrieve relevant knowledge.
5. Follow cross-links between related entities.
6. Ask clarifying questions when evidence is incomplete.
7. Return an answer with sources, dependencies, risks, and affected systems.
8. Save the full interaction for analytics.

## High-level architecture

- Speech-to-Text layer: Whisper for MVP
- Query gateway: OpenClaw
- Orchestration layer: AI Orchestrator
- Retrieval layer: vector search first, graph later
- LLM layer: Cloud Code / Claude Code
- Analytics layer: PostgreSQL-backed query lake

## Knowledge sources

Priority sources expected for the system:

1. ADR and approved product docs
2. Confluence content
3. Jira issue context
4. structured repo docs
5. release notes and historical artifacts

## MVP scope

Phase 1 should deliver:

- web UI with a dedicated knowledge tab
- document retrieval over local documentation
- source-backed answers
- query logging
- analytics dashboard
- initial knowledge-gap detection

Phase 1 should not depend on:

- full knowledge graph reasoning
- realtime voice conversations
- automatic Jira task creation
- automatic documentation publishing

## Data and analytics requirements

Every user query must be stored.

Minimum analytics needs:

- top questions
- top intents
- most-used source files
- low-confidence answers
- recurring knowledge gaps

## Knowledge gaps

If the system repeatedly receives questions around a topic and cannot answer confidently, it should open a structured documentation gap entry.

Example:

- topic: `Carrier Billing Rules`
- reason: low confidence or no relevant indexed sources
- follow-up: documentation needed

## Target outcome

Within 5-15 seconds, the user should receive a grounded answer with linked evidence. In parallel, the company accumulates a query lake and a feedback loop showing where documentation is incomplete.
