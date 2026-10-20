import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import fs from 'fs';
import path from 'path';

export async function up({ context }: { context: QueryInterface }) {
  const sequelize = context.sequelize;
  const backupDir = process.env.MONGO_BACKUP_FOLDER || path.join(config.appFolder, '../mongo-backup');

  logger.info({ backupDir }, 'Starting MongoDB backup data migration');

  // Helper to safely read JSON file
  const safeReadJson = (filePath: string): any => {
    try {
      if (!fs.existsSync(filePath)) {
        logger.warn({ filePath }, 'Backup file does not exist, skipping');
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error({ err: error, filePath }, 'Failed to read backup file');
      return null;
    }
  };

  // 1. Migrate Users from users.json
  logger.info('Checking Users migration...');
  const usersData = safeReadJson(path.join(backupDir, 'users.json'));

  if (usersData && Array.isArray(usersData)) {
    const userCount = await context.sequelize.query(
      'SELECT COUNT(*) as count FROM "Users";',
      { type: context.sequelize.getQueryOptions().type }
    ) as any;

    if (userCount[0][0].count === 0) {
      const users = usersData.filter((u: any) => u && u.username);

      const usersValues = users.map((u: any) => [
        u['_id']?.$oid || u._id || null,
        u.username,
        u.isToken === true || u.isToken === 'true' || false,
        u.token || null,
        u.email,
        u.role || 'student'
      ]);

      logger.info({ count: usersValues.length, usernames: usersValues.map((u: any) => u[1]) }, 'Inserting Users');

      await context.queryInterface.bulkInsert('Users', usersValues, {});
      logger.info('Users migration completed');
    } else {
      logger.info('Users table already has data, skipping Users migration');
    }
  } else {
    logger.info('No users.json found or empty, skipping Users migration');
  }

  // 2. Migrate SIMLETs from studies.json
  logger.info('Checking SIMLETs migration...');
  const studiesData = safeReadJson(path.join(backupDir, 'studies.json'));

  if (studiesData && Array.isArray(studiesData)) {
    const simletCount = await context.sequelize.query(
      'SELECT COUNT(*) as count FROM "SIMLETs";',
      { type: context.sequelize.getQueryOptions().type }
    ) as any;

    if (simletCount[0][0].count === 0) {
      // Build user mapping from existing Users
      const [usersRows]: any = await context.sequelize.query(
        'SELECT user_id, username FROM "Users";',
        { type: context.sequelize.getQueryOptions().type }
      );

      const usernameToUserId = new Map(usersRows.map((row: any) => [row.username, row.user_id]));

      const simlets = studiesData.filter((s: any) => s && s.name);

      const simletsValues = simlets.map((s: any) => {
        const ownerId = s.owners && s.owners.length > 0
          ? usernameToUserId.get(s.owners[0]) || null
          : null;

        const createdAt = s.created && s.created['$date']
          ? new Date(s.created['$date']).toISOString()
          : new Date().toISOString();

        return [
          s['_id']?.$oid || s._id || null,
          s.name,
          s.archived !== undefined ? s.archived : false,
          s.description || '',
          ownerId,
          createdAt
        ];
      });

      logger.info({ count: simletsValues.length }, 'Inserting SIMLETs');

      await context.queryInterface.bulkInsert('SIMLETs', simletsValues, {});
      logger.info('SIMLETs migration completed');
    } else {
      logger.info('SIMLETs table already has data, skipping SIMLETs migration');
    }
  } else {
    logger.info('No studies.json found or empty, skipping SIMLETs migration');
  }

  // 3. Migrate ParticipantGroups from groups.json
  logger.info('Checking ParticipantGroups migration...');
  const groupsData = safeReadJson(path.join(backupDir, 'groups.json'));

  if (groupsData && Array.isArray(groupsData)) {
    const simletCount = await context.sequelize.query(
      'SELECT simlet_id, mongo_id FROM "SIMLETs";',
      { type: context.sequelize.getQueryOptions().type }
    ) as any;

    const mongoSimletToId = new Map(simletCount.map((row: any) => [row.mongo_id, row.simlet_id]));

    const [usersRows]: any = await context.sequelize.query(
      'SELECT user_id, username FROM "Users";',
      { type: context.sequelize.getQueryOptions().type }
    );

    const usernameToUserId = new Map(usersRows.map((row: any) => [row.username, row.user_id]));

    const filteredGroups = groupsData.filter((g: any) => g && g.name);

    const groupValues = filteredGroups.map((g: any) => {
      const groupMongoId = g['_id']?.$oid || g._id || null;
      const simletId = mongoSimletToId.get(groupMongoId) || null;

      const ownerId = g.owners && g.owners.length > 0
        ? usernameToUserId.get(g.owners[0]) || null
        : null;

      const createdAt = g.created && g.created['$date']
        ? new Date(g.created['$date']).toISOString()
        : new Date().toISOString();

      return [
        simletId,
        groupMongoId,
        g.name,
        g.version === '1' || g.version === true,
        ownerId,
        false, // group_sandbox
        g.allocator || null,
        g.type || 'default',
        createdAt
      ];
    });

    if (groupValues.length > 0) {
      logger.info({ count: groupValues.length }, 'Inserting ParticipantGroups');

      await context.queryInterface.bulkInsert('ParticipantGroups', groupValues, {});
      logger.info('ParticipantGroups migration completed');

      // 4. Migrate ParticipantGroups_participants
      logger.info('Checking ParticipantGroups_participants migration...');

      const participantValues: any[] = [];

      for (const group of filteredGroups) {
        const groupMongoId = group['_id']?.$oid || group._id || null;
        const simletId = mongoSimletToId.get(groupMongoId);

        if (!simletId) continue;

        const [groupsRows]: any = await context.sequelize.query(
          `SELECT group_id FROM "ParticipantGroups" WHERE "mongo_id" = '${groupMongoId}' AND "simlet_id" = ${simletId};`,
          { type: context.sequelize.getQueryOptions().type }
        );

        if (groupsRows.length > 0) {
          const sqlGroupId = groupsRows[0].group_id;

          const participants = group.get('participants', []);
          if (Array.isArray(participants)) {
            for (const participant of participants) {
              const participantUsername = participant.username || participant.user || null;
              const userId = participantUsername ? usernameToUserId.get(participantUsername) : null;

              if (userId) {
                participantValues.push([sqlGroupId, userId]);
              }
            }
          }
        }
      }

      if (participantValues.length > 0) {
        logger.info({ count: participantValues.length }, 'Inserting ParticipantGroups_participants');

        await context.queryInterface.bulkInsert('ParticipantGroups_participants', participantValues, {});
        logger.info('ParticipantGroups_participants migration completed');
      } else {
        logger.info('No participants to insert for ParticipantGroups_participants');
      }
    } else {
      logger.info('No groups to insert');
    }
  } else {
    logger.info('No groups.json found or empty, skipping ParticipantGroups migration');
  }

  // 5. Migrate Activities from activities.json
  logger.info('Checking Activities migration...');
  const activitiesData = safeReadJson(path.join(backupDir, 'activities.json'));

  if (activitiesData && Array.isArray(activitiesData)) {
    // Build mappings from already-migrated data
    const [sessionsRows]: any = await context.sequelize.query(
      'SELECT session_id, simlet_id FROM "Sessions";',
      { type: context.sequelize.getQueryOptions().type }
    );

    const sessionIdToSimletId = new Map(sessionsRows.map((row: any) => [row.session_id, row.simlet_id]));
    const [simletsRows]: any = await context.sequelize.query(
      'SELECT simlet_id, mongo_id FROM "SIMLETs";',
      { type: context.sequelize.getQueryOptions().type }
    );

    const mongoSimletToId = new Map(simletsRows.map((row: any) => [row.mongo_id, row.simlet_id]));

    const [sessionRows]: any = await context.sequelize.query(
      'SELECT session_id FROM "Sessions";',
      { type: context.sequelize.getQueryOptions().type }
    );

    const existingSessions = new Set(sessionRows.map((row: any) => row.session_id));

    const filteredActivities = activitiesData.filter((a: any) => a && a.name);

    const activityValues = filteredActivities.map((a: any) => {
      const activityMongoId = a['_id']?.$oid || a._id || null;
      const activityType = a.type || 'default';

      // Determine session from the activity reference
      let sessionId = null;
      const sessionRefs = a.get('session', []) || [];
      if (sessionRefs && sessionRefs.length > 0) {
        const sessionMongoId = sessionRefs[0];
        const foundSimletId = mongoSimletToId.get(sessionMongoId);
        if (foundSimletId !== undefined) {
          for (const [sid, sit] of sessionIdToSimletId) {
            if (sit === foundSimletId) {
              sessionId = sid;
              break;
            }
          }
        }
      }

      // If no session found from reference, use first available session
      if (sessionId === null && existingSessions.size > 0) {
        sessionId = Array.from(existingSessions)[0];
      }

      const activityOrder = a.order !== undefined ? a.order : 0;

      const activityTraceStorage = a.get('extra_data', {}).get('config', {}).get('trace_storage', 'false') === 'true';

      const activityDescription = a.description || a.get('description', '') || 'No description';

      const activityComplyWithGDPR = a.get('extra_data', {}).get('comply_with_GDPR', 'false') === 'true';
      const activityCanBeRestarted = a.get('extra_data', {}).get('can_be_restarted', 'false') === 'true';

      const activityPresignedUrl = a.get('extra_data', {}).get('presigned_url', '') || null;
      const activityPresignedUrlGeneratedAt = a.get('extra_data', {}).get('presigned_url_generated_at', '') || null;
      const activityPresignedUrlExpireAt = a.get('extra_data', {}).get('presigned_url_expire_at', '') || null;

      return [
        sessionId,
        activityMongoId,
        activityOrder,
        a.name,
        activityType,
        activityPresignedUrl,
        activityPresignedUrlGeneratedAt,
        activityPresignedUrlExpireAt,
        activityTraceStorage,
        activityDescription,
        activityComplyWithGDPR,
        activityCanBeRestarted,
        new Date().toISOString(),
        new Date().toISOString()
      ];
    });

    if (activityValues.length > 0) {
      logger.info({ count: activityValues.length }, 'Inserting Activities');

      await context.queryInterface.bulkInsert('Activities', activityValues, {});
      logger.info('Activities migration completed');
    } else {
      logger.info('No activities to insert');
    }
  } else {
    logger.info('No activities.json found or empty, skipping Activities migration');
  }

  // 6. Migrate Activities completion
  logger.info('Checking Activities_completion migration...');
  if (activitiesData && Array.isArray(activitiesData)) {
    // Build mapping from Activities to activity_ids
    const [activitiesRows]: any = await context.sequelize.query(
      'SELECT activity_id, mongo_id FROM "Activities";',
      { type: context.sequelize.getQueryOptions().type }
    );

    const mongoActivityToId = new Map(activitiesRows.map((row: any) => [row.mongo_id, row.activity_id]));

    // Build mapping from Users to user_ids
    const [usersRows]: any = await context.sequelize.query(
      'SELECT user_id, username FROM "Users";',
      { type: context.sequelize.getQueryOptions().type }
    );

    const usernameToUserId = new Map(usersRows.map((row: any) => [row.username, row.user_id]));

    const completionValues: any[] = [];

    for (const activity of activitiesData) {
      const activityMongoId = activity['_id']?.$oid || activity._id || null;
      const activityId = mongoActivityToId.get(activityMongoId);

      if (!activityId) continue;

      const participantsData = activity.get('extra_data', {}).get('participants', {}) || {};
      if (!Array.isArray(participantsData) && typeof participantsData === 'object') {
        for (const [participantMongoId, participantValue] of Object.entries(participantsData)) {
          const participantUserId = usernameToUserId.get(participantMongoId);
          if (!participantUserId) continue;

          const completed = participantValue.get('completion', 'false') === 'true';
          const actualProgress = participantValue.get('progress', 0);
          const progress = actualProgress === 0 && !completed ? null : actualProgress;
          const initialized = progress !== null;
          const suspended = participantValue.get('suspended', 'false') === 'true';

          completionValues.push([activityId, participantUserId, initialized, progress, suspended, completed]);
        }
      }
    }

    if (completionValues.length > 0) {
      logger.info({ count: completionValues.length }, 'Inserting Activities_completion');

      await context.queryInterface.bulkInsert('Activities_completion', completionValues, {});
      logger.info('Activities_completion migration completed');
    } else {
      logger.info('No Activities_completion to insert');
    }
  } else {
    logger.info('No activities.json found or empty, skipping Activities_completion migration');
  }

  logger.info('MongoDB backup data migration completed');
}

export async function down({ context }: { context: QueryInterface }) {
  logger.info('Down migration called - this imports data from MongoDB backup');
  logger.warn('Down migration: Removing imported data is complex. Manual cleanup may be required.');
  // Note: Rolling back this migration would require tracking what was imported
  // and removing those specific records without affecting other data.
}