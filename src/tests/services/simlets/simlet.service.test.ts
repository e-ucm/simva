import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  getSimletsByUserId,
  getSimletBySimletIdAndUserId,
  createSimlet,
  patch,
  deleteSimlet,
  getAllocatorFromSimlet,
  getSimletParticipants,
  getSimletGroups,
  getSimletSessions,
  getSimletSession,
  getSessionActivities
} from '@/services/simlets/simlet.service';
import { Simlet } from '@/lib/mappers/simlet/Simlet';
import { Session } from '@/lib/mappers/session/Session';

jest.mock('@/lib/mappers/simlet/Simlet', () => ({
  Simlet: {
    getAllFromDbData: jest.fn(),
    getFromDbData: jest.fn(),
    createSimlet: jest.fn()
  }
}));

jest.mock('@/lib/mappers/session/Session', () => ({
  Session: {
    getFromDbData: jest.fn()
  }
}));

const mockedSimlet = Simlet as jest.Mocked<typeof Simlet>;
const mockedSession = Session as jest.Mocked<typeof Session>;

describe('Simlet Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getSimletsByUserId delegates to Simlet.getAllFromDbData', async () => {
    const list = [{ simlet_id: 1 }];
    mockedSimlet.getAllFromDbData.mockResolvedValue(list as any);

    const result = await getSimletsByUserId(10, 'abc', 5, 2);

    expect(mockedSimlet.getAllFromDbData).toHaveBeenCalledWith(10, 'abc', 5, 2);
    expect(result).toEqual(list);
  });

  it('getSimletBySimletIdAndUserId delegates to Simlet.getFromDbData', async () => {
    const item = { simlet_id: 2, printInfo: jest.fn() };
    mockedSimlet.getFromDbData.mockResolvedValue(item as any);

    const result = await getSimletBySimletIdAndUserId(2, 10);

    expect(mockedSimlet.getFromDbData).toHaveBeenCalledWith(2, 10);
    expect(item.printInfo).toHaveBeenCalled();
    expect(result).toEqual(item);
  });

  it('createSimlet delegates to Simlet.createSimlet', async () => {
    const payload = { simlet_name: 'S1' };
    const created = { simlet_id: 3 };
    mockedSimlet.createSimlet.mockResolvedValue(created as any);

    const result = await createSimlet(payload);

    expect(mockedSimlet.createSimlet).toHaveBeenCalledWith(payload);
    expect(result).toEqual(created);
  });

  it('patch resolves through simlet instance patch', async () => {
    const updated = { simlet_id: 4 };
    const simletInstance = { patch: jest.fn().mockResolvedValue(updated) };
    mockedSimlet.getFromDbData.mockResolvedValue(simletInstance as any);

    const result = await patch(4, 10, { simlet_name: 'Updated' });

    expect(mockedSimlet.getFromDbData).toHaveBeenCalledWith(4, 10);
    expect(simletInstance.patch).toHaveBeenCalledWith({ simlet_name: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('deleteSimlet resolves through simlet instance remove', async () => {
    const simletInstance = { remove: jest.fn().mockResolvedValue(undefined) };
    mockedSimlet.getFromDbData.mockResolvedValue(simletInstance as any);

    await deleteSimlet(5, 10);

    expect(mockedSimlet.getFromDbData).toHaveBeenCalledWith(5, 10);
    expect(simletInstance.remove).toHaveBeenCalled();
  });

  it('delegates related-resource getters through simlet/session instances', async () => {
    const allocator = { allocator_id: 1 };
    const participants = [{ user_id: 1 }];
    const groups = [{ group_id: 1 }];
    const sessions = [{ session_id: 1 }];
    const session = { session_id: 2 };
    const activities = [{ activity_id: 1 }];

    const simletInstance = {
      getAllocator: jest.fn().mockResolvedValue(allocator),
      getAllocatedParticipants: jest.fn().mockResolvedValue(participants),
      getGroups: jest.fn().mockResolvedValue(groups),
      getSessions: jest.fn().mockResolvedValue(sessions),
      getSession: jest.fn().mockResolvedValue(session)
    };

    const sessionInstance = { getActivities: jest.fn().mockResolvedValue(activities) };

    mockedSimlet.getFromDbData.mockResolvedValue(simletInstance as any);
    mockedSession.getFromDbData.mockResolvedValue(sessionInstance as any);

    await expect(getAllocatorFromSimlet(1, 10)).resolves.toEqual(allocator);
    await expect(getSimletParticipants(1, 10)).resolves.toEqual(participants);
    await expect(getSimletGroups(1, 10)).resolves.toEqual(groups);
    await expect(getSimletSessions(1, 10, 'x', 2, 0)).resolves.toEqual(sessions);
    await expect(getSimletSession(1, 2, 10)).resolves.toEqual(session);
    await expect(getSessionActivities(1, 2, 10)).resolves.toEqual(activities);

    expect(simletInstance.getSessions).toHaveBeenCalledWith('x', 2, 0);
    expect(mockedSession.getFromDbData).toHaveBeenCalledWith(1, 2, 10);
    expect(sessionInstance.getActivities).toHaveBeenCalled();
  });
});
