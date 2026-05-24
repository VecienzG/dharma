import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { DharmaMigrationService } from 'src/modules/dharma/migration/services/dharma-migration.service';
import {
  DharmaMigrationEntity,
  DharmaMigrationOptions,
} from 'src/modules/dharma/migration/types/dharma-migration.types';

const ALL_ENTITIES: DharmaMigrationEntity[] = [
  'company',
  'person',
  'project',
  'income',
  'expense',
];

type ParsedOptions = {
  workspaceId: string;
  sourceUrl: string;
  dryRun: boolean;
  batchSize: number;
  entities: DharmaMigrationEntity[];
  since: Date | null;
};

@Command({
  name: 'dharma:migrate:from-biellecrm',
  description:
    'Migrate BielleCRM v1 data (Contact/ClientOrganization/Project/Accounting) into a Dharma workspace. Idempotent via dharmaLegacyId.',
})
export class DharmaMigrateFromBielleCrmCommand extends CommandRunner {
  private readonly logger = new Logger(DharmaMigrateFromBielleCrmCommand.name);

  constructor(
    private readonly migrationService: DharmaMigrationService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {
    super();
  }

  @Option({
    flags: '-w, --workspace-id <workspaceId>',
    description: 'Target Dharma workspace ID',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  @Option({
    flags: '-s, --source-url <sourceUrl>',
    description:
      'Postgres connection string for source BielleCRM v1 database (Neon)',
    required: true,
  })
  parseSourceUrl(value: string): string {
    return value;
  }

  @Option({
    flags: '--dry-run',
    description: 'Read + map only, no writes',
  })
  parseDryRun(): boolean {
    return true;
  }

  @Option({
    flags: '-b, --batch-size <size>',
    description: 'Batch size for bulk inserts (default 100)',
  })
  parseBatchSize(value: string): number {
    return Number(value);
  }

  @Option({
    flags: '-e, --entities <entities>',
    description:
      'Comma-separated list: company,person,project,income,expense (default: all)',
  })
  parseEntities(value: string): DharmaMigrationEntity[] {
    return value
      .split(',')
      .map((entry) => entry.trim() as DharmaMigrationEntity)
      .filter((entry) => ALL_ENTITIES.includes(entry));
  }

  @Option({
    flags: '--since <iso>',
    description: 'Only migrate rows updatedAt >= ISO date',
  })
  parseSince(value: string): Date {
    return new Date(value);
  }

  async run(_passedParams: string[], parsed: ParsedOptions): Promise<void> {
    const options: DharmaMigrationOptions = {
      workspaceId: parsed.workspaceId,
      sourceUrl: parsed.sourceUrl,
      dryRun: parsed.dryRun ?? false,
      batchSize: parsed.batchSize ?? 100,
      entities:
        parsed.entities && parsed.entities.length > 0
          ? parsed.entities
          : ALL_ENTITIES,
      since: parsed.since ?? null,
    };

    this.logger.log(
      `Starting migration workspace=${options.workspaceId} entities=[${options.entities.join(',')}] dryRun=${options.dryRun} since=${options.since?.toISOString() ?? 'null'}`,
    );

    try {
      const authContext = buildSystemAuthContext(options.workspaceId);
      const stats =
        await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
          () => this.migrationService.run(options),
          authContext,
        );

      for (const stat of stats) {
        this.logger.log(
          `[${stat.entity}] read=${stat.read} inserted=${stat.inserted} updated=${stat.updated} skipped=${stat.skipped} failed=${stat.failed}`,
        );
      }
      this.logger.log('Migration completed.');
    } catch (error) {
      this.logger.error('Migration failed:', error);
      this.logger.error((error as Error).stack);
      process.exit(1);
    }
  }
}
