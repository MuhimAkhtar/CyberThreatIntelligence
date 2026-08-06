# System Architecture

## High-Level Component Architecture

Data sources (threat intel feeds, sensors/logs) flow through Kafka into AI detection and search/indexing, with PostgreSQL and Redis backing the NestJS API, which serves the React frontend. Docker/Kubernetes underpins deployment and scaling for all services.

```
┌─────────────────────────────────────┐
│         Data Sources                │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ Threat Intel │ │ Sensors/Logs │  │
│  │ (MISP, OTX,  │ │ (Network,    │  │
│  │  CVE/NVD)    │ │  Endpoint)   │  │
│  └──────┬───────┘ └──────┬───────┘  │
└─────────┼────────────────┼──────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────┐
│     Ingestion & Streaming           │
│         Kafka Event Bus             │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
┌──────────────────┐ ┌────────────────┐
│ Processing &     │ │ Search &       │
│ Intelligence     │ │ Indexing       │
│                  │ │                │
│ AI Threat Det.   │ │ Elasticsearch/ │
│ (TensorFlow)     │ │ OpenSearch     │
│       │          │ │                │
│ Alert Engine     │ └────────────────┘
│       │          │
│ AI Incident      │
│ Summarization    │
└──────┬───────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Storage                     │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ PostgreSQL   │ │ Redis        │  │
│  │ (core data,  │ │ (cache,      │  │
│  │  CVEs, cases,│ │  sessions,   │  │
│  │  users)      │ │  rate limits)│  │
│  └──────────────┘ └──────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Application Layer             │
│         NestJS API                  │
│    (REST, Auth, RBAC)               │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
┌──────────────────┐ ┌────────────────┐
│ Presentation     │ │ External SIEM  │
│ Layer            │ │ (bi-directional│
│                  │ │  integration)  │
│ React SPA        │ │                │
│ (SOC Dashboard,  │ └────────────────┘
│  Attack Map,     │
│  IOC Search,     │
│  Timeline)       │
└──────┬───────────┘
       │
       ▼
  SOC Analysts /
  Admins /
  Investigators
```

## Core Incident & Data Flow

```
Threat Intel Feeds    CVE Management
+ IOC Ingestion       (NVD sync)
       │                   │
       └───────┬───────────┘
               │
               ▼
      AI Threat Detection
         Engine
               │
               ▼
      Correlation &
      Enrichment
      (malware DB, IOC match)
               │
               ▼
      Alert Engine
      (scoring, triage)
          │         │
          │    AI Incident
          │    Summarization
          │         │
          ▼         ▼
      SOC Dashboard
      + Live Attack Map
      + Attack Timeline
          │    ▲
   analyst │    │ feedback
          ▼    │
      Investigation
      Workflow
          │
    ┌─────┴─────┐
    ▼           ▼
Digital     Case Closure /
Forensics   Reporting
Module
```

## Architecture Diagram Images

The original diagrams are in `/docs/diagrams/`.
