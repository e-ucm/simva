import request from 'supertest';
import { app } from '@/app';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors/appErrors';
import * as userService from '@/services/users/user.service';

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
  },
  roleAllowed: (_req: any, _res: any, next: any) => next()
}));

// Mock user service
jest.mock('@/services/users/user.service');
const mockedUserService = userService as jest.Mocked<typeof userService>;

describe('User Controller Routes', () => {
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

  describe('GET /users', () => {
    it('returns list of all users when no query parameters', async () => {
      const mockUsers = [
        { user_id: 1, username: 'alice', email: 'alice@example.com', role: 'admin' },
        { user_id: 2, username: 'bob', email: 'bob@example.com', role: 'student' }
      ];
      
      mockedUserService.getAllUsers.mockResolvedValue(mockUsers as any);
      
      const res = await request(app).get('/users');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual(mockUsers);
      expect(mockedUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('returns specific user when username query parameter is provided', async () => {
      const mockUser = { user_id: 1, username: 'alice', email: 'alice@example.com', role: 'admin' };
      
      mockedUserService.getUserByUsername.mockResolvedValue(mockUser as any);
      
      const res = await request(app).get('/users?username=alice');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUser);
      expect(mockedUserService.getUserByUsername).toHaveBeenCalledWith('alice');
    });

    it('forwards query params for paginated search', async () => {
      const mockUsers = [{ user_id: 1, username: 'alice', email: 'alice@example.com', role: 'admin' }];

      mockedUserService.getAllUsers.mockResolvedValue(mockUsers as any);

      const res = await request(app).get('/users?searchstring=ali&limit=10&offset=5');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUsers);
      expect(mockedUserService.getAllUsers).toHaveBeenCalledWith(10, 5, 'ali');
    });

    it('handles service errors properly', async () => {
      mockedUserService.getAllUsers.mockRejectedValue(new Error('Database connection failed'));
      
      const res = await request(app).get('/users');
      
      expect(res.status).toBe(500);
      expect(mockedUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH /users/:username', () => {
    it('updates current authenticated user successfully', async () => {
      const updateData = { role: 'teacher' };
      
      const updatedUser = { 
        user_id: 1,
        username: 'testuser',
        email: 'testuser@example.com',
        role: 'teacher',
        updatedAt: new Date().toISOString()
      };
      
      mockedUserService.updateUser.mockResolvedValue(updatedUser as any);
      
      const res = await request(app)
        .patch('/users/alice')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedUser);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith(1, updateData);
    });

    it('ignores username path parameter and updates authenticated user', async () => {
      const updateData = { role: 'teacher' };
      const updatedUser = { user_id: 1, username: 'testuser', role: 'teacher' };

      mockedUserService.updateUser.mockResolvedValue(updatedUser as any);
      
      const res = await request(app)
        .patch('/users/nonexistent')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedUser);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith(1, updateData);
    });

    it('handles database errors during update', async () => {
      const updateData = { role: 'teacher' };

      mockedUserService.updateUser.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .patch('/users/alice')
        .send(updateData);
      
      expect(res.status).toBe(500);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith(1, updateData);
    });

    it('handles validation errors during update', async () => {
      const invalidUpdateData = { email: 'invalid-email' };

      mockedUserService.updateUser.mockRejectedValue(new Error('Validation failed'));
      
      const res = await request(app)
        .patch('/users/alice')
        .send(invalidUpdateData);
      
      expect(res.status).toBe(500);
    });
  });

  describe('GET /users/me', () => {
    it('returns current authenticated user', async () => {
      const mockUser = { 
        user_id: 1, 
        username: 'testuser', 
        email: 'testuser@example.com', 
        role: 'admin' 
      };
      
      mockedUserService.getUserById.mockResolvedValue(mockUser as any);
      
      const res = await request(app).get('/users/me');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUser);
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1); // user_id from mocked auth
    });

    it('returns 404 when authenticated user not found in database', async () => {
      mockedUserService.getUserById.mockRejectedValue(new NotFoundError('User not found'));
      
      const res = await request(app).get('/users/me');
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
    });

    it('handles database errors when fetching current user', async () => {
      mockedUserService.getUserById.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app).get('/users/me');
      
      expect(res.status).toBe(500);
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
    });
  });
});
