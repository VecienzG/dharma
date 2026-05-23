import { Injectable, Logger } from '@nestjs/common';

import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';
import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';
import { DHARMA_AI_MEMORY_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-ai-memory.field-seeds';
import { DHARMA_AI_SUGGESTION_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-ai-suggestion.field-seeds';
import { DHARMA_COLLABORATOR_PAYOUT_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-collaborator-payout.field-seeds';
import { DHARMA_COMPANY_EXTENSION_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-company-extension.field-seeds';
import { DHARMA_EXPENSE_ENTRY_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-expense-entry.field-seeds';
import { DHARMA_INCOME_ADVANCE_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-income-advance.field-seeds';
import { DHARMA_INCOME_ENTRY_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-income-entry.field-seeds';
import { DHARMA_PERSON_EXTENSION_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-person-extension.field-seeds';
import { DHARMA_PROJECT_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-project.field-seeds';
import { DHARMA_QUOTE_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-quote.field-seeds';
import { DHARMA_QUOTE_LINE_FIELD_SEEDS } from 'src/modules/dharma/workspace-seeder/seeds/fields/dharma-quote-line.field-seeds';
import { DHARMA_AI_MEMORY_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-ai-memory.object-seed';
import { DHARMA_AI_SUGGESTION_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-ai-suggestion.object-seed';
import { DHARMA_COLLABORATOR_PAYOUT_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-collaborator-payout.object-seed';
import { DHARMA_EXPENSE_ENTRY_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-expense-entry.object-seed';
import { DHARMA_INCOME_ADVANCE_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-income-advance.object-seed';
import { DHARMA_INCOME_ENTRY_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-income-entry.object-seed';
import { DHARMA_PROJECT_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-project.object-seed';
import { DHARMA_QUOTE_LINE_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-quote-line.object-seed';
import { DHARMA_QUOTE_OBJECT_SEED } from 'src/modules/dharma/workspace-seeder/seeds/objects/dharma-quote.object-seed';

type RelationSeed = {
  sourceObjectName: string;
  fieldName: string;
  fieldLabel: string;
  fieldIcon: string;
  targetObjectName: string;
  targetFieldLabel: string;
  targetFieldIcon: string;
};

@Injectable()
export class DharmaWorkspaceSeederService {
  private readonly logger = new Logger(DharmaWorkspaceSeederService.name);

  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  async seedDharmaSchema({
    workspaceId,
  }: {
    workspaceId: string;
  }): Promise<void> {
    this.logger.log('Seeding Dharma custom objects...');

    // 1. Create custom objects (idempotent)
    const customObjects: {
      seed: ObjectMetadataSeed;
      fields: FieldMetadataSeed[];
    }[] = [
      { seed: DHARMA_PROJECT_OBJECT_SEED, fields: DHARMA_PROJECT_FIELD_SEEDS },
      { seed: DHARMA_QUOTE_OBJECT_SEED, fields: DHARMA_QUOTE_FIELD_SEEDS },
      {
        seed: DHARMA_QUOTE_LINE_OBJECT_SEED,
        fields: DHARMA_QUOTE_LINE_FIELD_SEEDS,
      },
      {
        seed: DHARMA_INCOME_ENTRY_OBJECT_SEED,
        fields: DHARMA_INCOME_ENTRY_FIELD_SEEDS,
      },
      {
        seed: DHARMA_EXPENSE_ENTRY_OBJECT_SEED,
        fields: DHARMA_EXPENSE_ENTRY_FIELD_SEEDS,
      },
      {
        seed: DHARMA_COLLABORATOR_PAYOUT_OBJECT_SEED,
        fields: DHARMA_COLLABORATOR_PAYOUT_FIELD_SEEDS,
      },
      {
        seed: DHARMA_INCOME_ADVANCE_OBJECT_SEED,
        fields: DHARMA_INCOME_ADVANCE_FIELD_SEEDS,
      },
      {
        seed: DHARMA_AI_MEMORY_OBJECT_SEED,
        fields: DHARMA_AI_MEMORY_FIELD_SEEDS,
      },
      {
        seed: DHARMA_AI_SUGGESTION_OBJECT_SEED,
        fields: DHARMA_AI_SUGGESTION_FIELD_SEEDS,
      },
    ];

    for (const { seed, fields } of customObjects) {
      await this.ensureObjectExists({ workspaceId, seed, fields });
    }

    // 2. Extend standard objects (idempotent)
    await this.ensureFieldsExist({
      workspaceId,
      objectNameSingular: 'person',
      fieldSeeds: DHARMA_PERSON_EXTENSION_FIELD_SEEDS,
    });

    await this.ensureFieldsExist({
      workspaceId,
      objectNameSingular: 'company',
      fieldSeeds: DHARMA_COMPANY_EXTENSION_FIELD_SEEDS,
    });

    // 3. Create relations between Dharma objects
    const relations: RelationSeed[] = [
      // company → projects (ONE_TO_MANY creates MANY_TO_ONE inverse on project)
      {
        sourceObjectName: 'company',
        fieldName: 'dharmaProjects',
        fieldLabel: 'Projects',
        fieldIcon: 'IconBriefcase',
        targetObjectName: DHARMA_PROJECT_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Client',
        targetFieldIcon: 'IconBuildingSkyscraper',
      },
      // project → quotes
      {
        sourceObjectName: DHARMA_PROJECT_OBJECT_SEED.nameSingular,
        fieldName: 'quotes',
        fieldLabel: 'Quotes',
        fieldIcon: 'IconFileInvoice',
        targetObjectName: DHARMA_QUOTE_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Project',
        targetFieldIcon: 'IconBriefcase',
      },
      // quote → lines
      {
        sourceObjectName: DHARMA_QUOTE_OBJECT_SEED.nameSingular,
        fieldName: 'lines',
        fieldLabel: 'Lines',
        fieldIcon: 'IconListDetails',
        targetObjectName: DHARMA_QUOTE_LINE_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Quote',
        targetFieldIcon: 'IconFileInvoice',
      },
      // project → income entries
      {
        sourceObjectName: DHARMA_PROJECT_OBJECT_SEED.nameSingular,
        fieldName: 'incomeEntries',
        fieldLabel: 'Income',
        fieldIcon: 'IconCurrencyEuro',
        targetObjectName: DHARMA_INCOME_ENTRY_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Project',
        targetFieldIcon: 'IconBriefcase',
      },
      // project → expense entries
      {
        sourceObjectName: DHARMA_PROJECT_OBJECT_SEED.nameSingular,
        fieldName: 'expenseEntries',
        fieldLabel: 'Expenses',
        fieldIcon: 'IconReceipt',
        targetObjectName: DHARMA_EXPENSE_ENTRY_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Project',
        targetFieldIcon: 'IconBriefcase',
      },
      // company → income entries (for direct client billing not tied to project)
      {
        sourceObjectName: 'company',
        fieldName: 'dharmaIncomeEntries',
        fieldLabel: 'Income Entries',
        fieldIcon: 'IconCurrencyEuro',
        targetObjectName: DHARMA_INCOME_ENTRY_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Client',
        targetFieldIcon: 'IconBuildingSkyscraper',
      },
      // person (collaborator) → payouts
      {
        sourceObjectName: 'person',
        fieldName: 'dharmaCollaboratorPayouts',
        fieldLabel: 'Payouts',
        fieldIcon: 'IconMoneybag',
        targetObjectName: DHARMA_COLLABORATOR_PAYOUT_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Collaborator',
        targetFieldIcon: 'IconUser',
      },
      // project → collaborator payouts
      {
        sourceObjectName: DHARMA_PROJECT_OBJECT_SEED.nameSingular,
        fieldName: 'collaboratorPayouts',
        fieldLabel: 'Collaborator Payouts',
        fieldIcon: 'IconMoneybag',
        targetObjectName: DHARMA_COLLABORATOR_PAYOUT_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Project',
        targetFieldIcon: 'IconBriefcase',
      },
      // income entry → advances drawn against it
      {
        sourceObjectName: DHARMA_INCOME_ENTRY_OBJECT_SEED.nameSingular,
        fieldName: 'advances',
        fieldLabel: 'Advances',
        fieldIcon: 'IconArrowUpRight',
        targetObjectName: DHARMA_INCOME_ADVANCE_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Income Entry',
        targetFieldIcon: 'IconCurrencyEuro',
      },
      // person → income advances received
      {
        sourceObjectName: 'person',
        fieldName: 'dharmaIncomeAdvances',
        fieldLabel: 'Income Advances',
        fieldIcon: 'IconArrowUpRight',
        targetObjectName: DHARMA_INCOME_ADVANCE_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Recipient',
        targetFieldIcon: 'IconUser',
      },
      // project → ai suggestions
      {
        sourceObjectName: DHARMA_PROJECT_OBJECT_SEED.nameSingular,
        fieldName: 'aiSuggestions',
        fieldLabel: 'AI Suggestions',
        fieldIcon: 'IconBulb',
        targetObjectName: DHARMA_AI_SUGGESTION_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Project',
        targetFieldIcon: 'IconBriefcase',
      },
      // person → ai suggestions
      {
        sourceObjectName: 'person',
        fieldName: 'dharmaAiSuggestions',
        fieldLabel: 'AI Suggestions',
        fieldIcon: 'IconBulb',
        targetObjectName: DHARMA_AI_SUGGESTION_OBJECT_SEED.nameSingular,
        targetFieldLabel: 'Person',
        targetFieldIcon: 'IconUser',
      },
    ];

    await this.ensureRelationsExist({ workspaceId, relations });

    this.logger.log('Dharma schema seeding complete.');
  }

  private async ensureObjectExists({
    workspaceId,
    seed,
    fields,
  }: {
    workspaceId: string;
    seed: ObjectMetadataSeed;
    fields: FieldMetadataSeed[];
  }): Promise<void> {
    const existing = await this.objectMetadataService.findOneWithinWorkspace(
      workspaceId,
      { where: { nameSingular: seed.nameSingular } },
    );

    if (isDefined(existing)) {
      this.logger.log(
        `Object "${seed.nameSingular}" already exists, skipping.`,
      );

      return;
    }

    this.logger.log(`Creating object "${seed.nameSingular}"...`);

    await this.objectMetadataService.createOneObject({
      createObjectInput: seed,
      workspaceId,
    });

    await this.ensureFieldsExist({
      workspaceId,
      objectNameSingular: seed.nameSingular,
      fieldSeeds: fields,
    });
  }

  private async ensureFieldsExist({
    workspaceId,
    objectNameSingular,
    fieldSeeds,
  }: {
    workspaceId: string;
    objectNameSingular: string;
    fieldSeeds: FieldMetadataSeed[];
  }): Promise<void> {
    const objectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { nameSingular: objectNameSingular },
      });

    if (!isDefined(objectMetadata)) {
      throw new Error(`Object metadata not found for: ${objectNameSingular}`);
    }

    // Get existing field names to skip duplicates
    const { flatFieldMetadataMaps, flatObjectMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const { idByNameSingular } = buildObjectIdByNameMaps(
      flatObjectMetadataMaps,
    );
    const objectId = idByNameSingular[objectNameSingular];
    const objectFlatMetadata = isDefined(objectId)
      ? findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: objectId,
          flatEntityMaps: flatObjectMetadataMaps,
        })
      : undefined;

    const existingFieldNames = new Set<string>();

    if (isDefined(objectFlatMetadata)) {
      for (const fieldId of objectFlatMetadata.fieldIds) {
        const field = findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: fieldId,
          flatEntityMaps: flatFieldMetadataMaps,
        });

        if (isDefined(field)) {
          existingFieldNames.add(field.name);
        }
      }
    }

    const newFieldSeeds = fieldSeeds.filter(
      (seed) => !existingFieldNames.has(seed.name),
    );

    if (newFieldSeeds.length === 0) {
      return;
    }

    const createFieldInputs = newFieldSeeds.map((seed) => ({
      ...seed,
      objectMetadataId: objectMetadata.id,
    }));

    await this.fieldMetadataService.createManyFields({
      createFieldInputs,
      workspaceId,
    });

    this.logger.log(
      `Added ${newFieldSeeds.length} fields to "${objectNameSingular}".`,
    );
  }

  private async ensureRelationsExist({
    workspaceId,
    relations,
  }: {
    workspaceId: string;
    relations: RelationSeed[];
  }): Promise<void> {
    await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
      workspaceId,
      flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
    });

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const { idByNameSingular } = buildObjectIdByNameMaps(
      flatObjectMetadataMaps,
    );

    for (const relation of relations) {
      const sourceObjectId = idByNameSingular[relation.sourceObjectName];
      const targetObjectId = idByNameSingular[relation.targetObjectName];

      if (!isDefined(sourceObjectId) || !isDefined(targetObjectId)) {
        this.logger.warn(
          `Skipping relation "${relation.sourceObjectName} → ${relation.targetObjectName}": object not found.`,
        );
        continue;
      }

      // Check if field already exists on source object
      const sourceObjectFlatMetadata = findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: sourceObjectId,
        flatEntityMaps: flatObjectMetadataMaps,
      });

      const fieldAlreadyExists =
        isDefined(sourceObjectFlatMetadata) &&
        sourceObjectFlatMetadata.fieldIds.some((fieldId) => {
          const field = findFlatEntityByIdInFlatEntityMaps({
            flatEntityId: fieldId,
            flatEntityMaps: flatFieldMetadataMaps,
          });

          return field?.name === relation.fieldName;
        });

      if (fieldAlreadyExists) {
        this.logger.log(
          `Relation "${relation.sourceObjectName}.${relation.fieldName}" already exists, skipping.`,
        );
        continue;
      }

      const sourceObjectMetadata =
        await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
          where: { nameSingular: relation.sourceObjectName },
        });

      if (!isDefined(sourceObjectMetadata)) {
        this.logger.warn(
          `Source object "${relation.sourceObjectName}" not found, skipping relation.`,
        );
        continue;
      }

      this.logger.log(
        `Creating relation "${relation.sourceObjectName}.${relation.fieldName} → ${relation.targetObjectName}"...`,
      );

      await this.fieldMetadataService.createManyFields({
        createFieldInputs: [
          {
            type: FieldMetadataType.RELATION,
            name: relation.fieldName,
            label: relation.fieldLabel,
            icon: relation.fieldIcon,
            objectMetadataId: sourceObjectMetadata.id,
            relationCreationPayload: {
              type: RelationType.ONE_TO_MANY,
              targetFieldLabel: relation.targetFieldLabel,
              targetFieldIcon: relation.targetFieldIcon,
              targetObjectMetadataId: targetObjectId,
            },
          },
        ],
        workspaceId,
      });
    }
  }
}
