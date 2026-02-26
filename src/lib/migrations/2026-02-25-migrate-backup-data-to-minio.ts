
import { QueryInterface, DataTypes } from 'sequelize';
import { minioClient } from '@/lib/utils/minioclient';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { config } from '@/lib/config';

export async function up({ context }: { context: QueryInterface }) {
    // Get current values
    const [results] = await context.sequelize.query(
      `SELECT activity_id, mongo_id FROM Activities WHERE mongo_id IS NOT NULL;`
    );
    logger.info({ results, count: results.length }, 'Found activities with mongo_id');

    const mongoToActivityId = new Map(results.map((row: any) => [row.mongo_id, row.activity_id]));

    for (const row of results as Array<{ mongo_id: string; activity_id: string }>) {
      const mongoId = row.mongo_id;
      const localFolder = `${config.storage.path}/${mongoId}`;
      if (!fs.existsSync(localFolder)) {
        logger.warn({ mongoId, localFolder }, 'Local folder does not exist, skipping');
        continue;
      }
      const files = fs.readdirSync(localFolder);
      logger.info({ mongoId, files }, 'Uploading files to Minio backup');
      for (const fileName of files) {
        const localFilePath = path.join(localFolder, fileName);
        const minioBackupPath = `${config.minio.backupDir}/${mongoToActivityId.get(mongoId)}/${fileName}`;
        try {
          const fileContent = fs.readFileSync(localFilePath, 'utf8');
          await minioClient.putFile(minioBackupPath, fileContent);
          logger.info({ minioBackupPath, localFilePath }, 'Uploaded file to Minio backup');
        } catch (err) {
          logger.error({ err, mongoId, fileName }, 'Failed to upload file to Minio backup');
          throw err;
        }
      }
    }
    logger.info('Migration upload to Minio backup completed');
}

export async function down({ context }: { context: QueryInterface }) {
}