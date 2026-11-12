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

jest.unstable_mockModule('@/controlers/simlets/group.permissions.controler', () => ({
  getGroupPermissions: jest.fn(async (req: any, res: any) => {
    res.json([{ user_id: 1, permission: 'READ' }]);
  }),
  createGroupPermissions: jest.fn(async (req: any, res: any) => {
    res.json({ message: 'Permissions created', group_id: Number(req.params.group_id), simlet_id: Number(req.params.simlet_id) });
  }),
  getGroupPermissionsForUser: jest.fn(async (req: any, res: any) => {
    res.json({ user_id: parseInt(req.params.user_id), permission: 'READ' });
  }),
  patchGroupPermissionsForUser: jest.fn(async (req: any, res: any) => {
    res.json({ message: 'Permissions updated', group_id: Number(req.params.group_id), simlet_id: Number(req.params.simlet_id), user_id: parseInt(req.params.user_id), new_permission: req.body.permission });
  }),
  deleteGroupPermissionsForUser: jest.fn(async (_req: any, res: any) => {
    res.status(204).send();
  })
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

  describe('Group Permissions Routes', () => {
    const simletId = 1;
    const groupId = 1;

    it('gets permissions for a group', async () => {
      const response = await request(app)
        .get(`/simlets/${simletId}/groups/${groupId}/permissions`)
        .expect(200);

      expect(response.body).toEqual([{ user_id: 1, permission: 'READ' }]);
    });

    it('creates permissions for a user in a group', async () => {
      const response = await request(app)
        .post(`/simlets/${simletId}/groups/${groupId}/permissions`)
        .send({ user_id: 123, permission: 'WRITE' })
        .expect(200);

      expect(response.body).toEqual({ message: 'Permissions created', group_id: groupId, simlet_id: simletId });
    });

    it('gets permissions for a specific user in a group', async () => {
      const response = await request(app)
        .get(`/simlets/${simletId}/groups/${groupId}/permissions/123`)
        .expect(200);

      expect(response.body).toEqual({ user_id: 123, permission: 'READ' });
    });

    it('updates permissions for a user in a group', async () => {
      const response = await request(app)
        .patch(`/simlets/${simletId}/groups/${groupId}/permissions/123`)
        .send({ permission: 'ADMIN' })
        .expect(200);

      expect(response.body).toEqual({ message: 'Permissions updated', group_id: groupId, simlet_id: simletId, user_id: 123, new_permission: 'ADMIN' });
    });

    it('deletes permissions for a user in a group', async () => {
      const response = await request(app)
        .delete(`/simlets/${simletId}/groups/${groupId}/permissions/123`)
        .expect(204);

      expect(response.status).toBe(204);
    });
  });
});