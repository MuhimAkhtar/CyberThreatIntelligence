# 📘 Operational Runbook — National Cyber Threat Intelligence Platform

## 1. System Bring-Up Sequence (From Scratch)

To start the entire platform from zero on a clean machine:

### Step 1: Clone Repository & Setup `.env`
```bash
git clone https://github.com/user/cyber-threat-platform.git
cd cyber-threat-platform/backend
cp .env.example .env
```

### Step 2: Boot Core Infrastructure Containers
```bash
cd ../infra/docker
docker-compose up -d
```
Verify containers are online:
```bash
docker ps
```
Required containers: `ctp-postgres`, `ctp-redis`, `ctp-kafka`, `ctp-elasticsearch`, `ctp-kibana`.

### Step 3: Boot MISP Threat Intelligence Server (Optional)
```bash
cd ../misp-docker
docker-compose up -d
```

### Step 4: Boot SIEM Infrastructure Containers (Splunk & Wazuh)
- **Splunk Enterprise**:
  ```bash
  docker run -d --name ctp-splunk -p 8000:8000 -p 8088:8088 \
    -e "SPLUNK_GENERAL_TERMS=--accept-sgt-current-at-splunk-com" \
    -e "SPLUNK_START_ARGS=--accept-license" \
    -e "SPLUNK_PASSWORD=SplunkPassword123!" splunk/splunk:latest
  ```
- **Wazuh 4.10.0 Manager Cluster**:
  ```bash
  cd ../wazuh-docker/single-node
  docker-compose up -d
  ```

### Step 5: Database Migrations & Prisma Seed
```bash
cd ../../backend
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:seed
```

### Step 6: Start Backend Application API
```bash
pnpm run build
pnpm run start:prod
```
Access points:
- REST API: `http://localhost:3000/api/v1`
- Interactive OpenAPI Docs: `http://localhost:3000/api/docs`

---

## 2. Service Health Check Reference Commands

| Service | Port | Health Check Command |
| :--- | :--- | :--- |
| **Backend API** | `3000` | `curl http://localhost:3000/api/v1/health` |
| **PostgreSQL** | `5432` | `docker exec ctp-postgres pg_isready -U postgres` |
| **Redis** | `6379` | `docker exec ctp-redis redis-cli ping` |
| **Elasticsearch** | `9200` | `curl http://localhost:9200/_cluster/health` |
| **Splunk HEC** | `8088` | `curl -k https://localhost:8088/services/collector/health -H "Authorization: Splunk 11111111-2222-3333-4444-555555555555"` |
| **Wazuh Manager** | `55000` | `curl -k https://localhost:55000/security/user/authenticate -u wazuh-wui:MyS3cr37P450r.*- -X POST` |

---

## 3. Hard-Won Troubleshooting Guides

### 1. Kafka Consumer Rebalance Warning / Startup Block
- **Symptom**: Kafka consumers log `The group is rebalancing, so a rejoin is needed`.
- **Root Cause**: `KAFKA_BROKERS` broker listener takes ~5 seconds to initialize topic partitions.
- **Resolution**: Do not restart backend; KafkaJS auto-rejoins consumer groups within 10 seconds.

### 2. Wazuh Indexer OpenSearch JVM `vm.max_map_count` Exit
- **Symptom**: `wazuh-indexer` exits immediately on boot.
- **Root Cause**: Linux kernel memory map limit is under 262144.
- **Resolution**:
  ```powershell
  wsl -d docker-desktop sysctl -w vm.max_map_count=262144
  ```

### 3. Splunk HEC `read ECONNRESET` Error
- **Symptom**: HEC connection returns ECONNRESET on port 8088.
- **Root Cause**: Splunk HEC input token stanza not enabled in `inputs.conf`.
- **Resolution**:
  ```bash
  docker exec -u 0 ctp-splunk sudo -u splunk /opt/splunk/bin/splunk http-event-collector enable -uri https://localhost:8089 -auth admin:SplunkPassword123!
  ```

### 4. MISP Self-Signed SSL Nginx Loop
- **Symptom**: MISP port 8443 redirects in endless loop.
- **Resolution**: Use HTTP endpoint `http://localhost:8443` or set `MISP_BASE_URL=http://localhost:8443` in `backend/.env`.
