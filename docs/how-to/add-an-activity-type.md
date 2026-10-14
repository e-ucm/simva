# Add an activity type

Activity types are the extension point of the domain. Everything polymorphic about
activities — the extra request fields, the target URL, the tracker config, the result storage,
how traces are interpreted — comes from the type.

```bash
export SIMVA_URL=https://simva.example.edu
```

## 1. See what exists today

```bash
curl -s "$SIMVA_URL/activitytypes" -H "Authorization: Bearer $TOKEN" | jq
```

```json
[
  { "activity_type": "gameplay",    "activity_name": "GamePlay Activity",    "activity_utils": { ... } },
  { "activity_type": "limesurvey", "activity_name": "LimeSurvey Activity", "activity_utils": { ... } },
  { "activity_type": "manual",     "activity_name": "Manual Activity",     "activity_utils": { ... } }
]
```

`activity_utils` is built by the type itself, so a new type can advertise whatever it needs
(the LimeSurvey type adds its survey URL and administration links).

## 2. Extend the base class

```ts
// src/lib/mappers/activities/QuizActivity.ts
import { Activity } from './Activity';

export class QuizActivity extends Activity {
  public quiz_id: number | null = null;
  public quiz_language: string = '';

  constructor(quiz_id: number | null = null, quiz_language = '') {
    super();
    this.activity_type = 'quiz';
    this.quiz_id = quiz_id;
    this.quiz_language = quiz_language;
  }

  getType(): string {
    return 'quiz';
  }

  static getFromDbData(activity_id: number, rawquiz: number | null, rawlanguage: string): QuizActivity {
    if (rawquiz === null || rawquiz === undefined) {
      throw new NotFoundError('Quiz activity has no quiz attached');
    }
    return new QuizActivity(rawquiz, rawlanguage);
  }

  async canBeOpened(): Promise<boolean> {
    return !!this.quiz_id;
  }

  async target(): Promise<string> {
    return `${process.env.QUIZ_URL}/quiz/${this.quiz_id}?lang=${this.quiz_language}`;
  }
}
```

The contract a subclass must honour:

| Member | Why it exists |
| --- | --- |
| `getType()` | the discriminator stored in `Activities.activity_type` |
| `static getFromDbData(...)` | rebuilds the object from a database row |
| `canBeOpened()` | decides whether `GET /activities/{id}/openable` is true |
| `target()` | the per-participant URL `GET /activities/{id}/target` returns |
| `getUtils()` | extra fields advertised on `GET /activitytypes` |

## 3. Register it in the factory

```ts
// src/lib/mappers/activities/ActivityToClass.ts
import { QuizActivity } from './QuizActivity';

export function createActivityFromType(dbRow: any): Activity {
  switch (dbRow.activity_type) {
    case 'gameplay':    return GamePlayActivity.getFromDbData(...);
    case 'limesurvey':  return LimesurveyActivity.getFromDbData(...);
    case 'manual':      return ManualActivity.getFromDbData(...);
    case 'quiz':        return QuizActivity.getFromDbData(dbRow.activity_id, dbRow.quiz_id, dbRow.quiz_language);
    default:
      logger.warn(`Unknown activity type ${dbRow.activity_type}, falling back to Activity`);
      return new Activity(dbRow.activity_id);
  }
}
```

Also add the type to `ActivityType.getAll()` so `GET /activitytypes` lists it.

## 4. Add the table and the model

```sql
-- migrate/sqlite/01-schemas.sql
CREATE TABLE IF NOT EXISTS Quiz_Activities (
  activity_id INTEGER PRIMARY KEY,
  quiz_id     INTEGER,
  quiz_language TEXT
);
```

```ts
// src/lib/models/activities/quizActivity.model.ts
export const QuizActivities = (sequelize: Sequelize, DataTypes: DataTypes) =>
  sequelize.define('Quiz_Activities', { /* ... */ }, { tableName: 'Quiz_Activities' });
```

Register the model in `initializeModels()` in `src/lib/models/index.ts`.

## 5. Add a migration

Existing installations do not re-run `01-schemas.sql` for a new table, so add a umzug
migration:

```ts
// src/lib/migrations/2026-10-20-add-quiz-activities.ts
export async function up({ context }: MigrationContext): Promise<void> {
  await context.sequelize.query('CREATE TABLE IF NOT EXISTS Quiz_Activities (...)');
}

export async function down({ context }: MigrationContext): Promise<void> {
  await context.sequelize.query('DROP TABLE IF EXISTS Quiz_Activities');
}
```

## 6. Extend the creation contract

The request body is a `oneOf`/`allOf` composition, so a new type means a new branch:

```yaml
quizActivityCreation:
  allOf:
    - $ref: '#/components/schemas/noTypedActivityCreation'
    - $ref: '#/components/schemas/quizActivityRequiredFields'
```

```yaml
quizActivityRequiredFields:
  type: object
  required: [quiz_id, activity_trace_storage, activity_can_be_restarted]
```

## 7. Verify

```bash
npm run validate-openapi
npm run update-docs
npm test
```

## Gotchas

- **Adding a column to `Games_Activities` needs a migration *and* a model change.** They
  drifted for months when `game_technology` was introduced; keep them in the same commit.
- **Do not forget `deletedAt`.** Every table except allocation bookkeeping has it. See
  [ADR-0010](../explanation/decisions/0010-soft-delete-and-the-admin-bypass.md).
- **`GET /activities` was fixed because listing hydrated each activity one row at a time.** If
  you add per-type tables, extend `Activity.buildListFromRows` rather than looping
  `getFromDbData`; listing must stay side-effect free.