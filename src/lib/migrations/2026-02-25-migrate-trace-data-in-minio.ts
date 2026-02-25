
import { QueryInterface, DataTypes } from 'sequelize';
import { minioClient } from '@/lib/utils/minioclient';
import { logger } from '@/lib/logger';

export async function up({ context }: { context: QueryInterface }) {
    // Get current values
    const [results] = await context.sequelize.query(
      `SELECT activity_id, mongo_id FROM Activities WHERE mongo_id IS NOT NULL;`
    );
    logger.info({ results, count: results.length }, 'Found activities with mongo_id');

    // Fetch state.json from Minio
    const stateFilePath = 'state/state.json';
    const fileExists = await minioClient.fileExists(stateFilePath);
    logger.info({ fileExists }, 'Minio: Checking if backup file exists');
    if (!fileExists) {
      logger.warn('state/state.json does not exist in Minio, skipping migration');
      return;
    }

    const stateContent = await minioClient.getFile(stateFilePath);

    let state;
    try {
      state = JSON.parse(stateContent);
    } catch (err) {
      logger.error({ err }, 'Failed to parse state/state.json');
      throw err;
    }

    // Detect migration marker before continuing
    if (state.updated && state.updated === true) {
      logger.warn('Migration marker detected in state/state.json (updated: true). Skipping migration.');
      return;
    }

    // Build mongo_id -> activity_id map
    const mongoToActivityId = new Map(results.map((row: any) => [row.mongo_id, row.activity_id]));

    // Update activityId in state file
    logger.debug({ state }, 'Updated state object before migration');
    state.version = (parseInt(state.version) + 1).toString(); // Increment version number
    if (state.states && typeof state.states === 'object' && state.states.dataType === 'Map' && typeof state.states.value === 'object') {
      for (const [id, activityStateRaw] of Object.entries(state.states.value)) {
        const typedActivityStateRaw = activityStateRaw as [any, any];
        logger.debug({ id, mongoId: typedActivityStateRaw[0], activityState: typedActivityStateRaw[1] }, 'Processing activity state for migration');
        const mongoId = typedActivityStateRaw[0];
        let activityState = typedActivityStateRaw[1];
        // Assert activityState type and guard against missing value
        const typedActivityState = activityState as { datatype: string; value: {
          lastUpdate: string; activityId: any; currentSha1: string; updated?: boolean 
        } };
        // Detect per-activity migration marker
        if (typedActivityState.value && typedActivityState.value.updated && typedActivityState.value.updated === true) {
          logger.warn(`Migration marker detected for activity id=${typedActivityState.value.activityId} (updated: true). Skipping this activity.`);
          continue;
        }
        // Migrate /state/mongo_activity_id/<sha>-files.txt and <sha>-states.json
        const activityId = mongoToActivityId.get(mongoId);
        const currentSha1 = typedActivityState.value.currentSha1;
        if (!activityId || !currentSha1) {
          // Remove entry from state.states.value if activityId or currentSha1 is missing
          delete (state.states.value as Record<string, any>)[id];
          logger.warn({ id, mongoId, reason: 'Missing activityId or currentSha1' }, 'Removed entry from state.states.value');
          continue;
        }
        typedActivityStateRaw[0] = activityId; // Update mongo_id to activity_id in state object
        
        // Define old and new paths
        const oldFilesTxt = `state/${mongoId}/${currentSha1}-files.txt`;
        const oldStatesJson = `state/${mongoId}/${currentSha1}-states.json`;
        const oldOutputJson = `outputs/${mongoId}/traces.json`;
        const newFilesTxt = `state/${activityId}/${currentSha1}-files.txt`;
        const newStatesJson = `state/${activityId}/${currentSha1}-states.json`;
        const newOutputJson = `outputs/${activityId}/traces.json`;

        // Move files if they exist
        if (await minioClient.fileExists(oldFilesTxt)) {
          logger.info({ oldFilesTxt }, 'Found files.txt to migrate');
          await minioClient.renameFile(oldFilesTxt, newFilesTxt);
          logger.info({ oldFilesTxt, newFilesTxt }, 'Migrated files.txt');
        } else {
          logger.warn({ oldFilesTxt }, 'No files.txt found to migrate');
        }
        if (await minioClient.fileExists(oldStatesJson)) {
          logger.info({ oldStatesJson }, 'Found states.json to migrate');
          await minioClient.renameFile(oldStatesJson, newStatesJson);
          logger.info({ oldStatesJson, newStatesJson }, 'Migrated states.json');
        } else {
          logger.warn({ oldStatesJson }, 'No states.json found to migrate');
        }
        if (await minioClient.fileExists(oldOutputJson)) {
          logger.info({ oldOutputJson }, 'Found traces.json to migrate');
          await minioClient.renameFile(oldOutputJson, newOutputJson);
          logger.info({ oldOutputJson, newOutputJson }, 'Migrated traces.json');
        } else {
          logger.warn({ oldOutputJson }, 'No traces.json found to migrate');
        }
        if (mongoToActivityId.has(mongoId)) {
          typedActivityState.value.activityId = mongoToActivityId.get(mongoId);
        }
        // Add migration marker per activity
        typedActivityState.value.activityId = activityId; // Ensure activityId is set in state object
        typedActivityState.value.updated = true;
        typedActivityState.value.lastUpdate = new Date().toISOString();
        typedActivityStateRaw[1] = typedActivityState; // Update mongo_id to activity_id in state object
        logger.debug({ id, mongoId, activityId, activityState: typedActivityState, state : state }, 'Updated activity state for migration');
      }
      logger.info('Updated activityId in state/state.json for all matching mongo_id');
      // Remove all null entries from state.states.value if it's an array
      if (Array.isArray(state.states.value)) {
        state.states.value = state.states.value.filter((entry : any) => entry !== null);
        logger.info('Removed null entries from state.states.value array');
      }
      logger.debug({ state }, 'Updated state object after migration');
      await minioClient.putFile(stateFilePath, JSON.stringify(state, null, 2));
      logger.info('state/state.json updated in Minio');
    } else {
      logger.warn(`No states found in ${stateFilePath} or states has unexpected format, skipping activityId update`);
    }
    //throw new Error('Migration completed. Please verify the changes and remove this error to finalize the migration.');
}

export async function down({ context }: { context: QueryInterface }) {
}