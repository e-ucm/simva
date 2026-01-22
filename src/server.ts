import { app } from './app.js';
import { db } from './lib/db';
import { config } from './lib/config';
import { logger } from './lib/logger';

const PORT = config.api.port;

async function start() {
  await db.sequelize.authenticate();

  app.listen(PORT, () => {
    logger.info(`🚀 SIMVA API running on ${config.api.url}`);
  });
}

start().catch(err => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
