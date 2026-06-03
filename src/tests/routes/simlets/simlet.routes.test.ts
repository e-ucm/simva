import request from 'supertest';
import { app } from '@/app';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors/appErrors';
import * as simletService from '@/services/simlets/simlet.service';

jest.mock('@/middlewares/auth.middleware', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = {
      sql: { user_id: 123, username: 'testuser', role: 'teacher' },
      data: { username: 'testuser', role: 'teacher' }
    };
    next();
  },
  roleAllowed: (_req: any, _res: any, next: any) => next()
}));

jest.mock('@/services/simlets/simlet.service');
const mockedSimletService = simletService as jest.Mocked<typeof simletService>;

describe('Simlet Routes', () => {
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

  it('GET /simlets returns simlets for current user', async () => {
    mockedSimletService.getSimletsByUserId.mockResolvedValue([{ simlet_id: 1 }] as any);

    const response = await request(app).get('/simlets').expect(200);

    expect(response.body).toEqual([{ simlet_id: 1 }]);
    expect(mockedSimletService.getSimletsByUserId).toHaveBeenCalledWith(123, '', undefined, undefined);
  });

  it('GET /simlets/:simlet_id returns one simlet', async () => {
    mockedSimletService.getSimletBySimletIdAndUserId.mockResolvedValue({ simlet_id: 5 } as any);

    const response = await request(app).get('/simlets/5').expect(200);

    expect(response.body).toEqual({ simlet_id: 5 });
    expect(mockedSimletService.getSimletBySimletIdAndUserId).toHaveBeenCalledWith(5, 123);
  });

  it('POST /simlets creates simlet and injects coordinator', async () => {
    mockedSimletService.createSimlet.mockResolvedValue({ simlet_id: 2 } as any);

    const response = await request(app)
      .post('/simlets')
      .send({ simlet_name: 'S1' })
      .expect(201);

    expect(response.body).toEqual({ simlet_id: 2 });
    expect(mockedSimletService.createSimlet).toHaveBeenCalledWith({ simlet_name: 'S1', simlet_coordinator_id: 123 });
  });

  it('PATCH /simlets/:simlet_id updates simlet', async () => {
    mockedSimletService.patch.mockResolvedValue({ simlet_id: 2, simlet_name: 'Updated' } as any);

    const response = await request(app)
      .patch('/simlets/2')
      .send({ simlet_name: 'Updated' })
      .expect(200);

    expect(response.body).toEqual({ simlet_id: 2, simlet_name: 'Updated' });
    expect(mockedSimletService.patch).toHaveBeenCalledWith(2, 123, { simlet_name: 'Updated' });
  });

  it('DELETE /simlets/:simlet_id deletes simlet', async () => {
    mockedSimletService.deleteSimlet.mockResolvedValue(undefined as any);

    await request(app).delete('/simlets/2').expect(204);

    expect(mockedSimletService.deleteSimlet).toHaveBeenCalledWith(2, 123);
  });

  it('GET /simlets/:simlet_id/sessions/:session_id/activities returns activities', async () => {
    mockedSimletService.getSessionActivities.mockResolvedValue([{ activity_id: 11 }] as any);

    const response = await request(app)
      .get('/simlets/5/sessions/9/activities')
      .expect(200);

    expect(response.body).toEqual([{ activity_id: 11 }]);
    expect(mockedSimletService.getSessionActivities).toHaveBeenCalledWith(5, 9, 123);
  });

  it('propagates service errors through middleware', async () => {
    mockedSimletService.getSimletBySimletIdAndUserId.mockRejectedValue(new NotFoundError('not found'));

    const response = await request(app).get('/simlets/999').expect(404);

    expect(response.body.message).toContain('not found');
  });
});
