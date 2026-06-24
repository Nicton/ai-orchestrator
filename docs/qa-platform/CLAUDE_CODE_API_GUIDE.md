# QA Platform — API guide for Claude Code / AI agents

API-first TMS + RMS + Automation Coverage + Traceability inside Searchify.
Base: `https://searchify.asmalouski.com/api/qa`. All JSON, REST, project-scoped,
soft-delete, globalId on every primary entity, bulk variants for mass operations.

## Auth
- **Browser (UI):** session cookie (the rest of Searchify).
- **AI agent / CI / reporters:** API token. Server env `QA_API_TOKEN=<secret>`; send it
  as `x-qa-token: <secret>` (or `Authorization: Bearer <secret>`). All `/api/qa/*`
  endpoints accept it.

```bash
TMS=https://searchify.asmalouski.com/api/qa
H='-H content-type:application/json -H x-qa-token:THE_TOKEN'
```

## 1. Create a project
```bash
curl $H -X POST $TMS/projects -d '{"name":"BLU","key":"BLU"}'
# → { id, globalId:"PRJ-1", ... }   save id as PID
```

## 2. Bulk-create requirements (from analysis)
```bash
curl $H -X POST $TMS/projects/$PID/requirements/bulk -d '{"items":[
  {"title":"User can reset password","priority":"High","type":"Functional",
   "sources":[{"type":"Jira","externalId":"APP-431"},{"type":"Confluence","title":"Password Reset Flow"}],
   "acceptanceCriteria":["Email reset works","SMS reset works"]},
  {"title":"Login rate limiting","priority":"Critical","type":"Security"}
]}'
# → { total, succeeded, results:[{globalId:"REQ-1"},{globalId:"REQ-2"}] }
```

## 3. Bulk-create test cases (from code/checklists)
```bash
curl $H -X POST $TMS/projects/$PID/test-cases/bulk -d '{"items":[
  {"title":"Valid user can login","priority":"Critical","type":"Smoke","steps":[
    {"action":"Open login page","expectedResult":"Login page shown"},
    {"action":"Submit valid creds","expectedResult":"Redirected to dashboard"}]}
]}'
```

## 4. Link requirement ↔ test case (many-to-many)
```bash
curl $H -X POST $TMS/projects/$PID/links -d '{"sourceType":"Requirement","sourceId":"<reqId>","targetType":"TestCase","targetId":"<tcId>","linkType":"covers"}'
```

## 5. Import automated tests (upsert by externalId) + link to test cases / steps
```bash
curl $H -X POST $TMS/projects/$PID/automated-tests/bulk-upsert -d '{"items":[
  {"externalId":"tests/auth/login.spec.ts::valid login","name":"valid login","framework":"Playwright"}
]}'
# link automated test → whole test case (Full) or → a step (StepLevel) for precise coverage:
curl $H -X POST $TMS/projects/$PID/links -d '{"sourceType":"AutomatedTest","sourceId":"<atId>","targetType":"TestCase","targetId":"<tcId>","coverageType":"Full"}'
curl $H -X POST $TMS/projects/$PID/links -d '{"sourceType":"AutomatedTest","sourceId":"<atId>","targetType":"TestStep","targetId":"<stepId>","coverageType":"StepLevel"}'
```

## 6. Checklist → test cases (one TC per item)
```bash
curl $H -X POST $TMS/projects/$PID/checklists -d '{"title":"Login smoke","type":"Smoke","items":["open page","enter creds","submit"]}'
curl $H -X POST $TMS/checklists/<clId>/expand-to-test-cases -d '{}'   # 3 items → 3 test cases
```

## 7. Test plan + run + results
```bash
curl $H -X POST $TMS/projects/$PID/test-plans -d '{"title":"Release smoke","type":"Smoke","items":[{"sourceType":"TestCase","sourceId":"<tcId>"}]}'
curl $H -X POST $TMS/test-plans/<tpId>/runs -d '{"title":"Run #1","source":"Mixed"}'   # snapshots items
curl $H -X POST $TMS/test-runs/<runId>/start -d '{}'
# manual result:
curl $H -X POST $TMS/test-runs/<runId>/items/<itemId>/result -d '{"status":"Passed","comment":"ok"}'
# automated results / live events (see reporters):
curl $H -X POST $TMS/test-runs/<runId>/events -d '{"eventType":"TestFinished","externalTestId":"...","status":"Passed","durationMs":1200,"eventId":"<uuid>"}'
curl $H -X POST $TMS/test-runs/<runId>/finish -d '{}'
```

## 8. Coverage gaps / traceability (the point of the system)
```bash
curl $H $TMS/projects/$PID/traceability                       # Req → TC → AT → last result
curl $H $TMS/projects/$PID/coverage/requirements              # per-requirement coverage
curl $H $TMS/projects/$PID/dashboard/summary                  # headline metrics
curl $H $TMS/requirements/<id>/coverage                       # one requirement
curl $H "$TMS/projects/$PID/search?query=REQ-12"              # global search by globalId/text
curl $H $TMS/projects/$PID/metrics                            # Prometheus text
```

## Conventions
- **globalId:** `REQ-`, `TC-`, `CL-`, `SS-`, `AT-`, `TP-`, `TR-`, `TRI-` (project-scoped).
- **Soft delete:** `DELETE /api/qa/{entity}/{id}` + `POST .../restore`; deleted links shown as deleted, not removed.
- **Versioning:** `GET /api/qa/{entity}/{id}/versions`, `POST .../versions/{n}/restore` (requirements, test-cases, checklists, shared-steps, automated-tests, test-plans).
- **Coverage is computed by the server** from links + steps + latest run results — never trusted from the payload.
- **Bulk** endpoints return `{ total, succeeded, failed, results:[{index, status, id, globalId, error?}] }`.
