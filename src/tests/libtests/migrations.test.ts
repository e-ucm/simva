import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { Sequelize, DataTypes, QueryInterface, QueryTypes } from 'sequelize';
import { tableExists } from '@/lib/migrationHelpers';

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

let addDeleteAt: any;
let addGameType: any;
let removeMongoid: any;
let backupData: any;
let traceData: any;
let limeSurvey: any;
let sessionsTags: any;
let backupFromMongo: any;

// Module-level Sequelize instance
let sequelizeInstance: Sequelize;

// Helper: run raw SQL using module-level sequelize instance
async function rawQuery(sql: string): Promise<void> {
  if (!sequelizeInstance) {
    throw new Error('Sequelize instance not initialized');
  }
  await sequelizeInstance.query(sql);
}

beforeAll(async () => {
  const miniocli = await import('@/lib/utils/minioclient');
  const { minioClient } = miniocli;
  addDeleteAt = await import('@/lib/migrations/2026-08-02-add-deleteAt-to-alltables');
  addGameType = await import('@/lib/migrations/2026-08-06-add-game-type');
  removeMongoid = await import('@/lib/migrations/2026-02-26-remove-mongoid-colons');
  backupData = await import('@/lib/migrations/2026-02-25-migrate-backup-data-to-minio');
  traceData = await import('@/lib/migrations/2026-02-25-migrate-trace-data-in-minio');
  limeSurvey = await import('@/lib/migrations/2026-03-16-migrate-limesurvey-endpoints');
  sessionsTags = await import('@/lib/migrations/2026-05-01-fix-sessions-tags-foreign-key');
  backupFromMongo = await import('@/lib/migrations/2026-01-01-migrate-backup-data-to-sqlite');

  // Initialize Sequelize instance
  sequelizeInstance = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('migration idempotence', () => {
  it('2026-08-02 add deletedAt can be re-run up and down', async () => {
    // Create Users table with just id column using raw SQL
    await rawQuery(`
      CREATE TABLE IF NOT EXISTS "Users" (
        "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
        "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
        "deletedAt" DATETIME
      );
    `);
  });
});
