import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { Sequelize, DataTypes, QueryInterface, QueryTypes } from 'sequelize';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  normalizeSequelizeMeta,
  selectMigrationFiles,
  tableExists,
} from '@/lib/migrationHelpers';

// The data migrations reach out to MinIO; stub the client so the tests stay
// offline. The migration guards under test must bail out before using it.
jest.unstable_mockModule('@/lib/utils/minioclient', () => ({
  minioClient: {
    fileExists: jest.fn(async () => false),
    getFile: jest.fn(async () => ''),
    putFile: jest.fn(async () => undefined),
    renameFile: jest.fn(async () => undefined),
  },
  MinioClient: class {},
}));

type Migration = {
  up: (args: { context: QueryInterface }) => Promise<void>;
  down: (args: { context: QueryInterface }) => Promise<void>;
};

let addDeleteAt: typeof import('@/lib/migrations/2026-08-02-add-deleteAt-to-alltables');
let addGameType: typeof import('@/lib/migrations/2026-08-06-add-game-type');
let removeMongoid: typeof import('@/lib/migrations/2026-02-26-remove-mongoid-colons');
let backupData: Migration;
let traceData: Migration;
let limeSurvey: Migration;
let sessionsTags: Migration;
let repairForeignKeys: typeof import('@/lib/migrations/2026-10-20-repair-foreign-key-actions');

let minioClient: {
  fileExists: jest.Mock;
  getFile: jest.Mock;
  putFile: jest.Mock;
  renameFile: jest.Mock;
};

beforeAll(async () => {
  minioClient = (await import('@/lib/utils/minioclient')).minioClient as unknown as typeof minioClient;
  addDeleteAt = await import('@/lib/migrations/2026-08-02-add-deleteAt-to-alltables');
  addGameType = await import('@/lib/migrations/2026-08-06-add-game-type');
  removeMongoid = await import('@/lib/migrations/2026-02-26-remove-mongoid-colons');
  backupData = await import('@/lib/migrations/2026-02-25-migrate-backup-data-to-minio');
  traceData = await import('@/lib/migrations/2026-02-25-migrate-trace-data-in-minio');
  limeSurvey = await import('@/lib/migrations/2026-03-16-migrate-limesurvey-endpoints');
  sessionsTags = await import('@/lib/migrations/2026-05-01-fix-sessions-tags-foreign-key');
  repairForeignKeys = await import('@/lib/migrations/2026-10-20-repair-foreign-key-actions');
});

beforeEach(() => {
  jest.clearAllMocks();
});

async function createTable(qi: QueryInterface, table: string, columns: Record<string, unknown> = {}) {
  await qi.createTable(table, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ...columns,
  });
}

async function createIdTables(qi: QueryInterface, tables: readonly string[]): Promise<void> {
  for (const table of tables) {
    await qi.createTable(table, { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true } });
  }
}

async function columns(sequelize: Sequelize, table: string): Promise<string[]> {
  const rows = (await sequelize.query(`PRAGMA table_info(\`${table}\`);`, {
    type: QueryTypes.SELECT,
  })) as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

async function foreignTables(sequelize: Sequelize, table: string): Promise<string[]> {
  const rows = (await sequelize.query(`PRAGMA foreign_key_list(\`${table}\`);`, {
    type: QueryTypes.SELECT,
  })) as Array<{ table: string }>;
  return rows.map((row) => row.table);
}

describe('migration idempotence', () => {
  it('2026-08-02 add deletedAt can be re-run up and down', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const qi = sequelize.getQueryInterface();

    await createIdTables(qi, addDeleteAt.tables);
    // Reproduce the reported failure: the column already exists on Users but
    // the migration is not recorded, so it runs again.
    await qi.addColumn('Users', 'deletedAt', { type: DataTypes.DATE, allowNull: true });

    await addDeleteAt.up({ context: qi });
    await addDeleteAt.up({ context: qi });
    for (const table of addDeleteAt.tables) {
      expect(await columns(sequelize, table)).toContain('deletedAt');
    }

    await addDeleteAt.down({ context: qi });
    await addDeleteAt.down({ context: qi });
    for (const table of addDeleteAt.tables) {
      expect(await columns(sequelize, table)).not.toContain('deletedAt');
    }

    await sequelize.close();
  });

  it('2026-08-06 add game type can be re-run up and down', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const qi = sequelize.getQueryInterface();

    await createTable(qi, 'GamePlay_Activities');
    // One of the two columns already present.
    await qi.addColumn('GamePlay_Activities', 'game_technology', { type: DataTypes.STRING, allowNull: true });

    await addGameType.up({ context: qi });
    await addGameType.up({ context: qi });
    for (const column of addGameType.GAME_TYPE_COLUMNS) {
      expect(await columns(sequelize, 'GamePlay_Activities')).toContain(column);
    }

    await addGameType.down({ context: qi });
    await addGameType.down({ context: qi });
    for (const column of addGameType.GAME_TYPE_COLUMNS) {
      expect(await columns(sequelize, 'GamePlay_Activities')).not.toContain(column);
    }

    await sequelize.close();
  });

  it('2026-02-26 remove mongo_id can be re-run up and down', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const qi = sequelize.getQueryInterface();

    await createTable(qi, 'Users', { mongo_id: { type: DataTypes.STRING, allowNull: true } });
    await createTable(qi, 'SIMLETs', { mongo_id: { type: DataTypes.STRING, allowNull: true } });
    await createTable(qi, 'Sessions', { mongo_id: { type: DataTypes.STRING, allowNull: true } });
    await createTable(qi, 'Activities', { mongo_id: { type: DataTypes.STRING, allowNull: true } });

    await removeMongoid.up({ context: qi });
    await removeMongoid.up({ context: qi });
    for (const table of ['Users', 'SIMLETs', 'Sessions', 'Activities']) {
      expect(await columns(sequelize, table)).not.toContain('mongo_id');
    }

    await removeMongoid.down({ context: qi });
    await removeMongoid.down({ context: qi });
    for (const table of ['Users', 'SIMLETs', 'Sessions', 'Activities']) {
      expect(await columns(sequelize, table)).toContain('mongo_id');
    }
    await sequelize.close();
  });

  it('2026-02-26 remove mongo_id preserves child rows on a file-backed database', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'simva-migration-'));
    const databasePath = path.join(directory, 'migration.sqlite');
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: databasePath, logging: false });
    const qi = sequelize.getQueryInterface();

    try {
      await sequelize.query('CREATE TABLE Users (user_id INTEGER PRIMARY KEY, mongo_id VARCHAR);');
      await sequelize.query(`
        CREATE TABLE SIMLETs (
          simlet_id INTEGER PRIMARY KEY,
          mongo_id VARCHAR,
          simlet_supervisor_id INTEGER REFERENCES Users(user_id) ON DELETE SET NULL
        );
      `);
      await sequelize.query(`
        CREATE TABLE Sessions (
          session_id INTEGER PRIMARY KEY,
          mongo_id VARCHAR,
          simlet_id INTEGER REFERENCES SIMLETs(simlet_id) ON DELETE CASCADE
        );
      `);
      await sequelize.query(`
        CREATE TABLE Activities (
          activity_id INTEGER PRIMARY KEY,
          mongo_id VARCHAR,
          session_id INTEGER REFERENCES Sessions(session_id) ON DELETE CASCADE
        );
      `);
      await sequelize.query(`
        CREATE TABLE Activities_completion (
          activity_id INTEGER REFERENCES Activities(activity_id) ON DELETE CASCADE
        );
      `);
      await sequelize.query(`
        CREATE TABLE GamePlay_Activities (
          activity_id INTEGER REFERENCES Activities(activity_id) ON DELETE CASCADE
        );
      `);
      await sequelize.query(`
        CREATE TABLE Sessions_tags_list (
          tag_id INTEGER PRIMARY KEY,
          user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE
        );
      `);
      await sequelize.query(`
        CREATE TABLE Sessions_tags (
          session_id INTEGER REFERENCES Sessions(session_id) ON DELETE CASCADE,
          tag_id INTEGER REFERENCES Sessions_tags_list(tag_id) ON DELETE CASCADE
        );
      `);

      await sequelize.query('INSERT INTO Users VALUES (1, \'user-mongo\');');
      await sequelize.query('INSERT INTO SIMLETs VALUES (1, \'simlet-mongo\', 1);');
      await sequelize.query('INSERT INTO Sessions VALUES (1, \'session-mongo\', 1);');
      await sequelize.query('INSERT INTO Activities VALUES (1, \'activity-mongo\', 1);');
      await sequelize.query('INSERT INTO Activities_completion VALUES (1);');
      await sequelize.query('INSERT INTO GamePlay_Activities VALUES (1);');
      await sequelize.query('INSERT INTO Sessions_tags_list VALUES (1, 1);');
      await sequelize.query('INSERT INTO Sessions_tags VALUES (1, 1);');

      await removeMongoid.up({ context: qi });
      await removeMongoid.up({ context: qi });

      for (const table of ['Activities_completion', 'GamePlay_Activities', 'Sessions_tags', 'Sessions_tags_list']) {
        const rows = (await sequelize.query(`SELECT count(*) AS count FROM ${table};`, {
          type: QueryTypes.SELECT,
        })) as Array<{ count: number }>;
        expect(rows[0].count).toBe(1);
      }
      for (const table of ['Users', 'SIMLETs', 'Sessions', 'Activities']) {
        expect(await columns(sequelize, table)).not.toContain('mongo_id');
      }

      const foreignKeys = (await sequelize.query('PRAGMA foreign_keys', {
        type: QueryTypes.SELECT,
      })) as Array<{ foreign_keys: number }>;
      expect(foreignKeys[0].foreign_keys).toBe(1);
    } finally {
      await sequelize.close();
      await fs.rm(directory, { recursive: true, force: true });
    }
  });

  it('2026-10-20 repairs foreign-key actions without losing rows', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const qi = sequelize.getQueryInterface();

    await sequelize.query('CREATE TABLE Users (user_id INTEGER PRIMARY KEY);');
    await sequelize.query(`
      CREATE TABLE SIMLETs (
        simlet_id INTEGER PRIMARY KEY,
        simlet_supervisor_id INTEGER REFERENCES Users(user_id)
      );
    `);
    await sequelize.query(`
      CREATE TABLE Sessions (
        session_id INTEGER PRIMARY KEY,
        simlet_id INTEGER REFERENCES SIMLETs(simlet_id),
        session_coordinator_id INTEGER REFERENCES Users(user_id),
        session_sandbox_user_id INTEGER REFERENCES Users(user_id)
      );
    `);
    await sequelize.query('CREATE INDEX Sessions_simlet_index ON Sessions(simlet_id);');
    await sequelize.query(`
      CREATE TABLE Activities (
        activity_id INTEGER PRIMARY KEY,
        session_id INTEGER REFERENCES Sessions(session_id)
      );
    `);
    await sequelize.query('CREATE TABLE Sessions_tags_list (tag_id INTEGER PRIMARY KEY);');
    await sequelize.query(`
      CREATE TABLE Sessions_tags (
        session_id INTEGER REFERENCES Sessions(session_id),
        tag_id INTEGER REFERENCES Sessions_tags_list(tag_id)
      );
    `);

    await sequelize.query('INSERT INTO Users VALUES (1);');
    await sequelize.query('INSERT INTO SIMLETs VALUES (1, 1);');
    await sequelize.query('INSERT INTO Sessions VALUES (1, 1, 1, 1);');
    await sequelize.query('INSERT INTO Activities VALUES (1, 1);');
    await sequelize.query('INSERT INTO Sessions_tags_list VALUES (1);');
    await sequelize.query('INSERT INTO Sessions_tags VALUES (1, 1);');

    await repairForeignKeys.up({ context: qi });
    await repairForeignKeys.up({ context: qi });

    for (const [table, expectedForeignKeys] of Object.entries(repairForeignKeys.EXPECTED_FOREIGN_KEYS)) {
      const actual = (await sequelize.query(`PRAGMA foreign_key_list(\`${table}\`);`, {
        type: QueryTypes.SELECT,
      })) as Array<{ from: string; table: string; to: string; on_update: string; on_delete: string }>;
      expect(actual).toHaveLength(expectedForeignKeys.length);
      for (const expectedForeignKey of expectedForeignKeys) {
        expect(actual).toContainEqual(expect.objectContaining({
          from: expectedForeignKey.from,
          table: expectedForeignKey.table,
          to: expectedForeignKey.to,
          on_update: expectedForeignKey.onUpdate,
          on_delete: expectedForeignKey.onDelete,
        }));
      }
    }

    for (const table of ['SIMLETs', 'Sessions', 'Activities', 'Sessions_tags']) {
      const rows = (await sequelize.query(`SELECT count(*) AS count FROM ${table};`, {
        type: QueryTypes.SELECT,
      })) as Array<{ count: number }>;
      expect(rows[0].count).toBe(1);
    }

    const indexRows = (await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'Sessions_simlet_index';",
      { type: QueryTypes.SELECT }
    )) as Array<{ name: string }>;
    expect(indexRows).toEqual([{ name: 'Sessions_simlet_index' }]);

    await sequelize.close();
  });

  it('2026-05-01 sessions tags foreign key repair is idempotent', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const qi = sequelize.getQueryInterface();

    await sequelize.query('CREATE TABLE Sessions (session_id INTEGER PRIMARY KEY);');
    await sequelize.query('CREATE TABLE Sessions_tags_list (tag_id INTEGER PRIMARY KEY);');
    // Legacy table the broken foreign key points at.
    await sequelize.query('CREATE TABLE tags_list (id INTEGER PRIMARY KEY);');
    await sequelize.query(`
      CREATE TABLE Sessions_tags (
        session_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, tag_id),
        FOREIGN KEY (session_id) REFERENCES Sessions(session_id),
        FOREIGN KEY (tag_id) REFERENCES tags_list(id)
      );
    `);
    await sequelize.query('INSERT INTO Sessions (session_id) VALUES (1);');
    await sequelize.query('INSERT INTO Sessions_tags_list (tag_id) VALUES (7);');
    await sequelize.query('INSERT INTO tags_list (id) VALUES (7);');
    await sequelize.query('INSERT INTO Sessions_tags (session_id, tag_id) VALUES (1, 7);');

    await sessionsTags.up({ context: qi });
    await sessionsTags.up({ context: qi });

    const fks = await foreignTables(sequelize, 'Sessions_tags');
    expect(fks).toContain('Sessions_tags_list');
    expect(fks).not.toContain('tags_list');
    expect(await tableExists(sequelize, 'Sessions_tags_old')).toBe(false);

    const rows = (await sequelize.query('SELECT session_id, tag_id FROM Sessions_tags;', {
      type: QueryTypes.SELECT,
    })) as Array<{ session_id: number; tag_id: number }>;
    expect(rows).toEqual([{ session_id: 1, tag_id: 7 }]);

    await sequelize.close();
  });

  it('2026-02-25 backup migration skips when mongo_id was already removed', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const qi = sequelize.getQueryInterface();

    await createTable(qi, 'Activities');
    await createTable(qi, 'Users');

    await backupData.up({ context: qi });
    await backupData.up({ context: qi });

    expect(minioClient.putFile).not.toHaveBeenCalled();
    expect(minioClient.renameFile).not.toHaveBeenCalled();

    await sequelize.close();
  });

  it('2026-02-25 trace migration skips when mongo_id was already removed', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const qi = sequelize.getQueryInterface();

    await createTable(qi, 'Activities');

    await traceData.up({ context: qi });
    await traceData.up({ context: qi });

    expect(minioClient.fileExists).not.toHaveBeenCalled();
    expect(minioClient.renameFile).not.toHaveBeenCalled();

    await sequelize.close();
  });

  it('2026-03-16 limesurvey endpoints migration can be re-run', async () => {
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    const qi = sequelize.getQueryInterface();

    await qi.createTable('Limesurvey_Activities', {
      activity_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      survey_id: { type: DataTypes.INTEGER, allowNull: true },
    });

    await limeSurvey.up({ context: qi });
    await limeSurvey.up({ context: qi });

    await sequelize.close();
  });

  it('normalizes extension-based migration identities and prefers JavaScript files', async () => {
    expect(selectMigrationFiles([
      '2026-02-25-example.ts',
      '2026-02-25-example.js',
      '2026-03-01-ts-only.ts',
      '2026-04-01-js-only.js',
      '2026-05-01-ignored.d.ts',
      'README.md',
    ])).toEqual([
      { name: '2026-02-25-example', file: '2026-02-25-example.js' },
      { name: '2026-03-01-ts-only', file: '2026-03-01-ts-only.ts' },
      { name: '2026-04-01-js-only', file: '2026-04-01-js-only.js' },
    ]);

    const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    await sequelize.query('CREATE TABLE SequelizeMeta (name VARCHAR PRIMARY KEY);');
    await sequelize.query("INSERT INTO SequelizeMeta VALUES ('2026-02-25-example.ts');");
    await sequelize.query("INSERT INTO SequelizeMeta VALUES ('2026-02-25-example.js');");
    await sequelize.query("INSERT INTO SequelizeMeta VALUES ('2026-03-01-ts-only.ts');");

    await normalizeSequelizeMeta(sequelize);
    await normalizeSequelizeMeta(sequelize);

    const names = (await sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name;', {
      type: QueryTypes.SELECT,
    })) as Array<{ name: string }>;
    expect(names).toEqual([
      { name: '2026-02-25-example' },
      { name: '2026-03-01-ts-only' },
    ]);

    await sequelize.close();
  });
});
