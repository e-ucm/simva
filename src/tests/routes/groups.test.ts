import { jest, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';

jest.unstable_mockModule('@/middlewares/auth.middleware', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = {
      sql: { user_id: 1, username: 'testuser', role: 'administrator' },
      data: { username: 'testuser', role: 'administrator' }
    };
    next();
  },
  roleAllowed: (_req: any, _res: any, next: any) => next(),
  Authenticator: {}
}));

jest.unstable_mockModule('@/services/groups/group.service', () => ({
  getGroups: jest.fn(),
  getAdminGroups: jest.fn()
}));

let app: Express;
let mockedAdminGroups: jest.Mock;

const groupMapper = (data: any = {}) => ({
  simlet_id: 1,
  group_id: 1,
  group_name: 'Group A',
  group_use_new_generation: true,
  group_allocator_type: 'random',
  group_sandbox: false,
  group_owner_user_id: 1,
  group_owner_username: 'testuser',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  participants: [],
  allocations: {},
  ...data
});

const groupWith = (data: any = {}) => ({ toJSON: () => groupMapper(data) });

beforeAll(async () => {
  app = (await import('@/app')).app;
  const groupService = await import('@/services/groups/group.service');
  mockedAdminGroups = groupService.getAdminGroups as unknown as jest.Mock;
});

describe('Group Controller Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /groups', () => {
    it('returns all groups for an administrator', async () => {
      const groups = [groupMapper(), groupMapper({ group_id: 2, group_name: 'Group B', group_use_new_generation: false })];
      mockedAdminGroups.mockResolvedValue([groupWith(), groupWith({ group_id: 2, group_name: 'Group B', group_use_new_generation: false })]);

      const response = await request(app).get('/groups').expect(200);

      expect(response.body).toEqual(groups);
      expect(mockedAdminGroups).toHaveBeenCalledWith(undefined, undefined, undefined, NaN);
    });

    it('forwards pagination and filter query parameters to the service', async () => {
      mockedAdminGroups.mockResolvedValue([groupWith()] as any);

      const response = await request(app)
        .get('/groups?limit=10&skip=1&searchString=foo&use_new_generation=true')
        .expect(200);

      expect(response.body).toEqual([groupMapper()]);
      expect(mockedAdminGroups).toHaveBeenCalledWith(true, 'foo', 10, 1);
    });

    it('propagates service errors through the error middleware', async () => {
      mockedAdminGroups.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/groups').expect(500);

      expect(response.body.message).toContain('Database error');
    });
  });
});