# 🧪 User Acceptance Testing (UAT) Report — National Cyber Threat Intelligence Platform

## Executive Summary
This UAT report documents manual and programmatic end-to-end user story walkthroughs across SOC Analyst, Incident Investigator, and Platform Administrator personas.

---

## Persona User Stories Walkthrough

| User Story ID | Persona | Story Description | Test Action / Endpoint | Result |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-01** | SOC Analyst | View high-priority threat alerts from last 24h | `GET /api/v1/alerts?severity=HIGH` | ✅ PASS |
| **UAT-02** | SOC Analyst | Query threat database for suspicious IP/hash IOC | `GET /api/v1/iocs/search?query=192.168.1.1` | ✅ PASS |
| **UAT-03** | Investigator | Escalate an alert into an active investigation case | `POST /api/v1/cases` | ✅ PASS |
| **UAT-04** | Investigator | Register forensic file artifact and record chain of custody | `POST /api/v1/forensics/artifacts` | ✅ PASS |
| **UAT-05** | Investigator | Scan forensic hash against VirusTotal API v3 | `POST /api/v1/forensics/artifacts/:id/vt-lookup` | ✅ PASS (65/67 Detections) |
| **UAT-06** | Administrator | Forward critical security alerts to Splunk Enterprise | `POST /api/v1/siem/connectors/:id/forward` | ✅ PASS (`{"text":"Success"}`) |
| **UAT-07** | Administrator | Generate Kimi 3 AI Incident Summary on Modal Cloud | `POST /api/v1/cases/:id/summarize` | ✅ PASS (Risk 92/100) |
| **UAT-08** | Administrator | Dispatch transactional incident email via Brevo SMTP | `POST /api/v1/notifications` | ✅ PASS (HTTP 250 Queued) |

---

## Rough Edge Resolution Log
- **Phase 1 UI Label Fix**: `Last Login: First Login` corrected to `Last Login: Never (First Login)` in auth status payload.
- **SIEM Webhook Hardening**: Added rate limiting throttling (`@Throttle(30 req/min)`) to public ingest endpoint to prevent spam attacks.
