# Grafana / Prometheus for the QA Platform

The QA Platform exposes Prometheus metrics **per project**:

```
GET /api/qa/projects/{projectId}/metrics      (auth: x-qa-token / Bearer)
```

Metrics: `tms_requirements_total`, `tms_requirements_implemented_total`,
`tms_requirements_partially_implemented_total`, `tms_requirements_not_covered_total`,
`tms_test_cases_total`, `tms_test_cases_automated_total`, `tms_automated_tests_total`,
`tms_test_runs_total`, `tms_test_run_items_{passed,failed,blocked,skipped}_total`,
`tms_hanging_tests_total`, `tms_automation_coverage_percent`, `tms_requirement_coverage_percent`.

## Prometheus scrape config
The endpoint is auth-protected and project-scoped, so scrape it with a bearer token
and one job per project:

```yaml
scrape_configs:
  - job_name: qa-platform
    scheme: https
    metrics_path: /api/qa/projects/<PROJECT_ID>/metrics
    authorization:
      credentials: <QA_API_TOKEN>
    static_configs:
      - targets: ['searchify.asmalouski.com']
```

(`authorization.credentials` becomes `Authorization: Bearer <token>`, which the API accepts.)

## Grafana dashboard
Import `qa-platform-dashboard.json` and pick your Prometheus datasource. Panels:
requirements (total / implemented / not-covered / coverage %), automation
(test cases / automated / coverage %), execution (passed / failed / blocked /
hanging) and a pass/fail timeseries.
