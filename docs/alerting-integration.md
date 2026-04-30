# RHTAS Console Alerting Integration

## Architecture

```
Prometheus Server                    Alertmanager
  (scrape TAS metrics)               (group/route/notify)
  (evaluate rules)  ──firing────▶    │
                                     ├──▶ Console Backend webhook receiver
                                     │      POST /webhooks/alertmanager
                                     │
                                     ├──▶ PagerDuty / Slack / Email (native AM receivers)
                                     └──▶ Other receivers (configured in AM, not Console)
```

Prometheus Server evaluates alerting rules against TAS component metrics. When rules fire, alerts are sent to Alertmanager, which deduplicates, groups, and routes them to configured receivers.

The RHTAS Console is one receiver — it displays and manages alerts but is **not** the sole notification channel. External tools (PagerDuty, Slack, email) receive alerts directly from Alertmanager through its native receiver configuration.

## Alerting Rules

Three rules are defined in `deploy/prometheus/alerting-rules.yaml`:

### RHTASCertificateExpiringSoon

Fires when any TAS certificate will expire within 30 days.

- **Expression**: `rhtas_certificate_expiry_seconds < 30 * 24 * 3600`
- **Duration**: 5 minutes
- **Severity**: warning
- **Required metric**: `rhtas_certificate_expiry_seconds` (gauge, labeled with `certificate_name` and `component`)

### RHTASComponentDown

Fires when any TAS component is unreachable.

- **Expression**: `up{job=~"rhtas-.*"} == 0`
- **Duration**: 2 minutes
- **Severity**: critical
- **Required metric**: `up` (built-in Prometheus scrape health metric, filtered by job label)

### RHTASVerificationFailureSpike

Fires when artifact verification failures exceed a threshold.

- **Expression**: `rate(rhtas_verification_failures_total[5m]) > 0.1`
- **Duration**: 3 minutes
- **Severity**: warning
- **Required metric**: `rhtas_verification_failures_total` (counter)

## Alertmanager Receiver Configuration

The base configuration (`deploy/alertmanager/alertmanager.yaml`) routes all RHTAS alerts to the Console backend webhook. To add external receivers, edit the Alertmanager configuration directly.

### Slack

```yaml
receivers:
  - name: rhtas-console
    webhook_configs:
      - url: http://rhtas-console-backend:8080/webhooks/alertmanager
        send_resolved: true
  - name: rhtas-slack
    slack_configs:
      - api_url: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXX
        channel: '#rhtas-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        send_resolved: true

route:
  receiver: rhtas-console
  group_by: [alertname, severity]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: rhtas-console
      group_wait: 10s
      repeat_interval: 1h
      continue: true
    - match:
        severity: critical
      receiver: rhtas-slack
```

### PagerDuty

```yaml
receivers:
  - name: rhtas-pagerduty
    pagerduty_configs:
      - service_key: <your-pagerduty-service-key>
        severity: '{{ .CommonLabels.severity }}'
        description: '{{ .CommonAnnotations.summary }}'
```

### Email

```yaml
receivers:
  - name: rhtas-email
    email_configs:
      - to: ops-team@example.com
        from: alertmanager@example.com
        smarthost: smtp.example.com:587
        auth_username: alertmanager
        auth_password: <password>
        send_resolved: true
```

### Generic Webhook

```yaml
receivers:
  - name: custom-webhook
    webhook_configs:
      - url: https://your-service.example.com/webhook
        send_resolved: true
```

## Adding Custom Alerting Rules

Add rules to the `groups[0].rules` array in `deploy/prometheus/alerting-rules.yaml`:

```yaml
- alert: YourCustomAlert
  expr: your_metric_expression > threshold
  for: 5m
  labels:
    severity: warning  # critical, warning, or info
  annotations:
    summary: "Human-readable summary with {{ $labels.label_name }}"
    description: "Detailed description of the alert condition."
```

Reload Prometheus after editing (`POST /-/reload` or send SIGHUP).

## Console Webhook Contract

The Console backend receives Alertmanager webhooks at `POST /webhooks/alertmanager`. The payload follows the Alertmanager v4 webhook format:

```json
{
  "version": "4",
  "groupKey": "{}:{alertname=\"RHTASComponentDown\"}",
  "status": "firing",
  "receiver": "rhtas-console",
  "alerts": [
    {
      "status": "firing",
      "labels": { "alertname": "RHTASComponentDown", "job": "rhtas-rekor", "severity": "critical" },
      "annotations": { "summary": "TAS component rekor is down" },
      "startsAt": "2026-04-29T08:30:00.000Z",
      "endsAt": "0001-01-01T00:00:00Z",
      "generatorURL": "http://prometheus:9090/graph?g0.expr=...",
      "fingerprint": "def456abc789"
    }
  ]
}
```

The backend upserts alerts by `fingerprint`, updates status on resolve, and exposes the REST API consumed by the Console frontend.

## Design Decisions

**The Console does not manage Alertmanager routing.** Alertmanager has its own configuration file and HTTP API for managing receivers and routes. Building a UI to duplicate this would create confusion about the source of truth and add maintenance burden. Operators configure external receivers by editing Alertmanager's config directly, using the examples above.

**Prometheus is the alert source.** The Console displays and manages alert state (acknowledgement, filtering) but does not generate alerts. All alert detection happens through Prometheus rule evaluation.
