-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SOC_ANALYST', 'INVESTIGATOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('MISP', 'OTX', 'NVD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IocType" AS ENUM ('IP_ADDRESS', 'DOMAIN', 'HASH_MD5', 'HASH_SHA1', 'HASH_SHA256', 'URL', 'EMAIL', 'FILE_NAME');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "CveSeverity" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SOC_ANALYST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threat_feeds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FeedType" NOT NULL,
    "base_url" TEXT,
    "api_key_env_var" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "fetch_interval_minutes" INTEGER NOT NULL DEFAULT 60,
    "config" JSONB,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "threat_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iocs" (
    "id" TEXT NOT NULL,
    "type" "IocType" NOT NULL,
    "value" TEXT NOT NULL,
    "stix_data" JSONB,
    "confidence_score" INTEGER NOT NULL DEFAULT 50,
    "threat_severity" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feed_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iocs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cves" (
    "id" TEXT NOT NULL,
    "cve_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cvss_v2_score" DOUBLE PRECISION,
    "cvss_v3_score" DOUBLE PRECISION,
    "severity" "CveSeverity" NOT NULL DEFAULT 'NONE',
    "published_at" TIMESTAMP(3) NOT NULL,
    "modified_at" TIMESTAMP(3),
    "references" JSONB,
    "cpe_match" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_sync_logs" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "records_ingested" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "feed_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "threat_feeds_type_idx" ON "threat_feeds"("type");

-- CreateIndex
CREATE INDEX "threat_feeds_enabled_idx" ON "threat_feeds"("enabled");

-- CreateIndex
CREATE INDEX "iocs_value_idx" ON "iocs"("value");

-- CreateIndex
CREATE INDEX "iocs_type_idx" ON "iocs"("type");

-- CreateIndex
CREATE INDEX "iocs_feed_id_idx" ON "iocs"("feed_id");

-- CreateIndex
CREATE INDEX "iocs_confidence_score_idx" ON "iocs"("confidence_score");

-- CreateIndex
CREATE INDEX "iocs_first_seen_at_idx" ON "iocs"("first_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "iocs_type_value_feed_id_key" ON "iocs"("type", "value", "feed_id");

-- CreateIndex
CREATE UNIQUE INDEX "cves_cve_id_key" ON "cves"("cve_id");

-- CreateIndex
CREATE INDEX "cves_cve_id_idx" ON "cves"("cve_id");

-- CreateIndex
CREATE INDEX "cves_severity_idx" ON "cves"("severity");

-- CreateIndex
CREATE INDEX "cves_published_at_idx" ON "cves"("published_at");

-- CreateIndex
CREATE INDEX "cves_cvss_v3_score_idx" ON "cves"("cvss_v3_score");

-- CreateIndex
CREATE INDEX "feed_sync_logs_feed_id_idx" ON "feed_sync_logs"("feed_id");

-- CreateIndex
CREATE INDEX "feed_sync_logs_status_idx" ON "feed_sync_logs"("status");

-- CreateIndex
CREATE INDEX "feed_sync_logs_started_at_idx" ON "feed_sync_logs"("started_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iocs" ADD CONSTRAINT "iocs_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "threat_feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_sync_logs" ADD CONSTRAINT "feed_sync_logs_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "threat_feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
