import request from 'supertest';
import { app } from '@/app';
import { db } from '@/lib/db';
import { NotFoundError, ValidationError } from '@/lib/errors/appErrors';
import * as groupPermissionsService from '@/services/groups/groupPermissions.service';

// Mock the auth middleware
jest.mock('@/middlewares/auth.middleware', () => ({
  auth: (req: any, res: any, next: any) => {
    // Mock user for tests
    req.user = {
      sql: {
        user_id: 1,
        username: 'testuser',
        role: 'admin'
      },
      data: {
        username: 'testuser',
        role: 'admin'
      }
    };
    next();
  }
}));

// Mock group permissions service
jest.mock('@/services/groups/groupPermissions.service');
const mockedGroupPermissionsService = groupPermissionsService as jest.Mocked<typeof groupPermissionsService>;

describe('Group Permissions Controller Routes', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await db.sequelize.sync({ force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('GET /group-permissions/group/:groupId', () => {
    it('returns all permissions for valid group ID', async () => {
      const mockPermissions = [
        { group_id: 1, user_id: 10, permission: 'edit' },
        { group_id: 1, user_id: 11, permission: 'view' }
      ];
      
      mockedGroupPermissionsService.getGroupPermissions.mockResolvedValue(mockPermissions as any);

      const response = await request(app)
        .get('/group-permissions/group/1')
        .expect(200);

      expect(response.body).toEqual(mockPermissions);
      expect(mockedGroupPermissionsService.getGroupPermissions).toHaveBeenCalledWith(1);
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .get('/group-permissions/group/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for negative group ID', async () => {
      const response = await request(app)
        .get('/group-permissions/group/-1')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });
  });

  describe('GET /group-permissions/user/:userId', () => {
    it('returns all group permissions for valid user ID', async () => {
      const mockPermissions = [
        { group_id: 1, user_id: 10, permission: 'edit' },
        { group_id: 2, user_id: 10, permission: 'view' }
      ];
      
      mockedGroupPermissionsService.getUserGroupPermissions.mockResolvedValue(mockPermissions as any);

      const response = await request(app)
        .get('/group-permissions/user/10')
        .expect(200);

      expect(response.body).toEqual(mockPermissions);
      expect(mockedGroupPermissionsService.getUserGroupPermissions).toHaveBeenCalledWith(10);
    });

    it('returns validation error for invalid user ID', async () => {
      const response = await request(app)
        .get('/group-permissions/user/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID');
    });
  });

  describe('POST /group-permissions/group/:groupId/user/:userId/permission/:permission', () => {
    it('adds permission successfully', async () => {
      const newPermission = { group_id: 1, user_id: 10, permission: 'edit' };
      
      mockedGroupPermissionsService.addGroupPermission.mockResolvedValue(newPermission as any);

      const response = await request(app)
        .post('/group-permissions/group/1/user/10/permission/edit')
        .expect(201);

      expect(response.body).toEqual(newPermission);
      expect(mockedGroupPermissionsService.addGroupPermission).toHaveBeenCalledWith(1, 10, 'edit');
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .post('/group-permissions/group/invalid/user/10/permission/edit')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for invalid user ID', async () => {
      const response = await request(app)
        .post('/group-permissions/group/1/user/invalid/permission/edit')
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID');
    });

    it('returns validation error for empty permission', async () => {
      const response = await request(app)
        .post('/group-permissions/group/1/user/10/permission/%20')
        .expect(400);

      expect(response.body.message).toContain('Permission cannot be empty');
    });

    it('handles service errors during addition', async () => {
      mockedGroupPermissionsService.addGroupPermission.mockRejectedValue(
        new ValidationError('Permission already exists')
      );

      const response = await request(app)
        .post('/group-permissions/group/1/user/10/permission/edit')
        .expect(400);

      expect(response.body.message).toContain('Permission already exists');
    });
  });

  describe('DELETE /group-permissions/group/:groupId/user/:userId/permission/:permission', () => {
    it('removes permission successfully', async () => {
      mockedGroupPermissionsService.removeGroupPermission.mockResolvedValue();

      const response = await request(app)
        .delete('/group-permissions/group/1/user/10/permission/edit')
        .expect(204);

      expect(response.body).toEqual({});
      expect(mockedGroupPermissionsService.removeGroupPermission).toHaveBeenCalledWith(1, 10, 'edit');
    });

    it('returns 404 when permission not found', async () => {
      mockedGroupPermissionsService.removeGroupPermission.mockRejectedValue(
        new NotFoundError('Permission not found')
      );

      const response = await request(app)
        .delete('/group-permissions/group/1/user/999/permission/edit')
        .expect(404);

      expect(response.body.message).toContain('Permission not found');
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .delete('/group-permissions/group/invalid/user/10/permission/edit')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for invalid user ID', async () => {
      const response = await request(app)
        .delete('/group-permissions/group/1/user/invalid/permission/edit')
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID');
    });

    it('returns validation error for empty permission', async () => {
      const response = await request(app)
        .delete('/group-permissions/group/1/user/10/permission/%20')
        .expect(400);

      expect(response.body.message).toContain('Permission cannot be empty');
    });
  });

  describe('GET /group-permissions/group/:groupId/user/:userId/permission/:permission/exists', () => {
    it('returns true when user has permission', async () => {
      mockedGroupPermissionsService.hasGroupPermission.mockResolvedValue(true);

      const response = await request(app)
        .get('/group-permissions/group/1/user/10/permission/edit/exists')
        .expect(200);

      expect(response.body).toEqual({ hasPermission: true });
      expect(mockedGroupPermissionsService.hasGroupPermission).toHaveBeenCalledWith(1, 10, 'edit');
    });

    it('returns false when user does not have permission', async () => {
      mockedGroupPermissionsService.hasGroupPermission.mockResolvedValue(false);

      const response = await request(app)
        .get('/group-permissions/group/1/user/999/permission/edit/exists')
        .expect(200);

      expect(response.body).toEqual({ hasPermission: false });
      expect(mockedGroupPermissionsService.hasGroupPermission).toHaveBeenCalledWith(1, 999, 'edit');
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .get('/group-permissions/group/invalid/user/10/permission/edit/exists')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for invalid user ID', async () => {
      const response = await request(app)
        .get('/group-permissions/group/1/user/invalid/permission/edit/exists')
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID');
    });

    it('returns validation error for empty permission', async () => {
      const response = await request(app)
        .get('/group-permissions/group/1/user/10/permission/%20/exists')
        .expect(400);

      expect(response.body.message).toContain('Permission cannot be empty');
    });
  });

  describe('GET /group-permissions/group/:groupId/permission/:permission', () => {
    it('returns users with specific permission in group', async () => {
      const mockPermissions = [
        { group_id: 1, user_id: 10, permission: 'edit' },
        { group_id: 1, user_id: 11, permission: 'edit' }
      ];
      
      mockedGroupPermissionsService.getGroupUsersWithPermission.mockResolvedValue(mockPermissions as any);

      const response = await request(app)
        .get('/group-permissions/group/1/permission/edit')
        .expect(200);

      expect(response.body).toEqual(mockPermissions);
      expect(mockedGroupPermissionsService.getGroupUsersWithPermission).toHaveBeenCalledWith(1, 'edit');
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .get('/group-permissions/group/invalid/permission/edit')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for empty permission', async () => {
      const response = await request(app)
        .get('/group-permissions/group/1/permission/%20')
        .expect(400);

      expect(response.body.message).toContain('Permission cannot be empty');
    });
  });

  describe('GET /group-permissions/user/:userId/groups', () => {
    it('returns groups where user has permissions', async () => {
      const mockGroups = [
        { group_id: 1, name: 'Group A' },
        { group_id: 2, name: 'Group B' }
      ];
      
      mockedGroupPermissionsService.getUserGroups.mockResolvedValue(mockGroups as any);

      const response = await request(app)
        .get('/group-permissions/user/10/groups')
        .expect(200);

      expect(response.body).toEqual(mockGroups);
      expect(mockedGroupPermissionsService.getUserGroups).toHaveBeenCalledWith(10);
    });

    it('returns validation error for invalid user ID', async () => {
      const response = await request(app)
        .get('/group-permissions/user/invalid/groups')
        .expect(400);

      expect(response.body.message).toContain('Invalid user ID');
    });

    it('handles service errors when getting user groups', async () => {
      mockedGroupPermissionsService.getUserGroups.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/group-permissions/user/10/groups')
        .expect(500);

      expect(response.body.message).toContain('Database error');
    });
  });
});