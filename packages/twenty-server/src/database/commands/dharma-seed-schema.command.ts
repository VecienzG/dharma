import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { DharmaWorkspaceSeederService } from 'src/modules/dharma/workspace-seeder/dharma-workspace-seeder.service';

type DharmaSeedSchemaOptions = {
  workspaceId: string;
};

@Command({
  name: 'dharma:seed:schema',
  description:
    'Seed Dharma custom objects and fields into a workspace. Idempotent — safe to run multiple times.',
})
export class DharmaSeedSchemaCommand extends CommandRunner {
  private readonly logger = new Logger(DharmaSeedSchemaCommand.name);

  constructor(
    private readonly dharmaWorkspaceSeederService: DharmaWorkspaceSeederService,
  ) {
    super();
  }

  @Option({
    flags: '-w, --workspace-id <workspaceId>',
    description: 'Target workspace ID',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  async run(
    _passedParams: string[],
    options: DharmaSeedSchemaOptions,
  ): Promise<void> {
    try {
      await this.dharmaWorkspaceSeederService.seedDharmaSchema({
        workspaceId: options.workspaceId,
      });
    } catch (error) {
      this.logger.error('Dharma schema seeding failed:', error);
      this.logger.error(error.stack);
      process.exit(1);
    }
  }
}
