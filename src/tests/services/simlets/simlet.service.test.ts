import { beforeEach, beforeAll, describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('@/lib/mappers/simlet/Simlet', () => ({
  Simlet: {
    getAllFromDbData: jest.fn(),
    getFromDbData: jest.fn(),
    createSimlet: jest.fn(),
    getAdminSimlets: jest.fn(),
    getSimletCountByUserId: jest.fn(),
    getOrderNameColumn: jest.fn(),
    getOrder: jest.fn()
  }
}));

let mockedSimlet: jest.Mocked<typeof import('@/lib/mappers/simlet/Simlet')['Simlet']>;
let getSimletsByUserId: typeof import('@/services/simlets/simlet.service')['getSimletsByUserId'];
let getSimletsForStudent: typeof import('@/services/simlets/simlet.service')['getSimletsForStudent'];
let getAllSimlets: typeof import('@/services/simlets/simlet.service')['getAllSimlets'];
let getSimletBySimletIdAndUserId: typeof import('@/services/simlets/simlet.service')['getSimletBySimletIdAndUserId'];
let createSimlet: typeof import('@/services/simlets/simlet.service')['createSimlet'];
let patch: typeof import('@/services/simlets/simlet.service')['patch'];
let deleteSimlet: typeof import('@/services/simlets/simlet.service')['deleteSimlet'];
let getSimletParticipants: typeof import('@/services/simlets/simlet.service')['getSimletParticipants'];
let getSimletCountByUserId: typeof import('@/services/simlets/simlet.service')['getSimletCountByUserId'];

beforeAll(async () => {
  const simletModule = await import('@/lib/mappers/simlet/Simlet');
  mockedSimlet = simletModule.Simlet as jest.Mocked<typeof simletModule.Simlet>;
  const service = await import('@/services/simlets/simlet.service');
  getSimletsByUserId = service.getSimletsByUserId;
  getSimletsForStudent = service.getSimletsForStudent;
  getAllSimlets = service.getAllSimlets;
  getSimletBySimletIdAndUserId = service.getSimletBySimletIdAndUserId;
  createSimlet = service.createSimlet;
  patch = service.patch;
  deleteSimlet = service.deleteSimlet;
  getSimletParticipants = service.getSimletParticipants;
  getSimletCountByUserId = service.getSimletCountByUserId;
});

describe('Simlet Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getSimletsByUserId delegates to Simlet.getAllFromDbData', async () => {
    const list = [{ simlet_id: 1 }];
    mockedSimlet.getAllFromDbData.mockResolvedValue(list as any);

    const result = await getSimletsByUserId(10, true, 'abc', [1], 5, 2, 'name', 'ASC');

    expect(mockedSimlet.getAllFromDbData).toHaveBeenCalledWith(10, false, true, 'abc', 5, 2, [1], 'name', 'ASC');
    expect(result).toEqual(list);
  });

  it('getSimletsForStudent delegates to Simlet.getAllFromDbData as allocated user', async () => {
    const list = [{ simlet_id: 2 }];
    mockedSimlet.getAllFromDbData.mockResolvedValue(list as any);

    const result = await getSimletsForStudent(10, 'abc', [1], 5, 2, 'name', 'ASC');

    expect(mockedSimlet.getAllFromDbData).toHaveBeenCalledWith(10, true, undefined, 'abc', 5, 2, [1], 'name', 'ASC');
    expect(result).toEqual(list);
  });

  it('getAllSimlets delegates to Simlet.getAdminSimlets', async () => {
    const list = [{ simlet_id: 3 }];
    mockedSimlet.getAdminSimlets.mockResolvedValue(list as any);

    const result = await getAllSimlets(true, 'abc', [1], 5, 2, 'name', 'ASC');

    expect(mockedSimlet.getAdminSimlets).toHaveBeenCalledWith(true, 'abc', [1], 5, 2, 'name', 'ASC');
    expect(result).toEqual(list);
  });

  it('getSimletBySimletIdAndUserId delegates to Simlet.getFromDbData', async () => {
    const item = { simlet_id: 2, printInfo: jest.fn() };
    mockedSimlet.getFromDbData.mockResolvedValue(item as any);

    const result = await getSimletBySimletIdAndUserId(2, false, 10);

    expect(mockedSimlet.getFromDbData).toHaveBeenCalledWith(2, false, 10);
    expect(item.printInfo).toHaveBeenCalled();
    expect(result).toEqual(item);
  });

  it('createSimlet delegates to Simlet.createSimlet', async () => {
    const payload = { simlet_name: 'S1' };
    const created = { simlet_id: 3 };
    mockedSimlet.createSimlet.mockResolvedValue(created as any);

    const result = await createSimlet(payload, false, 123);

    expect(mockedSimlet.createSimlet).toHaveBeenCalledWith(payload, false, 123);
    expect(result).toEqual(created);
  });

  it('patch resolves through simlet instance patch', async () => {
    const updated = { simlet_id: 4 };
    const simletInstance = { patch: jest.fn().mockResolvedValue(updated) };
    mockedSimlet.getFromDbData.mockResolvedValue(simletInstance as any);

    const result = await patch(4, { simlet_name: 'Updated' }, false, 10);

    expect(mockedSimlet.getFromDbData).toHaveBeenCalledWith(4, false, 10);
    expect(simletInstance.patch).toHaveBeenCalledWith({ simlet_name: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('deleteSimlet resolves through simlet instance delete', async () => {
    const simletInstance = { delete: jest.fn().mockResolvedValue(undefined) };
    mockedSimlet.getFromDbData.mockResolvedValue(simletInstance as any);

    await deleteSimlet(5, false, 10);

    expect(mockedSimlet.getFromDbData).toHaveBeenCalledWith(5, false, 10);
    expect(simletInstance.delete).toHaveBeenCalled();
  });

  it('getSimletParticipants resolves through simlet instance getAllocatedParticipants', async () => {
    const participants = [{ user_id: 1 }];
    const simletInstance = { getAllocatedParticipants: jest.fn().mockResolvedValue(participants) };
    mockedSimlet.getFromDbData.mockResolvedValue(simletInstance as any);

    const result = await getSimletParticipants(1, false, 10);

    expect(mockedSimlet.getFromDbData).toHaveBeenCalledWith(1, false, 10);
    expect(result).toEqual(participants);
  });

  it('getSimletCountByUserId delegates to Simlet.getSimletCountByUserId', async () => {
    mockedSimlet.getSimletCountByUserId.mockResolvedValue(5);

    const result = await getSimletCountByUserId(true, false, 'abc', [1], 10);

    expect(mockedSimlet.getSimletCountByUserId).toHaveBeenCalledWith(true, false, 'abc', [1], 10);
    expect(result).toBe(5);
  });
});