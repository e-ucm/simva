import { beforeEach, beforeAll, describe, expect, it, jest } from '@jest/globals';

jest.unstable_mockModule('@/lib/mappers/simletGroup/SimletGroup', () => ({
  SimletGroup: {
    getCurrentUserAllFromDbData: jest.fn(),
    getAdminAllFromDbData: jest.fn()
  }
}));

let mockedGroup: jest.Mocked<typeof import('@/lib/mappers/simletGroup/SimletGroup')['SimletGroup']>;
let getGroups: typeof import('@/services/groups/group.service')['getGroups'];
let getAdminGroups: typeof import('@/services/groups/group.service')['getAdminGroups'];

beforeAll(async () => {
  const groupModule = await import('@/lib/mappers/simletGroup/SimletGroup');
  mockedGroup = groupModule.SimletGroup as jest.Mocked<typeof groupModule.SimletGroup>;
  const service = await import('@/services/groups/group.service');
  getGroups = service.getGroups;
  getAdminGroups = service.getAdminGroups;
});

describe('Group Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getGroups delegates to SimletGroup.getCurrentUserAllFromDbData', async () => {
    const groups = [{ group_id: 1 }];
    mockedGroup.getCurrentUserAllFromDbData.mockResolvedValue(groups as any);

    const result = await getGroups(5, true, 'abc', 10, 0);

    expect(mockedGroup.getCurrentUserAllFromDbData).toHaveBeenCalledWith(5, true, 10, 0, 'abc');
    expect(result).toEqual(groups);
  });

  it('getGroups omits optional arguments when not provided', async () => {
    mockedGroup.getCurrentUserAllFromDbData.mockResolvedValue([] as any);

    await getGroups(5);

    expect(mockedGroup.getCurrentUserAllFromDbData).toHaveBeenCalledWith(5, undefined, undefined, undefined, undefined);
  });

  it('getAdminGroups delegates to SimletGroup.getAdminAllFromDbData', async () => {
    const groups = [{ group_id: 2 }];
    mockedGroup.getAdminAllFromDbData.mockResolvedValue(groups as any);

    const result = await getAdminGroups(true, 'abc', 10, 0);

    expect(mockedGroup.getAdminAllFromDbData).toHaveBeenCalledWith(true, 10, 0, 'abc');
    expect(result).toEqual(groups);
  });
});