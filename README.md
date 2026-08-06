# 🛡️ National Cyber Threat Intelligence Platform (CTIP)

An enterprise-grade, real-time **National Cyber Threat Intelligence Platform** built with NestJS, PostgreSQL, Redis, Apache Kafka, Elasticsearch, Splunk Enterprise, Wazuh 4.10.0, VirusTotal v3, Brevo SMTP, and Kimi 3 AI on Modal Cloud.

---

## 🚀 Key Features & Capabilities

- **Real-Time Threat Ingestion**: Multi-feed parser supporting Abuse.ch, NVD (CVEs), AlienVault OTX, MISP, and custom STIX/TAXII inputs.
- **Distributed Event Pipeline**: High-throughput Apache Kafka event stream (`threat-intel.raw`, `threat-intel.iocs-normalized`, `alerts.created`).
- **Elasticsearch Search Engine**: High-speed IOC correlation and full-text search across millions of threat indicators.
- **Single-Instance Redis Distributed Lock**: Concurrency control via atomic Redis `SET NX PX` and Lua release scripts.
- **SIEM Bi-Directional Connectors**: Live event streaming to **Splunk Enterprise HEC** (`:8088`) and **Wazuh 4.10.0 Manager API** (`:55000`).
- **AI Threat Summarization**: Serverless **Kimi 3 AI Engine** on **Modal Cloud** delivering 0-100 risk scores, MITRE ATT&CK extraction, and SOC remediation guides.
- **Digital Forensics**: Cryptographic SHA-256 chain of custody with VirusTotal API v3 malware scanning.
- **Automated SOAR Playbooks**: Multi-step automated trigger and response actions (`CREATE_CASE`, `ENRICH_IOC`, `SEND_NOTIFICATION`, `FORWARD_TO_SIEM`).
- **Transactional Alerting**: STARTTLS email notifications via **Brevo SMTP Relay** (`smtp-relay.brevo.com:587`).
- **Interactive OpenAPI Documentation**: Auto-generated Swagger interface at `/api/docs`.

---

## 🛠️ Technology Stack

- **Backend Core**: NestJS 10, TypeScript, Prisma ORM 5.
- **Database**: PostgreSQL 16 (Alpine).
- **Caching & Locking**: Redis 7 (Alpine) + `ioredis` Single-Instance Distributed Lock.
- **Event Streaming**: Apache Kafka 3.7.0.
- **Search & Analytics**: Elasticsearch 8.13.0 + Kibana.
- **SIEM Systems**: Splunk Enterprise (`splunk/splunk:latest`) & Wazuh Manager 4.10.0.
- **AI Engine**: Kimi 3 (Moonshot AI) on Modal Cloud Serverless Compute.
- **Security & Throttling**: `@nestjs/throttler` (Rate Limiting).

---

## 📋 Quick Start Guide (Local Setup)

### 1. Boot Infrastructure Stack
```bash
cd infra/docker
docker-compose up -d
```

### 2. Configure Environment Variables
```bash
cd ../../backend
cp .env.example .env
```

### 3. Database Migration & Seed
```bash
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:seed
```

### 4. Run Application
```bash
pnpm run build
pnpm run start:prod
```
- REST API: `http://localhost:3000/api/v1`
- Swagger Docs: `http://localhost:3000/api/docs`

---

## 📚 Documentation Links

- 📘 [Operational Runbook](file:///C:/Users/Muheem%20Akhtar/Documents/antigravity/bold-raman/cyber-threat-platform/docs/runbook.md)
- 📝 [Architectural Decisions Record (ADR)](file:///C:/Users/Muheem%20Akhtar/Documents/antigravity/bold-raman/cyber-threat-platform/docs/decisions.md)
- 🧪 [User Acceptance Testing (UAT) Report](file:///C:/Users/Muheem%20Akhtar/Documents/antigravity/bold-raman/cyber-threat-platform/docs/uat_report.md)
- 🛡️ [Production Readiness Review](file:///C:/Users/Muheem%20Akhtar/Documents/antigravity/bold-raman/cyber-threat-platform/docs/production_readiness.md)
