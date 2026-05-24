# Dharma Finance — Integration TODO

Questo modulo fornisce la vista Finance per Dharma CRM (cassetti Tasse / Beautiful
Life / Personale, KPI mese, lista entrate, drawer override split, payout
collaboratori, breakdown uscite per categoria).

## Target route

- Path: `/dharma/finance`
- Page component: `@/pages/dharma/DharmaFinancePage` (named export
  `DharmaFinancePage`)
- Layout: usa `DefaultLayout` (riempito tramite `SubMenuTopBarContainer`
  internamente) — quindi va registrato come figlio del Route con
  `element={<DefaultLayout />}` come gli altri di `useCreateAppRouter`.

## Snippet route da aggiungere

Da inserire dentro `<Route element={<DefaultLayout />}>` in
`packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`, accanto
agli altri `RecordIndexPage` / `PageLayoutPage`:

```tsx
const DharmaFinancePage = lazy(() =>
  import('~/pages/dharma/DharmaFinancePage').then((module) => ({
    default: module.DharmaFinancePage,
  })),
);

// ...inside <Route element={<DefaultLayout />}>...
<Route
  path="/dharma/finance"
  element={
    <LazyRoute>
      <DharmaFinancePage />
    </LazyRoute>
  }
/>;
```

Non sono state modificate `AppPath.ts` (in `twenty-shared`) né
`useCreateAppRouter.tsx`: il path Dharma è custom e non rientra nel pattern
`RecordIndexPage`. Se in futuro lo si vuole tipizzare, aggiungere
`DharmaFinance = '/dharma/finance'` all'enum `AppPath`.

## Nav item

`DharmaFinanceNavItem.tsx` esporta un componente che renderizza un
`NavigationDrawerItem` etichettato “Finance” con icona `IconCoins`. Va
incluso nel drawer principale: il punto di iniezione consigliato è
`MainNavigationDrawerNavigationContent.tsx` (o un nuovo
`NavigationDrawerOtherSection` dedicato a Dharma).

```tsx
import { DharmaFinanceNavItem } from '@/dharma/finance/components/DharmaFinanceNavItem';

// inside the section that lists workspace items
<DharmaFinanceNavItem />;
```

## GraphQL

Tutte le query usano `useFindManyRecords` (Twenty pattern standard) per:

- `dharmaIncomeEntry` filtrato per `receivedAt` mese corrente / precedente
- `dharmaExpenseEntry` filtrato per `paidAt` mese corrente / precedente
- `dharmaCollaboratorPayout` filtrato per `status = PENDING`

Mutation custom (definita inline con `gql`, non aggiunta a
`graphql/mutations/`):

- `updateDharmaIncomeEntry(id, data: { splitConfig })` — usata dal drawer per
  override split
- `updateDharmaCollaboratorPayout(id, data: { status, paidAt })` — usata dal
  widget payout per “mark as paid”

Entrambe sfruttano i resolver auto-generati dal metadata layer di Twenty.

## Gap backend rilevati (da verificare)

1. **Auto-recompute split**: `updateDharmaIncomeEntry` con nuovo `splitConfig`
   non riallinea i campi calcolati (`taxAmount`, `beautifulLifeAmount`,
   `personalAmount`). Il drawer mostra la preview lato UI, ma il backend
   deve esporre un trigger / hook che ri-esegue `DharmaSplitEngineService.computeSplit`
   alla update del `splitConfig`. Ad oggi esiste solo
   `dharma:finance:recompute-splits` come CLI batch.
2. **Relazione `dharmaCollaboratorPayout` → `person`**: il seed corrente non
   include una relazione verso `person`. Il widget mostra `name`/`notes` come
   fallback. Da aggiungere come field RELATION (target `person`) per poter
   mostrare nome collaboratore reale e filtrare per persona.
3. **Aggregazione fee da task**: lo scope iniziale citava “fee accumulata da
   task” calcolata dal frontend. Il modello backend non espone (ancora) un
   rollup `pendingFee` su `person`. Implementazione corrente: si legge
   direttamente da `dharmaCollaboratorPayout` (PENDING). Quando il rollup sarà
   disponibile, sostituire `useFindManyRecords('dharmaCollaboratorPayout')`
   con una query su `person` filtrata `dharmaEntityType = COLLABORATOR`.
4. **GraphQL mutation typing**: le mutation custom usano `gql` inline. Per
   tipi forti rigenerare con `npx nx run twenty-front:graphql:generate`
   aggiungendo i file `.graphql` corrispondenti.
