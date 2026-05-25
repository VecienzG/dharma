import { type QueryRunner } from 'typeorm';
import { uuidToBase36 } from 'twenty-shared/utils';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

// Adds a nullable `dueAt` DATE_TIME field to the dharmaExpenseEntry custom object
// across every workspace that already has this object. The frontend
// PaymentsDueWidget needs this field to filter expenses by due date.
//
// This command operates in two parts per affected workspace:
//   1. Insert the field metadata row into core."fieldMetadata".
//   2. Add the corresponding "dueAt" column to the workspace's
//      _dharmaExpenseEntry table.
//
// New workspaces will pick the field up via the dharma workspace seeder
// (see DHARMA_EXPENSE_ENTRY_FIELD_SEEDS), so this command only backfills
// existing workspaces.

@RegisteredInstanceCommand('2.5.0', 1779700000000)
export class AddDharmaExpenseDueAtFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const objects: Array<{
      id: string;
      workspaceId: string;
      applicationId: string;
    }> = await queryRunner.query(
      `SELECT DISTINCT om."id", om."workspaceId", fm."applicationId"
       FROM "core"."objectMetadata" om
       JOIN "core"."fieldMetadata" fm ON fm."objectMetadataId" = om."id"
       WHERE om."nameSingular" = 'dharmaExpenseEntry'`,
    );

    for (const {
      id: objectMetadataId,
      workspaceId,
      applicationId,
    } of objects) {
      const existing: Array<{ id: string }> = await queryRunner.query(
        `SELECT "id" FROM "core"."fieldMetadata"
         WHERE "objectMetadataId" = $1 AND "name" = 'dueAt'`,
        [objectMetadataId],
      );

      if (existing.length === 0) {
        await queryRunner.query(
          `INSERT INTO "core"."fieldMetadata"
            ("id", "objectMetadataId", "workspaceId", "applicationId",
             "type", "name", "label", "icon",
             "isCustom", "isActive", "isSystem", "isUIReadOnly",
             "isNullable", "isLabelSyncedWithName",
             "universalIdentifier",
             "createdAt", "updatedAt")
           VALUES
            (uuid_generate_v4(), $1, $2, $3,
             'DATE_TIME', 'dueAt', 'Due At', 'IconCalendarDue',
             true, true, false, false,
             true, false,
             uuid_generate_v4(),
             now(), now())`,
          [objectMetadataId, workspaceId, applicationId],
        );
      }

      const schemaName = `workspace_${uuidToBase36(workspaceId)}`;

      await queryRunner.query(
        `ALTER TABLE "${schemaName}"."_dharmaExpenseEntry"
         ADD COLUMN IF NOT EXISTS "dueAt" timestamp with time zone`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const objects: Array<{ id: string; workspaceId: string }> =
      await queryRunner.query(
        `SELECT DISTINCT "id", "workspaceId"
         FROM "core"."objectMetadata"
         WHERE "nameSingular" = 'dharmaExpenseEntry'`,
      );

    for (const { id: objectMetadataId, workspaceId } of objects) {
      const schemaName = `workspace_${uuidToBase36(workspaceId)}`;

      await queryRunner.query(
        `ALTER TABLE "${schemaName}"."_dharmaExpenseEntry"
         DROP COLUMN IF EXISTS "dueAt"`,
      );

      await queryRunner.query(
        `DELETE FROM "core"."fieldMetadata"
         WHERE "objectMetadataId" = $1 AND "name" = 'dueAt'`,
        [objectMetadataId],
      );
    }
  }
}
