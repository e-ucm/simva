# Write a test

```bash
npm test                    # whole suite
npm run test:coverage
npx jest src/tests/services/groups/group.service.test.ts
```

`NODE_ENV=test` switches the database to `:memory:` (`config/config.ts`), so tests create no
files. Each test bootstraps its own database and closes it in `afterAll`.

## There are three styles. Pick the one that matches the layer.

### A. Route tests — mock auth and the service

Use when you care that a URL reaches a handler with the right arguments.

```ts
// src/tests/routes/simlets/simlet.routes.test.ts
jest.mock('@/middlewares/auth.middleware', () => ({
  auth: (req: any, _res: any, next: any) => { req.user = { sql: { user_id: 123, username: 'testuser', role: 'teacher' } }; next(); },
  roleAllowed: (_req: any, _res: any, next: any) => next(),
}));
jest.mock('@/services/simlets/simlet.service');

it('passes the user id through', async () => {
  await request(app).get('/simlets').expect(200);
  expect(simletService.getSimletsByUserId).toHaveBeenCalledWith(123, '', undefined, undefined);
});
```

**What this does not test:** the auth middleware and its path matching, because they are the
thing you mocked. Route tests cannot catch "this role is not allowed here" — see
[add-an-endpoint.md](./add-an-endpoint.md) and keep an eye on
[`spec-vs-implementation.md`](../reference/api/spec-vs-implementation.md).

### B. Service tests — mock the mapper

Use when you care about delegation and error propagation.

```ts
jest.mock('@/lib/mappers/group/Group');

it('rejects an unimplemented delete', async () => {
  await expect(groupService.deleteGroup(1, 2)).rejects.toThrow('Function not implemented.');
});
```

### C. Unit tests — mock config and third-party clients

Use for `src/lib`. `LRSclient.test.ts` mocks `@/lib/config`, the tracker library (`xasu-js`), the Kafka client
and the logger, then drives the client directly.

The reason config is mocked is worth knowing: importing the real `@/lib/config` pulls in the
Kafka client, which builds a connection on import.

## Things to mock carefully

| Module | Already mocked in `__mocks__` |
| --- | --- |
| `@keycloak/keycloak-admin-client` | yes, a no-op `KcAdminClient` |
| `keycloak-public-key` | yes, returns `{ fetch: jest.fn() }` |

Everything else is mocked inline per test file.

## Database in tests

```ts
beforeAll(async () => { await db.sequelize.sync({ force: true }); });
afterAll(async () => { await db.sequelize.close(); });
```

`sync({ force: true })` builds the tables from the models, which is **not** the same as the
schema the server uses. A test can pass while the real views would not. When a test depends
on view behaviour, seed the view instead.

## Conventions

- Test files live under `src/tests/` and end in `.test.ts`; `jest.config.cjs` matches
  `**/tests/**/*.test.ts` only.
- `@/` maps to `src/` in both tsconfig and jest.
- Two directories both exist: `src/tests/controllers/` and `src/tests/controlers/`. The
  second is a typo that has been preserved since the rewrite. Put new tests in `controllers/`
  and, if you want, move `controlers/admin/` across.
- `tests/libtests/` covers `src/lib`, `tests/services/` the services, `tests/routes/` the
  routers.

## Coverage

```bash
npm run test:coverage
```

v8 provider, HTML output in `coverage/`.