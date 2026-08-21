import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema for production deploys with DB_SYNCHRONIZE=false.
 * Safe to run on an empty database. Existing demo DBs created with synchronize
 * should keep using synchronize or be rebuilt once.
 */
export class InitSchema1740000000000 implements MigrationInterface {
  name = 'InitSchema1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "alerts_severity_enum" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "alerts_status_enum" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "uptime_monitors_laststatus_enum" AS ENUM ('UNKNOWN', 'UP', 'DOWN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "uptime_checks_status_enum" AS ENUM ('UNKNOWN', 'UP', 'DOWN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "organization_members_role_enum" AS ENUM ('OWNER', 'MEMBER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "passwordHash" varchar NOT NULL,
        "apiKey" varchar NOT NULL UNIQUE,
        "telegramChatId" varchar NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "apiKey" varchar NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "role" "organization_members_role_enum" NOT NULL DEFAULT 'MEMBER',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_org_member" UNIQUE ("organizationId", "userId"),
        CONSTRAINT "FK_org_member_org" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_member_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_metrics" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NULL,
        "organizationId" uuid NULL,
        "machineName" varchar NOT NULL,
        "cpuUsagePercent" double precision NOT NULL,
        "ramUsagePercent" double precision NOT NULL,
        "ramTotalMb" double precision NOT NULL,
        "ramUsedMb" double precision NOT NULL,
        "disks" jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_metrics_user" ON "system_metrics" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_metrics_org" ON "system_metrics" ("organizationId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alerts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NULL,
        "organizationId" uuid NULL,
        "machineName" varchar NOT NULL,
        "metricName" varchar NOT NULL,
        "currentValue" double precision NOT NULL,
        "thresholdValue" double precision NOT NULL,
        "severity" "alerts_severity_enum" NOT NULL DEFAULT 'WARNING',
        "status" "alerts_status_enum" NOT NULL DEFAULT 'OPEN',
        "message" varchar NOT NULL,
        "acknowledgedAt" TIMESTAMPTZ NULL,
        "resolvedAt" TIMESTAMPTZ NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alerts_user" ON "alerts" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_alerts_org" ON "alerts" ("organizationId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "uptime_monitors" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NULL,
        "organizationId" uuid NULL,
        "name" varchar NOT NULL,
        "url" varchar NOT NULL,
        "intervalSeconds" integer NOT NULL DEFAULT 60,
        "isEnabled" boolean NOT NULL DEFAULT true,
        "lastStatus" "uptime_monitors_laststatus_enum" NOT NULL DEFAULT 'UNKNOWN',
        "lastStatusCode" integer NULL,
        "lastLatencyMs" integer NULL,
        "lastCheckedAt" TIMESTAMPTZ NULL,
        "lastError" text NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_monitors_user" ON "uptime_monitors" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_monitors_org" ON "uptime_monitors" ("organizationId")`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_monitors_org_url"
      ON "uptime_monitors" ("organizationId", "url")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "uptime_checks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "monitorId" uuid NOT NULL,
        "status" "uptime_checks_status_enum" NOT NULL,
        "statusCode" integer NULL,
        "latencyMs" integer NULL,
        "errorMessage" text NULL,
        "checkedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_checks_monitor" FOREIGN KEY ("monitorId") REFERENCES "uptime_monitors"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_checks_monitor" ON "uptime_checks" ("monitorId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "uptime_checks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "uptime_monitors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alerts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "system_metrics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "uptime_checks_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "uptime_monitors_laststatus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alerts_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alerts_severity_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "organization_members_role_enum"`);
  }
}
