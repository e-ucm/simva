import { jest, beforeAll } from '@jest/globals';
import { Response, NextFunction } from 'express';

jest.unstable_mockModule('@/services/groups/group.service', () => ({
  getGroups: jest.fn(),
  getAdminGroups: jest.fn(),
}));

jest.unstable_mockModule('@/lib/mappers/simletGroup/SimletGroup', () => ({
  SimletGroup: {
    getCurrentUserAllFromDbData: jest.fn(),
  },
}));

jest.unstable_mockModule('@/lib/mappers/UserPermisions/UserPermission', () => ({
  UserPermission: {
    getFromDbData: jest.fn(),
  },
}));

jest.unstable_mockModule('@/lib/mappers/UserPermisions/SingleUserPermission', () => ({
  SingleUserPermission: {
    getFromDbData: jest.fn(),
  },
}));

let mockedGroupService: any;
let mockedSimletGroup: any;
let mockedUserPermission: any;
let getGroupPermissions: typeof import('@/controlers/simlets/group.permissions.controler')['getGroupPermissions'];
let createGroupPermissions: typeof import('@/controlers/simlets/group.permissions.controler')['createGroupPermissions'];
let deleteGroupPermissionsForUser: typeof import('@/controlers/simlets/group.permissions.controler')['deleteGroupPermissionsForUser'];
let mockedSingleUserPermission: any;
let AuthentificationError: typeof import('@/lib/errors/appErrors')['AuthentificationError'];

beforeAll(async () => {
  mockedGroupService = await import('@/services/groups/group.service');
  mockedSimletGroup = (await import('@/lib/mappers/simletGroup/SimletGroup')).SimletGroup;
  mockedUserPermission = (await import('@/lib/mappers/UserPermisions/UserPermission')).UserPermission;
  mockedSingleUserPermission = (await import('@/lib/mappers/UserPermisions/SingleUserPermission')).SingleUserPermission;
  const controller = await import('@/controlers/simlets/group.permissions.controler');
  getGroupPermissions = controller.getGroupPermissions;
  createGroupPermissions = controller.createGroupPermissions;
  deleteGroupPermissionsForUser = controller.deleteGroupPermissionsForUser;
  AuthentificationError = (await import('@/lib/errors/appErrors')).AuthentificationError;
});

type MockAuthReq = {
  params: Record<string, string>;
  user: { sql: { user_id?: number; role?: string } };
};

const group = (group_id: number) => ({ group_id });

describe('getGroupPermissions controller', () => {
  let mockReq: MockAuthReq;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: { simlet_id: '1', group_id: '5' },
      user: { sql: { user_id: 123, role: 'teacher' } },
    };
    mockRes = { json: jest.fn() } as Partial<Response>;
    mockNext = jest.fn() as unknown as NextFunction;
  });

  it('responds with an array of user permissions for a teacher group', async () => {
    const permissions = [
      { user_id: 1, username: 'teacher1', permission: 'READ', isCurrentUser: true },
    ];
    mockedGroupService.getGroups.mockResolvedValue([group(5)] as any);
    mockedUserPermission.getFromDbData.mockResolvedValue({ toJSON: () => permissions } as any);

    await getGroupPermissions(mockReq as any, mockRes as Response, mockNext);

    expect(mockedGroupService.getGroups).toHaveBeenCalledWith(123, undefined, undefined, undefined, undefined);
    expect(mockedUserPermission.getFromDbData).toHaveBeenCalledWith('group', 5, 123, false);
    expect(mockRes.json).toHaveBeenCalledWith(permissions);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('uses admin groups and admin flag for administrators', async () => {
    mockReq.user = { sql: { user_id: 1, role: 'administrator' } };
    mockedGroupService.getAdminGroups.mockResolvedValue([group(5)] as any);
    mockedUserPermission.getFromDbData.mockResolvedValue({ toJSON: () => [] } as any);

    await getGroupPermissions(mockReq as any, mockRes as Response, mockNext);

    expect(mockedGroupService.getAdminGroups).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
    expect(mockedGroupService.getGroups).not.toHaveBeenCalled();
    expect(mockedUserPermission.getFromDbData).toHaveBeenCalledWith('group', 5, 1, true);
    expect(mockRes.json).toHaveBeenCalledWith([]);
  });

  it('passes AuthentificationError to next when the group is not accessible', async () => {
    mockedGroupService.getGroups.mockResolvedValue([group(99)] as any);

    await getGroupPermissions(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    expect(mockedUserPermission.getFromDbData).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('passes AuthentificationError to next for an invalid role', async () => {
    mockReq.user = { sql: { user_id: 7, role: 'student' } };

    await getGroupPermissions(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    expect(mockedGroupService.getGroups).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('passes service errors to next', async () => {
    const error = new Error('db down');
    mockedGroupService.getGroups.mockRejectedValue(error);

    await getGroupPermissions(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

describe('createGroupPermissions controller', () => {
  let mockReq: MockAuthReq & { body: Record<string, unknown> };
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: { simlet_id: '1', group_id: '5' },
      body: { user_id: 456, permission: 'WRITE' },
      user: { sql: { user_id: 123, role: 'teacher' } },
    };
    mockRes = { json: jest.fn() } as Partial<Response>;
    mockNext = jest.fn() as unknown as NextFunction;
  });

  it('creates the permission and responds with a user permission object', async () => {
    const created = { user_id: 456, username: 'student1', permission: 'WRITE', isCurrentUser: false };
    const createPermissions = jest.fn(async () => ({ toJSON: () => created }));
    mockedGroupService.getGroups.mockResolvedValue([group(5)] as any);
    mockedSimletGroup.getCurrentUserAllFromDbData.mockResolvedValue([group(5)] as any);
    mockedUserPermission.getFromDbData.mockResolvedValue({ createPermissions } as any);

    await createGroupPermissions(mockReq as any, mockRes as Response, mockNext);

    expect(mockedUserPermission.getFromDbData).toHaveBeenCalledWith('group', 5, 123, false);
    expect(createPermissions).toHaveBeenCalledWith({ user_id: 456, permission: 'WRITE' });
    expect(mockRes.json).toHaveBeenCalledWith(created);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('rejects a teacher without access to the group', async () => {
    mockedGroupService.getGroups.mockResolvedValue([group(5)] as any);
    mockedSimletGroup.getCurrentUserAllFromDbData.mockResolvedValue([] as any);

    await createGroupPermissions(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    expect(mockedUserPermission.getFromDbData).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});

describe('deleteGroupPermissionsForUser controller', () => {
  let mockReq: MockAuthReq & { params: Record<string, string> };
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: { simlet_id: '1', group_id: '5', user_id: '456' },
      user: { sql: { user_id: 123, role: 'teacher' } },
    };
    mockRes = { json: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() } as Partial<Response>;
    mockNext = jest.fn() as unknown as NextFunction;
  });

  it('deletes the user permission in the group and returns 204', async () => {
    const remove = jest.fn(async () => true);
    mockedGroupService.getGroups.mockResolvedValue([group(5)] as any);
    mockedSimletGroup.getCurrentUserAllFromDbData.mockResolvedValue([group(5)] as any);
    mockedSingleUserPermission.getFromDbData.mockResolvedValue({ delete: remove } as any);

    await deleteGroupPermissionsForUser(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSingleUserPermission.getFromDbData).toHaveBeenCalledWith('group', 5, 456, 123, false);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('does not delete anything for a teacher without access to the group', async () => {
    mockedGroupService.getGroups.mockResolvedValue([group(5)] as any);
    mockedSimletGroup.getCurrentUserAllFromDbData.mockResolvedValue([] as any);

    await deleteGroupPermissionsForUser(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    expect(mockedSingleUserPermission.getFromDbData).not.toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });
});
