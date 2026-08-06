# Architectural Decisions Record (ADR)

## ADR-001: Integration of MISP Threat Sharing Platform
- **Date**: 2026-07-28
- **Status**: Verified & Active
- **Decision**: Integrated self-hosted MISP Docker stack (`coolacid/misp-docker:core-latest`) on port 8443 for threat feed sharing and IOC attribute sync.

## ADR-002: Abuse.ch Threat Feed Integration
- **Date**: 2026-07-28
- **Status**: Verified & Active
- **Decision**: Integrated Abuse.ch URLhaus, MalwareBazaar, and ThreatFox API connectors into NestJS feed ingestion pipeline.

## ADR-003: Real Wazuh 4.10.0 and Splunk Enterprise SIEM Connectors
- **Date**: 2026-08-05
- **Status**: Verified & Active
- **Decision**: Deployed official `wazuh/wazuh-manager:4.10.0` and official `splunk/splunk:latest` Docker containers for live SIEM REST API authentication and HEC alert forwarding (`{"text":"Success","code":0}`).

## ADR-004: VirusTotal API v3 Malware Scan Integration
- **Date**: 2026-08-05
- **Status**: Verified & Active
- **Decision**: Integrated VirusTotal REST API v3 for automated forensic hash enrichment (EICAR sample 65/67 detections).

## ADR-005: Selection of Kimi 3 on Modal Cloud as Primary CTI AI Analysis Kernel
- **Date**: 2026-08-05
- **Status**: Approved & Active (User Choice: *"kimi is my own choice so remain on it"*)
- **Decision**: Kimi 3 hosted on Modal Cloud (`[muhimakhtar4]` workspace) serves as the CTI incident analysis kernel for risk scoring (0-100), ATT&CK technique extraction, and SOC remediation generation.

## ADR-006: Single-Instance Redis Distributed Lock Topology
- **Date**: 2026-08-06
- **Status**: Approved & Active
- **Context**: Replaced in-memory `Set<string>` sync locks in `FeedSchedulerService` with a Redis-backed distributed lock (`ioredis`).
- **Scope & Limitations**: Employs atomic `SET key val NX PX ttl` with Lua release scripts against the single Redis instance (`ctp-redis`). This is sufficient for single-instance Redis topologies. A full multi-node Redlock algorithm would be required if Redis itself were deployed in a multi-master cluster.
- **Verification**: Passed OS multi-process concurrency test using 2 independent OS child process IDs (`16344` and `7328`).
