# Clata Folder Structure

```text
src/
  app/                         # Expo Router routes only
  bootstrap/                   # composition root and startup recovery
  features/
    onboarding/
      application/ components/ hooks/ screens/ types/
    packages/ vocabulary/ practice/ dialogues/
    challenges/ progress/ settings/ account/
  domain/
    entities/ value-objects/ services/ ports/ errors/
  data/
    repositories/ dto/ mappers/ query-models/
  infrastructure/
    database/ filesystem/ audio/ crypto/ network/ supabase/
  shared/
    components/ hooks/ utils/ constants/ types/
  assets/
content/packages/               # fixtures and local package sources
tools/content-builder/          # package build, validate, sign, catalog
tests/unit/ integration/ contract/ e2e/ fixtures/ fakes/
docs/adr/
```

## Naming

- React component, screen, class, enum, type: `PascalCase`.
- Hook: `useThing.ts`.
- Function, variable, module: `camelCase`.
- Database table/column and serialized JSON field: `snake_case`.
- TypeScript property: `camelCase`.
- Test: `*.test.ts`, `*.test.tsx`; E2E: `*.e2e.ts`.
- Migration: `NNNN_description.ts`.
- One primary responsibility per file.

## Import boundaries

Feature code MAY import public domain ports and shared UI. It MUST NOT import infrastructure adapters. Cross-feature imports MUST use a documented public API. Relative imports crossing more than two feature boundaries are prohibited; use aliases and public modules.

`src/app/` adalah route boundary Expo Router. `src/bootstrap/` adalah composition root dan startup boundary.

## Public/internal files

`index.ts` exports only stable public contracts. Files named `internal`, `private`, or under `__tests__` are not import targets outside their module.
