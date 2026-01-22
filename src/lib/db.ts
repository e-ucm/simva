import { Sequelize, DataTypes } from 'sequelize';
import { logger } from './logger';
import { initializeModels } from './models/index';
import initFunctions from '@/lib/functions';
import views from '@/lib/views/index';
import { config } from './config';

type DbType = {
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
  Tables: ReturnType<typeof initializeModels>;
  Functions: ReturnType<typeof initFunctions>;
  Views: typeof views;
};

const globalForDb = globalThis as unknown as { db?: DbType };

if (!globalForDb.db) {
  const isTest = process.env.NODE_ENV === 'test';
  logger.debug(`Initializing SIMVA DB (isTest: ${isTest})`);
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: isTest ? ':memory:' : config.db.complete_path,
    logging: (sql: string) => logger.debug(sql),
  });

  globalForDb.db = {
    Sequelize,
    sequelize,
    Tables: initializeModels(sequelize, DataTypes),
    Functions: initFunctions(sequelize),
    Views: views,
  } as DbType;
}

export const db = globalForDb.db!;
