import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { logger } from '../logger';
import { config } from '../config';
import { limeSurveyClient } from '../utils/limesurveyclient';

export async function up({ context }: { context: QueryInterface }) {
     // Get current values
    const [results] = await context.sequelize.query(
      `SELECT activity_id, survey_id FROM Limesurvey_Activities;`
    );
    logger.info({ results, count: results.length }, 'Found activities with mongo_id');
    for (const row of results as Array<{ activity_id: number; survey_id: string | number | null }>) {
        let surveyId = row.survey_id;
        if(surveyId === null) {
            logger.warn({ activityId: row.activity_id }, 'Activity has null survey_id, skipping');
            continue;
        }
        let activityId = row.activity_id;
        let url = `${config.api.url}/activities/${activityId}/lrs`;
        logger.info({ activityId, surveyId, url }, 'Setting LRS endpoint for activity');
        await limeSurveyClient.setActivityLRSEndpoint(surveyId, url);
    }
    //throw new Error('This migration is a no-op. The actual migration logic was moved to a separate script that should be run manually before running this migration.');
}

export async function down({ context }: { context: QueryInterface }) {
}