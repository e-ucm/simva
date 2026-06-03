
import { QueryInterface, DataTypes } from 'sequelize';
import { minioClient } from '@/lib/utils/minioclient';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { config } from '@/lib/config';

export async function up({ context }: { context: QueryInterface }) {
    // Get current values
    const [activityResults] = await context.sequelize.query(
      `SELECT activity_id, mongo_id FROM Activities WHERE mongo_id IS NOT NULL;`
    );
    logger.info({ results: activityResults, count: activityResults.length }, 'Found activities with mongo_id');

    const mongoToActivityId = new Map(activityResults.map((row: any) => [row.mongo_id, row.activity_id]));

    const [userResults] = await context.sequelize.query(
      `SELECT user_id, username FROM Users WHERE mongo_id IS NOT NULL;`
    );
    logger.info({ results: userResults, count: userResults.length }, 'Found users with mongo_id');

    const usernameToUserId = new Map(userResults.map((row: any) => [row.username, row.user_id]));


    for (const row of activityResults as Array<{ mongo_id: string; activity_id: string }>) {
      const mongoId = row.mongo_id;
      const localFolder = `${config.storage.path}${mongoId}`;
      if (!fs.existsSync(localFolder)) {
        logger.warn({ mongoId, localFolder }, 'Local folder does not exist, skipping');
        continue;
      }
      const files = fs.readdirSync(localFolder);
      logger.info({ mongoId, files }, 'Uploading files to Minio backup');
      for (const fileName of files) {
        let username: string;
        if (fileName.endsWith('.result')) {
          username = fileName.slice(0, -7);
        } else {
          logger.warn({ fileName }, 'Unexpected file name format, skipping');
          throw new Error(`Unexpected file name format: ${fileName}`);
        }
        const localFilePath = path.join(localFolder, fileName);
        let userId = usernameToUserId.get(username);
        if (!userId) {
          logger.warn({ username }, 'Username not found in database, skipping file');
          continue;
        }
        const minioBackupPath = `${config.minio.backupDir}/${mongoToActivityId.get(mongoId)}/${userId}.result`;
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