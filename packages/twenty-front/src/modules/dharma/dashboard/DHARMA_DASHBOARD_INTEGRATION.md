# Dharma Dashboard — router & navigation integration

The dashboard ships fully decoupled from the AppRouter. To wire it in:

## 1. Add the path to the `AppPath` enum

`packages/twenty-shared/src/types/AppPath.ts` — under the `// Onboarded` block:

```ts
  DharmaDashboard = '/dharma/dashboard',
```

## 2. Register the route in `useCreateAppRouter`

`packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx` — add a lazy import near the others and a `<Route>` inside the `<DefaultLayout>` block:

```tsx
const DharmaDashboardPage = lazy(() =>
  import('~/pages/dharma/DharmaDashboardPage').then((module) => ({
    default: module.DharmaDashboardPage,
  })),
);

// ...inside the DefaultLayout children:
<Route
  path={AppPath.DharmaDashboard}
  element={
    <LazyRoute>
      <DharmaDashboardPage />
    </LazyRoute>
  }
/>;
```

## 3. Mount the navigation entry

In whichever navigation section you want it (e.g. `MainNavigationDrawerNavigationContent`), render:

```tsx
import { DharmaDashboardNavItem } from '@/dharma/dashboard/components/DharmaDashboardNavItem';

<DharmaDashboardNavItem />;
```

After step 1, you can also update `DharmaDashboardNavItem.tsx` to use `AppPath.DharmaDashboard` instead of the hardcoded string.
