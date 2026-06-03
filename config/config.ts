let dbPath = process.env.SQLLITE_DB_PATH || '/data/db';
let dbFile = process.env.SQLLITE_DB_FILE || 'simva_data.db';
export default {
  development: {
    dialect: 'sqlite',
    storage: `${dbPath}/${dbFile}`
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: {
    dialect: 'sqlite',
    storage: `${dbPath}/${dbFile}`
  }
};
