import { jest, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';
import { NotFoundError } from '@/lib/errors/appErrors';

jest.unstable_mockModule('@/middlewares/auth.middleware', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = {
      sql: { user_id: 1, username: 'testuser', role: 'admin' },
      data: { username: 'testuser', role: 'admin' }
    };
    next();
  },
  roleAllowed: (_req: any, _res: any, next: any) => next(),
  Authenticator: {}
}));

jest.unstable_mockModule('@/services/users/user.service', () => ({
  getUserByUsername: jest.fn(),
  getAllUsers: jest.fn(),
  updateUser: jest.fn(),
  getUserById: jest.fn()
}));

let app: Express;
let mockedUserService: {
  getUserByUsername: jest.Mock;
  getAllUsers: jest.Mock;
  updateUser: jest.Mock;
  getUserById: jest.Mock;
};

const userMapper = (data: any = {}) => ({
  user_id: 1,
  username: 'alice',
  isToken: false,
  token: 'test-token',
  email: 'alice@example.com',
  role: 'teacher',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...data
});

beforeAll(async () => {
  app = (await import('@/app')).app;
  const userService = await import('@/services/users/user.service');
  mockedUserService = {
    getUserByUsername: userService.getUserByUsername as unknown as jest.Mock,
    getAllUsers: userService.getAllUsers as unknown as jest.Mock,
    updateUser: userService.updateUser as unknown as jest.Mock,
    getUserById: userService.getUserById as unknown as jest.Mock
  };
});

describe('User Controller Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('returns the list of users for an admin without filters', async () => {
      const users = [
        userMapper({ user_id: 1, username: 'alice', role: 'administrator' }),
        userMapper({ user_id: 2, username: 'bob', role: 'student' })
      ];
      mockedUserService.getAllUsers.mockResolvedValue(users as any);

      const res = await request(app).get('/users');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(users);
      expect(mockedUserService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(mockedUserService.getAllUsers).toHaveBeenCalledWith(undefined, NaN, undefined);
    });

    it('returns a specific user when the username query parameter is provided', async () => {
      const user = userMapper({ username: 'alice', role: 'administrator' });
      mockedUserService.getUserByUsername.mockResolvedValue(user as any);

      const res = await request(app).get('/users?username=alice');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(user);
      expect(mockedUserService.getUserByUsername).toHaveBeenCalledWith('alice');
    });

    it('forwards search and pagination query params to the service', async () => {
      const users = [userMapper({ username: 'ali', role: 'student' })];
      mockedUserService.getAllUsers.mockResolvedValue(users as any);

      const res = await request(app).get('/users?searchString=ali&limit=10&skip=5');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(users);
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
    it('updates the current authenticated user', async () => {
      const updatedUser = userMapper({ username: 'testuser', role: 'teacher' });
      mockedUserService.updateUser.mockResolvedValue(updatedUser as any);

      const res = await request(app)
        .patch('/users/alice')
        .send({ role: 'teacher' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedUser);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith(1, { role: 'teacher' });
    });

    it('ignores the username path parameter and updates the authenticated user', async () => {
      const updatedUser = userMapper({ username: 'testuser', role: 'teacher' });
      mockedUserService.updateUser.mockResolvedValue(updatedUser as any);

      const res = await request(app)
        .patch('/users/nonexistent')
        .send({ role: 'teacher' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedUser);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith(1, { role: 'teacher' });
    });

    it('handles database errors during update', async () => {
      mockedUserService.updateUser.mockRejectedValue(new Error('Database error'));

      const res = await request(app).patch('/users/alice').send({ role: 'teacher' });

      expect(res.status).toBe(500);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith(1, { role: 'teacher' });
    });
  });

  describe('GET /users/me', () => {
    it('returns the current authenticated user', async () => {
      const user = userMapper({ username: 'testuser', role: 'administrator' });
      mockedUserService.getUserById.mockResolvedValue(user as any);

      const res = await request(app).get('/users/me');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(user);
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
    });

    it('returns 404 when the authenticated user is not found in the database', async () => {
      mockedUserService.getUserById.mockRejectedValue(new NotFoundError('User not found'));

      const res = await request(app).get('/users/me');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
    });

    it('handles database errors when fetching the current user', async () => {
      mockedUserService.getUserById.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/users/me');

      expect(res.status).toBe(500);
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
    });
  });
});