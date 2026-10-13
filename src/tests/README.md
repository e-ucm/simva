# SIMVA Test Suite

Tests live under `src/tests/` and are executed with Jest (ts-jest, ESM mode). The
suite is 22 test files / ~179 tests covering controllers, services, lib utilities,
routes, and the server health endpoint.

## Running the tests

```bash
npm test                       # run the whole suite
npm run test:coverage          # run with coverage report
NODE_ENV=test NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand <file>   # a single file
```

Note: the project runs as ES modules, so Jest must use the VM modules runtime
(`--experimental-vm-modules`). This is already set in the `test` scripts in
`package.json`.

On the host, `sqlite3` is a native module and its prebuilt binary can target the
wrong libc (e.g. musl inside an Alpine container). Fix it with:

```bash
npm run rebuild-sqlite        # npm rebuild sqlite3
```

The `test` and `dev`/`start` scripts already run this before starting.

## Directory layout

```
src/tests/
├── controlers/            # controller unit tests (legacy typo, kept as-is)
│   └── admin/adminLRS.controler.test.ts
├── controllers/           # controller unit tests
│   ├── simlets/simlet.controller.test.ts
│   └── user.controller.test.ts
├── services/              # service unit tests
│   ├── activities/activities.service.test.ts
│   ├── admin/adminLRS.service.test.ts
│   ├── groups/group.service.test.ts
│   ├── simlets/simlet.service.test.ts
│   └── users/user.service.test.ts
├── libtests/              # internal libs (mappers, db, logger, LRS, LimeSurvey, Keycloak…)
├── routes/                # endpoint-level (supertest against the Express app)
│   ├── groups.test.ts
│   ├── users.test.ts
│   └── simlets/simlet.routes.test.ts
├── server/                # process-level tests
│   └── health.test.ts
└── __mocks__/             # module mocks (CJS, loaded via jest.config.cjs)
    ├── keycloak-admin-client.cjs
    ├── keycloak-admin-auth.cjs
    └── keycloak-public-key.cjs
```

Files are auto-discovered with `testMatch: ["**/tests/**/*.test.ts"]` and
`roots: ["<rootDir>/src"]` (see `jest.config.cjs`).

## Mocking with `jest.unstable_mockModule`

Jest 30 ignores `jest.mock(factory)` under the native ESM runtime, which is how a
large part of the suite historically "passed" the mock but silently used real
dependencies (and then failed). All mock-based tests now use
`jest.unstable_mockModule` + dynamic `import()`.

The rules:

1. Call `jest.unstable_mockModule('<module-id>', factory)` **at the top of the test
   file**, before any `import`/`await import` of the mocked module or of anything
   that imports it.
2. **Never statically import** a mocked module or a module that imports one —
   static imports are hoisted and evaluated before the mock is registered. Import
   them dynamically inside `beforeAll`:

```ts
import { jest, beforeAll, describe, it, expect } from '@jest/globals';

jest.unstable_mockModule('@/services/groups/group.service', () => ({
  getGroups: jest.fn(),
  getAdminGroups: jest.fn()
}));

let app: Express;
let mockedAdminGroups: jest.Mock;

beforeAll(async () => {
  app = (await import('@/app')).app;
  const groupService = await import('@/services/groups/group.service');
  mockedAdminGroups = groupService.getAdminGroups as unknown as jest.Mock;
});
```

Extra rules picked up while migrating:

- **CJS default imports**: if the mocked module is imported as a default (e.g.
  `import BloomFilters from 'bloom-filters'`), the factory must return a `default`
  key too.
- **Mock ids must exist**: `unstable_mockModule` resolves the mock id, so the id
  must match the real import specifier exactly (e.g. `@/lib/utils/LRSclient`
  imports `xasu-js`, not `js-tracker`).
- Modules that import a mocked module in their own import graph must also be
  imported dynamically; otherwise the real module graph is loaded.

Rewriting a stale test is only half the work: the test data must still match the
**current** controllers/services signatures (call arguments changed over time), so
check the real `src/controlers/…` and `src/services/…` before editing.

## Route tests (supertest against `@/app`)

`groups.test.ts`, `users.test.ts` and `simlets/simlet.routes.test.ts` boot the whole
Express app (`@/app`), so every route/controller gets loaded. They mock only two
modules:

- `@/middlewares/auth.middleware` — replaces `auth` and `roleAllowed` so every test
  runs authenticated; set `req.user.sql`/`req.user.data` in the mock. Choose the
  `sql.role` carefully: the groups controller switches on `"administrator"`, the
  users controller checks `role !== "admin"`, and simlets use `getAccess()` with
  `"teacher"` for non-admin/non-allocated users.
- the service under test (e.g. `@/services/groups/group.service`), as an object of
  `jest.fn()`s.

`db.sequelize.sync()` is **not** needed: with the service mocked, controllers never
touch the database. The real app chain (db, kafkajs client, config…) still loads —
the KafkaJS partitioner warning in the console is expected and harmless.

### OpenAPI validator constraints

`@/app` mounts `express-openapi-validator` with both `validateRequests` and
`validateResponses` enabled against `api.yaml`. This imposes real constraints on the
route tests:

- Response bodies must validate against the OpenAPI schemas. Because controllers
  emit mappers via `res.json(x.toJSON())` / `res.json(xs.map(x => x.toJSON()))`,
  mocked service results must expose a `toJSON()` returning a schema-valid object:
  - `groupMapper` requires `simlet_id, group_id, group_name, group_use_new_generation,
    group_allocator_type, group_sandbox, group_owner_user_id, group_owner_username,
    createdAt, updatedAt, participants, allocations`
  - `userMapper` requires `user_id, username, isToken, token, email, role, createdAt,
    updatedAt`; `role` must be one of the enum values (`administrator`, `teacher`,
    `student`, `lrsmanager`, …), not `"admin"`.
  - `simletMapper` accepts `noTypeSimletMapper`, which requires `simlet_id,
    simlet_name, simlet_description, simlet_archived, createdAt, updatedAt, sessions,
    groups, tags` (`sessions`/`groups`/`tags` may be empty arrays).
- Query parameters are validated against the spec:
  - pagination uses `skip` and `limit` (**not** `offset`); `limit` must be `0..50`
    and `skip`/`limit` must be non-negative.
  - `searchString`, `searchTags`, `status`, `orderBy`, `order`, `use_new_generation`
    are optional.
  - unknown query parameters are rejected (`400`).
- `GET /users` used to declare `username` as a *required* query parameter, which made
  the documented list-all-users endpoint unreachable. `api.yaml` was fixed to make it
  optional; keep it optional if you need both `GET /users` (list) and
  `GET /users?username=x` (single user).

### Current endpoint behaviors covered

- `groups.test.ts` — `GET /groups` only (the router now exposes just that endpoint):
  admin listing, `limit`/`skip`/`searchString`/`use_new_generation` forwarding
  (admin path calls `getAdminGroups(version, searchString, limit, offset)`), and
  error propagation. When no params are given the controller computes `offset` as
  `NaN`, so assertions use `NaN`.
- `users.test.ts` — `GET /users` (list, `?username=x`, search/pagination), `PATCH
  /users/:username` (updates the authenticated user, so the service is called with
  the auth user id), `GET /users/me` (success, 404, 500).
- `simlets/simlet.routes.test.ts` — with a `teacher` user: `GET /simlets`
  (`getSimletsByUserId(123, undefined, undefined, undefined, undefined, NaN,
  undefined, undefined)`), `GET /simlets/:simlet_id`
  (`getSimletBySimletIdAndUserId(id, false, 123)`), `POST /simlets`
  (`createSimlet(body, false, 123)` — body **must** include both `simlet_name` and
  `simlet_description` for request validation), `PATCH /simlets/:simlet_id`
  (`patch(id, body, false, 123)`), `DELETE /simlets/:simlet_id`
  (`deleteSimlet(id, false, 123)`, `204`), and error propagation (404).
- `server/health.test.ts` — `GET /health` returns `{ status: true, db: { status:
  true } }` against the in-memory SQLite database.

## Gotchas summary

- Static imports of mocked-graph modules silently break the mocks — always use
  dynamic imports there.
- Keep `jest.clearAllMocks()` in `beforeEach`; implementations set with
  `mockResolvedValue`/`mockRejectedValue` are set inside each `it`.
- The `controlers/` directory is a legacy typo (`controler` vs `controller`) that is
  referenced by the route files and is intentionally left as-is.
- mock responses for route tests must be `toJSON()`-enabled objects that satisfy the
  OpenAPI schemas, not raw rows.