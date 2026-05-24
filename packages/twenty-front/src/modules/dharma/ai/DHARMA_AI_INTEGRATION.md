# Dharma AI — Integration TODO

This module ships two pages and a navigation section but does **not** modify
`AppPath` (`packages/twenty-shared/src/types/AppPath.ts`) or
`useCreateAppRouter.tsx` (`packages/twenty-front/src/modules/app/hooks/`).

Apply the snippets below when wiring routing/navigation.

## Route targets

| Page                 | Path                  | Entry component                                |
| -------------------- | --------------------- | ---------------------------------------------- |
| Suggestion inbox     | `/dharma/ai/inbox`    | `~/pages/dharma/DharmaAiInboxPage`             |
| Memory editor        | `/dharma/ai/memory`   | `~/pages/dharma/DharmaAiMemoryPage`            |

## Router snippet

Add inside the authenticated `<Route element={<DefaultLayout />}>` block of
`useCreateAppRouter.tsx`:

```tsx
import { DharmaAiInboxPage } from '~/pages/dharma/DharmaAiInboxPage';
import { DharmaAiMemoryPage } from '~/pages/dharma/DharmaAiMemoryPage';

<Route path="/dharma/ai/inbox" element={<DharmaAiInboxPage />} />
<Route path="/dharma/ai/memory" element={<DharmaAiMemoryPage />} />
```

If/when `AppPath` is extended, prefer string literals
`DharmaAiInbox = '/dharma/ai/inbox'` and `DharmaAiMemory = '/dharma/ai/memory'`.

## Navigation snippet

Drop `DharmaAiNavItems` inside any navigation drawer (typically
`packages/twenty-front/src/modules/navigation/components/AppNavigationDrawer.tsx`,
near `NavigationDrawerOtherSection`):

```tsx
import { DharmaAiNavItems } from '@/dharma/ai/components/DharmaAiNavItems';

// ...inside the drawer body
<DharmaAiNavItems />
```

The component re-exports the canonical path constants
(`DHARMA_AI_INBOX_PATH`, `DHARMA_AI_MEMORY_PATH`) — reuse them anywhere a
link or comparison is needed.

## Backend dependencies

- REST: `GET/POST /rest/dharma/ai/suggestions[/:id/{accept|reject|dismiss}]`
  (server module `packages/twenty-server/src/modules/dharma/ai/controllers/dharma-ai-suggestions.controller.ts`).
- Custom objects: `dharmaAiMemory`, `dharmaAiSuggestion` must be seeded
  (`npx nx run twenty-server:command -- dharma:seed:schema -w <workspaceId>`).

## Known gaps / follow-ups

- `useDharmaMemory` relies on Twenty's dynamic `useFindManyRecords`/
  `useCreateOneRecord` family. They expect the custom object metadata to be
  loaded — if a workspace has not yet run the schema seeder, the pages will
  render the empty state.
- Memory list ordering uses default (createdAt desc on the server). If we
  want score-desc, pass `orderBy: [{ score: 'DescNullsLast' }]` to
  `useFindManyRecords` once the metadata stabilises.
- `SuggestionDetailDrawer` does not yet link to related records (project /
  person). The REST list endpoint returns the raw `payload` JSONB — add link
  rendering once we settle on the suggestion->record reference shape on the
  backend.
- Cron triggers regenerate suggestions hourly; we do not poll the inbox.
  Consider a refresh button or `useInterval` if a workspace needs near-real-time.
