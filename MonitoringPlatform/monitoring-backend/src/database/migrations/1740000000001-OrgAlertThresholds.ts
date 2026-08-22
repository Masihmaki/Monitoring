import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrgAlertThresholds1740000000001 implements MigrationInterface {
  name = 'OrgAlertThresholds1740000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "alertCpuThreshold" double precision NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "alertRamThreshold" double precision NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "alertDiskThreshold" double precision NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations" DROP COLUMN IF EXISTS "alertDiskThreshold"
    `);
    await queryRunner.query(`
      ALTER TABLE "organizations" DROP COLUMN IF EXISTS "alertRamThreshold"
    `);
    await queryRunner.query(`
      ALTER TABLE "organizations" DROP COLUMN IF EXISTS "alertCpuThreshold"
    `);
  }
}
