import request from 'supertest';
import { app } from '@/app';
import { db } from '@/lib/db';

// Mock the auth middleware
jest.mock('@/middlewares/auth.middleware', () => ({
  auth: (req: any, res: any, next: any) => {
    // Mock user for tests
    req.user = {
      data: {
        username: 'testuser',
        role: 'admin'
      }
    };
    next();
  }
}));

describe('GET /users', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await db.sequelize.sync({ force: true });
    await db.Tables.User.create({
      user_id: 1,
      username: 'alice',
      email: 'alice@example.com',
      isToken: false,
      token: null,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('returns list of users', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].username).toBe('alice');
  });
});
