import request from 'supertest';
import { app } from '@/app';
import { db } from '@/lib/db';
import { NotFoundError, ValidationError } from '@/lib/errors/appErrors';
import * as groupService from '@/services/groups/group.service';

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

// Mock group service
jest.mock('@/services/groups/group.service');
const mockedGroupService = groupService as jest.Mocked<typeof groupService>;

describe('Group Controller Routes', () => {
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

  describe('GET /groups', () => {
    it('returns list of all groups when no query parameters', async () => {
      const mockGroups = [
        { group_id: 1, name: 'Group A', use_new_generation: true, group_owner_id: 1 },
        { group_id: 2, name: 'Group B', use_new_generation: false, group_owner_id: 1 }
      ];
      
      mockedGroupService.getAllGroups.mockResolvedValue(mockGroups as any);

      const response = await request(app)
        .get('/groups')
        .expect(200);

      expect(response.body).toEqual(mockGroups);
      expect(mockedGroupService.getAllGroups).toHaveBeenCalledWith(undefined, undefined);
    });

    it('returns paginated groups with limit and offset', async () => {
      const mockGroups = [
        { group_id: 2, name: 'Group B', use_new_generation: false, group_owner_id: 1 }
      ];
      
      mockedGroupService.getAllGroups.mockResolvedValue(mockGroups as any);

      const response = await request(app)
        .get('/groups?limit=10&offset=1')
        .expect(200);

      expect(response.body).toEqual(mockGroups);
      expect(mockedGroupService.getAllGroups).toHaveBeenCalledWith(10, 1);
    });

    it('returns validation error for invalid limit', async () => {
      const response = await request(app)
        .get('/groups?limit=-1')
        .expect(400);

      expect(response.body.message).toContain('Invalid limit parameter');
    });

    it('returns validation error for invalid offset', async () => {
      const response = await request(app)
        .get('/groups?offset=-1')
        .expect(400);

      expect(response.body.message).toContain('Invalid offset parameter');
    });
  });

  describe('GET /groups/:id', () => {
    it('returns group by valid ID', async () => {
      const mockGroup = { group_id: 1, name: 'Group A', use_new_generation: true, group_owner_id: 1 };
      
      mockedGroupService.getGroupById.mockResolvedValue(mockGroup as any);

      const response = await request(app)
        .get('/groups/1')
        .expect(200);

      expect(response.body).toEqual(mockGroup);
      expect(mockedGroupService.getGroupById).toHaveBeenCalledWith(1);
    });

    it('returns 404 when group not found', async () => {
      mockedGroupService.getGroupById.mockRejectedValue(new NotFoundError('Group with ID 999 not found'));

      const response = await request(app)
        .get('/groups/999')
        .expect(404);

      expect(response.body.message).toContain('Group with ID 999 not found');
    });

    it('returns validation error for invalid ID', async () => {
      const response = await request(app)
        .get('/groups/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for negative ID', async () => {
      const response = await request(app)
        .get('/groups/-1')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });
  });

  describe('POST /groups', () => {
    it('creates a new group successfully', async () => {
      const newGroupData = {
        name: 'New Group',
        use_new_generation: true,
        group_owner_id: 1
      };
      const createdGroup = { group_id: 3, ...newGroupData };

      mockedGroupService.createGroup.mockResolvedValue(createdGroup as any);

      const response = await request(app)
        .post('/groups')
        .send(newGroupData)
        .expect(201);

      expect(response.body).toEqual(createdGroup);
      expect(mockedGroupService.createGroup).toHaveBeenCalledWith(newGroupData);
    });

    it('handles service errors during creation', async () => {
      const newGroupData = {
        name: 'New Group',
        use_new_generation: true,
        group_owner_id: 1
      };

      mockedGroupService.createGroup.mockRejectedValue(new ValidationError('Name already exists'));

      const response = await request(app)
        .post('/groups')
        .send(newGroupData)
        .expect(400);

      expect(response.body.message).toContain('Name already exists');
    });
  });

  describe('PUT /groups/:id', () => {
    it('updates group successfully', async () => {
      const updateData = { name: 'Updated Group Name' };
      const updatedGroup = { group_id: 1, name: 'Updated Group Name', use_new_generation: true, group_owner_id: 1 };

      mockedGroupService.updateGroup.mockResolvedValue(updatedGroup as any);

      const response = await request(app)
        .put('/groups/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedGroup);
      expect(mockedGroupService.updateGroup).toHaveBeenCalledWith(1, updateData);
    });

    it('returns 404 when updating non-existent group', async () => {
      mockedGroupService.updateGroup.mockRejectedValue(new NotFoundError('Group with ID 999 not found'));

      const response = await request(app)
        .put('/groups/999')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.message).toContain('Group with ID 999 not found');
    });

    it('returns validation error for invalid ID', async () => {
      const response = await request(app)
        .put('/groups/invalid')
        .send({ name: 'Updated Name' })
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });
  });

  describe('DELETE /groups/:id', () => {
    it('deletes group successfully', async () => {
      mockedGroupService.deleteGroup.mockResolvedValue();

      const response = await request(app)
        .delete('/groups/1')
        .expect(204);

      expect(response.body).toEqual({});
      expect(mockedGroupService.deleteGroup).toHaveBeenCalledWith(1);
    });

    it('returns 404 when deleting non-existent group', async () => {
      mockedGroupService.deleteGroup.mockRejectedValue(new NotFoundError('Group with ID 999 not found'));

      const response = await request(app)
        .delete('/groups/999')
        .expect(404);

      expect(response.body.message).toContain('Group with ID 999 not found');
    });

    it('returns validation error for invalid ID', async () => {
      const response = await request(app)
        .delete('/groups/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });
  });

  describe('GET /groups/count', () => {
    it('returns total count of groups', async () => {
      mockedGroupService.getGroupCount.mockResolvedValue(42);

      const response = await request(app)
        .get('/groups/count')
        .expect(200);

      expect(response.body).toEqual({ count: 42 });
      expect(mockedGroupService.getGroupCount).toHaveBeenCalled();
    });

    it('handles service errors when getting count', async () => {
      mockedGroupService.getGroupCount.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/groups/count')
        .expect(500);

      expect(response.body.message).toContain('Database error');
    });
  });
});