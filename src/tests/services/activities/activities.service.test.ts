import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getAllActivities, parseActivitiesSearchString } from '@/services/activities/activities.service';
import { Activity } from '@/lib/mappers/activities/Activity';
import { Simlet } from '@/lib/mappers/simlet/Simlet';

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

jest.mock('@/lib/mappers/simlet/Simlet', () => ({
  Simlet: {
    getAllFromDbData: jest.fn()
  }
}));

const mockedSimlet = Simlet as jest.Mocked<typeof Simlet>;
const mockedGetAllActivities = jest.spyOn(Activity, 'getAllActivities');
const mockedActivity = { getAllActivities: mockedGetAllActivities } as unknown as jest.Mocked<typeof Activity>;

describe('Activities Service - global activity list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseActivitiesSearchString', () => {
    it('returns an empty filter when searchString is missing or blank', () => {
      expect(parseActivitiesSearchString(undefined)).toEqual({});
      expect(parseActivitiesSearchString('   ')).toEqual({});
    });

    it('treats a plain string as an activity name filter', () => {
      expect(parseActivitiesSearchString('pre test')).toEqual({ name: 'pre test' });
    });

    it('parses a JSON object with a type array', () => {
      const filter = parseActivitiesSearchString('{"type":["gameplay","manual"]}');
      expect(filter).toEqual({ type: ['gameplay', 'manual'] });
    });

    it('parses a JSON object with a single type, a name and simlet ids', () => {
      const filter = parseActivitiesSearchString('{"type":"limesurvey","name":"survey","simlet_id":[1,2]}');
      expect(filter).toEqual({ type: ['limesurvey'], name: 'survey', simletIds: [1, 2] });
    });

    it('rejects malformed JSON', () => {
      expect(() => parseActivitiesSearchString('{"type":')).toThrow();
    });

    it('rejects a JSON array', () => {
      expect(() => parseActivitiesSearchString('["gameplay"]')).toThrow();
    });

    it('rejects a non string type', () => {
      expect(() => parseActivitiesSearchString('{"type":[1]}')).toThrow();
    });

    it('rejects a non integer simlet_id', () => {
      expect(() => parseActivitiesSearchString('{"simlet_id":"abc"}')).toThrow();
    });
  });

  describe('getAllActivities', () => {
    it('returns every activity for admins without restricting simlets', async () => {
      const list = [{ activity_id: 1 }];
      mockedActivity.getAllActivities.mockResolvedValue(list as any);

      const result = await getAllActivities(true, 10, { type: ['gameplay'] }, 100, 0, 'id', 'ASC');

      expect(mockedSimlet.getAllFromDbData).not.toHaveBeenCalled();
      expect(mockedActivity.getAllActivities).toHaveBeenCalledWith(undefined, ['gameplay'], undefined, 100, 0, 'id', 'ASC', 10);
      expect(result).toEqual(list);
    });

    it('restricts non admins to the activities of their own simlets', async () => {
      mockedSimlet.getAllFromDbData.mockResolvedValue([{ simlet_id: 1 }, { simlet_id: 2 }] as any);
      mockedActivity.getAllActivities.mockResolvedValue([] as any);

      await getAllActivities(false, 10, { type: ['manual'] });

      expect(mockedSimlet.getAllFromDbData).toHaveBeenCalledWith(10, false);
      expect(mockedActivity.getAllActivities).toHaveBeenCalledWith([1, 2], ['manual'], undefined, undefined, undefined, undefined, undefined, 10);
    });

    it('intersects the requested simlet ids with the simlets of the user', async () => {
      mockedSimlet.getAllFromDbData.mockResolvedValue([{ simlet_id: 1 }] as any);
      mockedActivity.getAllActivities.mockResolvedValue([] as any);

      await getAllActivities(false, 10, { simletIds: [1, 7] });

      expect(mockedActivity.getAllActivities).toHaveBeenCalledWith([1], undefined, undefined, undefined, undefined, undefined, undefined, 10);
    });

    it('throws when a non admin has no user id', async () => {
      await expect(getAllActivities(false, undefined)).rejects.toThrow();
      expect(mockedActivity.getAllActivities).not.toHaveBeenCalled();
    });
  });
});
