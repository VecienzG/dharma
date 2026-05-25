# Dharma Workspace Bootstrap

When a new Twenty workspace is activated, Dharma's custom objects, fields, and
relations (project, quote, expense, payout, AI memory, notifications, etc.) are
**not** seeded automatically. The operator must run a one-shot command per
workspace before users can use the Dharma views (dashboard, finance, AI).

## Required step (per workspace)

After a workspace is activated (`activateWorkspace` GraphQL mutation completes,
or first user signs in and the workspace status flips to `ACTIVE`), run:

```bash
npx nx run twenty-server:command -- dharma:seed:schema -w <workspaceId>
```

The command is **idempotent** — existing objects, fields, and relations are
detected and skipped, so it is safe (and recommended) to re-run after any
upgrade that introduces new Dharma seeds.

To find the workspace id, either:

- Use the workspace settings UI (URL contains the workspace id), or
- Query Postgres core schema:
  `select id, "displayName", "activationStatus" from core."workspace";`

## What it seeds

`DharmaWorkspaceSeederService.seedDharmaSchema` creates (idempotent):

1. **Custom objects** — `dharmaProject`, `dharmaQuote`, `dharmaQuoteLine`,
   `dharmaIncomeEntry`, `dharmaExpenseEntry`, `dharmaCollaboratorPayout`,
   `dharmaIncomeAdvance`, `dharmaAiMemory`, `dharmaAiSuggestion`,
   `dharmaNotification`, `dharmaNotificationPreference`,
   `dharmaCalendarConnection`.
2. **Field extensions** — adds Dharma fields to standard `person`, `company`,
   `attachment` objects.
3. **Relations** — wires company/project/person/workspaceMember to the new
   Dharma objects.

## Follow-up commands

After seeding the schema, on existing data:

```bash
# Recompute cassetti splits for legacy income entries
npx nx run twenty-server:command -- dharma:finance:recompute-splits -w <workspaceId>
```

## Why not automatic?

Wiring the seeder into `WorkspaceService.activateWorkspace` requires importing
`DharmaWorkspaceSeederModule` (with `ObjectMetadataModule`,
`FieldMetadataModule`, flat-entity caches) into `WorkspaceModule`, which risks
circular dependencies in the engine module graph. Until an event-based hook
(`WorkspaceActivatedEvent`) is added to Twenty core, manual invocation is the
supported path.

Tracked in Phase 7.1 gap 4. Revisit when Twenty exposes a workspace lifecycle
event we can subscribe to from `src/modules/dharma`.
