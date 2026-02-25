
import { QueryInterface, DataTypes } from 'sequelize';
import { minioClient } from '@/lib/utils/minioclient';
import { logger } from '@/lib/logger';

export async function up({ context }: { context: QueryInterface }) {
    // Get current values
    const [results] = await context.sequelize.query(
      `SELECT activity_id, mongo_id FROM Activities WHERE mongo_id IS NOT NULL;`
    );
    logger.info({ results, count: results.length }, 'Found activities with mongo_id');
    let fileExists = await minioClient.fileExists('state/state.json');
    logger.info({ fileExists }, 'Minio: Checking if backup file exists');
    //throw new Error('This migration is a no-op placeholder. Please implement the logic to migrate backup data to Minio if needed.');
}

export async function down({ context }: { context: QueryInterface }) {

}