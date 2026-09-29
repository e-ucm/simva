import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Activity } from '@/lib/mappers/activities/Activity';
import { db } from '@/lib/db';

// The activity mapper chain reaches the LRS client, which loads two ESM only
// dependencies that Jest cannot parse, so they are stubbed here
jest.mock('uuid', () => ({
  v4: () => '00000000-0000-4000-8000-000000000000'
}));

jest.mock('bloom-filters', () => {
  class ScalableBloomFilter {
    static fromJSON() {
      return new ScalableBloomFilter();
    }
    has() {
      return false;
    }
    add() {}
    saveAsJSON() {
      return '';
    }
  }
  return { ScalableBloomFilter };
});

jest.mock('@/lib/db', () => ({
  db: {
    Tables: {
      GamePlayActivities: { findAll: jest.fn() },
      LimesurveyActivities: { findAll: jest.fn() },
      ManualActivities: { findAll: jest.fn() },
      Activities: { findAll: jest.fn(), create: jest.fn() }
    }
  }
}));

const mockedDb = db as unknown as {
  Tables: {
    GamePlayActivities: { findAll: jest.Mock };
    LimesurveyActivities: { findAll: jest.Mock };
    ManualActivities: { findAll: jest.Mock };
    Activities: { findAll: jest.Mock; create: jest.Mock };
  };
};

/**
 * Builds a fake `Activities` row exposing the attributes as own properties plus
 * `toJSON`, the same shape the global activity list receives from
 * `db.Tables.Activities.findAll`.
 */
function activityRow(values: Record<string, unknown>) {
  return { ...values, toJSON: () => ({ ...values }) };
}

const baseRow = {
  session_id: 10,
  activity_id: 1,
  activity_order: 1,
  activity_name: 'Activity',
  activity_trace_storage: true,
  activity_can_be_restarted: false,
  activity_description: 'Description',
  activity_comply_with_GDPR: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z'
};

describe('Activity mapper - global activity list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDb.Tables.GamePlayActivities.findAll.mockResolvedValue([]);
    mockedDb.Tables.LimesurveyActivities.findAll.mockResolvedValue([]);
    mockedDb.Tables.ManualActivities.findAll.mockResolvedValue([]);
  });

  describe('buildListFromRows', () => {
    it('returns an empty list without querying when there are no rows', async () => {
      const result = await Activity.buildListFromRows([], new Map());

      expect(result).toEqual([]);
      expect(mockedDb.Tables.GamePlayActivities.findAll).not.toHaveBeenCalled();
      expect(mockedDb.Tables.LimesurveyActivities.findAll).not.toHaveBeenCalled();
      expect(mockedDb.Tables.ManualActivities.findAll).not.toHaveBeenCalled();
    });

    it('queries each typed table once regardless of the number of activities', async () => {
      const rows = [
        activityRow({ ...baseRow, activity_id: 1, activity_type: 'gameplay' }),
        activityRow({ ...baseRow, activity_id: 2, activity_type: 'limesurvey' }),
        activityRow({ ...baseRow, activity_id: 3, activity_type: 'manual' }),
        activityRow({ ...baseRow, activity_id: 4, activity_type: 'gameplay' })
      ];

      await Activity.buildListFromRows(rows, new Map([[10, 7]]));

      expect(mockedDb.Tables.GamePlayActivities.findAll).toHaveBeenCalledTimes(1);
      expect(mockedDb.Tables.LimesurveyActivities.findAll).toHaveBeenCalledTimes(1);
      expect(mockedDb.Tables.ManualActivities.findAll).toHaveBeenCalledTimes(1);
    });

    it('builds the typed subclass matching the activity type', async () => {
      const rows = [
        activityRow({ ...baseRow, activity_id: 1, activity_type: 'gameplay' }),
        activityRow({ ...baseRow, activity_id: 2, activity_type: 'limesurvey' }),
        activityRow({ ...baseRow, activity_id: 3, activity_type: 'manual' })
      ];

      const result = await Activity.buildListFromRows(rows, new Map([[10, 7]]));

      expect(result.map((activity) => activity.constructor.name)).toEqual([
        'GamePlayActivity',
        'LimesurveyActivity',
        'ManualActivity'
      ]);
    });

    it('keeps the fields required by the activity response schema', async () => {
      const rows = [
        activityRow({ ...baseRow, activity_id: 1, activity_type: 'gameplay' }),
        activityRow({ ...baseRow, activity_id: 2, activity_type: 'limesurvey' }),
        activityRow({ ...baseRow, activity_id: 3, activity_type: 'manual' })
      ];
      mockedDb.Tables.GamePlayActivities.findAll.mockResolvedValue([
        { activity_id: 1, game_backup: true, game_scorm_xapi: true, game_type: 'UNITY', game_url: 'http://game' }
      ]);
      mockedDb.Tables.LimesurveyActivities.findAll.mockResolvedValue([
        { activity_id: 2, survey_id: 77, survey_language: 'en', survey_lrsset: 1 }
      ]);
      mockedDb.Tables.ManualActivities.findAll.mockResolvedValue([
        { activity_id: 3, manual_user_managed: true, manual_ressource_type: 'EXTERNAL', manual_ressource_url: 'http://doc' }
      ]);

      const [gameplay, limesurvey, manual] = await Activity.buildListFromRows(rows, new Map([[10, 7]]));
      const gameplayJson = gameplay.toJSON() as Record<string, unknown>;
      const limesurveyJson = limesurvey.toJSON() as Record<string, unknown>;
      const manualJson = manual.toJSON() as Record<string, unknown>;

      for (const json of [gameplayJson, limesurveyJson, manualJson]) {
        for (const field of [
          'session_id',
          'activity_id',
          'activity_order',
          'activity_name',
          'activity_type',
          'activity_trace_storage',
          'activity_description',
          'activity_comply_with_GDPR',
          'activity_can_be_restarted',
          'createdAt',
          'updatedAt'
        ]) {
          expect(json).toHaveProperty(field);
        }
      }

      expect(gameplayJson).toMatchObject({ game_backup: true, game_scorm_xapi: true, game_type: 'UNITY', game_url: 'http://game' });
      expect(limesurveyJson).toMatchObject({ survey_id: 77, survey_language: 'en' });
      expect(manualJson).toMatchObject({
        manual_user_managed: true,
        manual_ressource_type: 'EXTERNAL',
        manual_ressource_url: 'http://doc'
      });
    });

    it('resolves the simlet of every activity from its session', async () => {
      const rows = [
        activityRow({ ...baseRow, session_id: 10, activity_id: 1, activity_type: 'manual' }),
        activityRow({ ...baseRow, session_id: 11, activity_id: 2, activity_type: 'manual' })
      ];

      const result = await Activity.buildListFromRows(rows, new Map([[10, 7], [11, 9]]));

      expect(result.map((activity) => activity.simlet_id)).toEqual([7, 9]);
    });

    it('falls back to the creation defaults without writing when a typed row is missing', async () => {
      const rows = [
        activityRow({ ...baseRow, activity_id: 1, activity_type: 'gameplay' }),
        activityRow({ ...baseRow, activity_id: 2, activity_type: 'limesurvey' }),
        activityRow({ ...baseRow, activity_id: 3, activity_type: 'manual' })
      ];

      const [gameplay, limesurvey, manual] = await Activity.buildListFromRows(rows, new Map([[10, 7]]));

      expect(gameplay.toJSON()).toMatchObject({ game_backup: false, game_scorm_xapi: false, game_type: 'WEB', game_url: '' });
      expect(limesurvey.toJSON()).toMatchObject({ survey_id: -1, survey_language: '' });
      expect(manual.toJSON()).toMatchObject({ manual_user_managed: false, manual_ressource_type: 'WEB', manual_ressource_url: '' });
      expect(mockedDb.Tables.Activities.create).not.toHaveBeenCalled();
    });

    it('keeps the base class for activity types without a typed table', async () => {
      const rows = [activityRow({ ...baseRow, activity_id: 1, activity_type: 'default' })];

      const result = await Activity.buildListFromRows(rows, new Map([[10, 7]]));

      expect(result[0].constructor.name).toBe('Activity');
      expect(result[0].toJSON()).toHaveProperty('session_id', 10);
    });
  });
});
