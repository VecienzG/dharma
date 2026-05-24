import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClerkUserIdToUser1778684039611 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."user" ADD COLUMN "clerkUserId" varchar`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_USER_CLERK_ID" ON "core"."user" ("clerkUserId") WHERE "clerkUserId" IS NOT NULL AND "deletedAt" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "core"."UQ_USER_CLERK_ID"`);
    await queryRunner.query(
      `ALTER TABLE "core"."user" DROP COLUMN "clerkUserId"`,
    );
  }
}
