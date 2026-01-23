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
  }
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

    it('returns 404 when user not found by username', async () => {
      mockedUserService.getUserByUsername.mockResolvedValue(null as any);
      
      const res = await request(app).get('/users?username=nonexistent');
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(mockedUserService.getUserByUsername).toHaveBeenCalledWith('nonexistent');
    });

    it('handles service errors properly', async () => {
      mockedUserService.getAllUsers.mockRejectedValue(new Error('Database connection failed'));
      
      const res = await request(app).get('/users');
      
      expect(res.status).toBe(500);
      expect(mockedUserService.getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /users', () => {
    it('creates a new user successfully', async () => {
      const newUserData = {
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'student'
      };
      
      const createdUser = {
        user_id: 3,
        ...newUserData,
        createdAt: `"${new Date()}"`,
        updatedAt: `"${new Date()}"`
      };
      
      mockedUserService.createUser.mockResolvedValue(createdUser as any);
      
      const res = await request(app)
        .post('/users')
        .send(newUserData);
      
      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdUser);
      expect(mockedUserService.createUser).toHaveBeenCalledWith(newUserData);
    });

    it('handles validation errors during user creation', async () => {
      const invalidUserData = {
        username: '',
        email: 'invalid-email'
      };
      
      mockedUserService.createUser.mockRejectedValue(new Error('Validation failed'));
      
      const res = await request(app)
        .post('/users')
        .send(invalidUserData);
      
      expect(res.status).toBe(500);
      expect(mockedUserService.createUser).toHaveBeenCalledWith(invalidUserData);
    });

    it('handles database errors during user creation', async () => {
      const newUserData = {
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'student'
      };
      
      mockedUserService.createUser.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .post('/users')
        .send(newUserData);
      
      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /users/:id', () => {
    it('deletes user successfully', async () => {
      mockedUserService.deleteUserById.mockResolvedValue(undefined);
      
      const res = await request(app).delete('/users/1');
      
      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(mockedUserService.deleteUserById).toHaveBeenCalledWith(1);
    });

    it('handles deletion of non-existent user', async () => {
      mockedUserService.deleteUserById.mockRejectedValue(new NotFoundError('User not found'));
      
      const res = await request(app).delete('/users/999');
      
      expect(res.status).toBe(404);
      expect(mockedUserService.deleteUserById).toHaveBeenCalledWith(999);
    });

    it('handles invalid user ID parameter', async () => {
      const res = await request(app).delete('/users/invalid-id');
      
      expect(res.status).toBe(404);
      // NaN is passed when invalid number
      expect(mockedUserService.deleteUserById).toHaveBeenCalledWith(NaN);
    });

    it('handles database errors during deletion', async () => {
      mockedUserService.deleteUserById.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app).delete('/users/1');
      
      expect(res.status).toBe(500);
    });
  });

  describe('PATCH /users/:username', () => {
    it('updates user successfully', async () => {
      const mockUser = { 
        user_id: 1, 
        username: 'alice', 
        email: 'alice@example.com', 
        role: 'student' 
      };
      
      const updateData = { role: 'teacher' };
      
      const updatedUser = { 
        ...mockUser, 
        role: 'teacher',
        updatedAt: new Date().toISOString()
      };
      
      mockedUserService.getUserByUsername.mockResolvedValue(mockUser as any);
      mockedUserService.updateUserById.mockResolvedValue(updatedUser as any);
      
      const res = await request(app)
        .patch('/users/alice')
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedUser);
      expect(mockedUserService.getUserByUsername).toHaveBeenCalledWith('alice');
      expect(mockedUserService.updateUserById).toHaveBeenCalledWith(1, updateData);
    });

    it('returns 404 when updating non-existent user', async () => {
      const updateData = { role: 'teacher' };
      
      mockedUserService.getUserByUsername.mockResolvedValue(null as any);
      
      const res = await request(app)
        .patch('/users/nonexistent')
        .send(updateData);
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(mockedUserService.getUserByUsername).toHaveBeenCalledWith('nonexistent');
      expect(mockedUserService.updateUserById).not.toHaveBeenCalled();
    });

    it('handles database errors during update', async () => {
      const mockUser = { 
        user_id: 1, 
        username: 'alice', 
        email: 'alice@example.com', 
        role: 'student' 
      };
      
      const updateData = { role: 'teacher' };
      
      mockedUserService.getUserByUsername.mockResolvedValue(mockUser as any);
      mockedUserService.updateUserById.mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .patch('/users/alice')
        .send(updateData);
      
      expect(res.status).toBe(500);
      expect(mockedUserService.getUserByUsername).toHaveBeenCalledWith('alice');
      expect(mockedUserService.updateUserById).toHaveBeenCalledWith(1, updateData);
    });

    it('handles validation errors during update', async () => {
      const mockUser = { 
        user_id: 1, 
        username: 'alice', 
        email: 'alice@example.com', 
        role: 'student' 
      };
      
      const invalidUpdateData = { email: 'invalid-email' };
      
      mockedUserService.getUserByUsername.mockResolvedValue(mockUser as any);
      mockedUserService.updateUserById.mockRejectedValue(new Error('Validation failed'));
      
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
