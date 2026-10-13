import { jest, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { Express } from 'express';
import { NotFoundError } from '@/lib/errors/appErrors';

jest.unstable_mockModule('@/middlewares/auth.middleware', () => ({
  auth: (req: any, _res: any, next: any) => {
    req.user = {
      sql: { user_id: 123, username: 'testuser', role: 'teacher' },
      data: { username: 'testuser', role: 'teacher' }
    };
    next();
  },
  roleAllowed: (_req: any, _res: any, next: any) => next(),
  Authenticator: {}
}));

jest.unstable_mockModule('@/services/simlets/simlet.service', () => ({
  getSimletsByUserId: jest.fn(),
  getSimletBySimletIdAndUserId: jest.fn(),
  createSimlet: jest.fn(),
  patch: jest.fn(),
  deleteSimlet: jest.fn()
}));

let app: Express;
let mockedSimletService: {
  getSimletsByUserId: jest.Mock;
  getSimletBySimletIdAndUserId: jest.Mock;
  createSimlet: jest.Mock;
  patch: jest.Mock;
  deleteSimlet: jest.Mock;
};

const simletMapper = (data: any = {}) => ({
  simlet_id: 5,
  simlet_name: 'S1',
  simlet_description: 'desc',
  simlet_archived: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  sessions: [],
  groups: [],
  tags: [],
  ...data
});

const simletWith = (data: any = {}) => ({ toJSON: () => simletMapper(data) });

beforeAll(async () => {
  app = (await import('@/app')).app;
  const simletService = await import('@/services/simlets/simlet.service');
  mockedSimletService = {
    getSimletsByUserId: simletService.getSimletsByUserId as unknown as jest.Mock,
    getSimletBySimletIdAndUserId: simletService.getSimletBySimletIdAndUserId as unknown as jest.Mock,
    createSimlet: simletService.createSimlet as unknown as jest.Mock,
    patch: simletService.patch as unknown as jest.Mock,
    deleteSimlet: simletService.deleteSimlet as unknown as jest.Mock
  };
});

describe('Simlet Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /simlets returns simlets for the current user', async () => {
    mockedSimletService.getSimletsByUserId.mockResolvedValue([simletWith()] as any);

    const response = await request(app).get('/simlets').expect(200);

    expect(response.body).toEqual([simletMapper()]);
    expect(mockedSimletService.getSimletsByUserId).toHaveBeenCalledWith(123, undefined, undefined, undefined, undefined, NaN, undefined, undefined);
  });

  it('GET /simlets/:simlet_id returns one simlet', async () => {
    mockedSimletService.getSimletBySimletIdAndUserId.mockResolvedValue(simletWith({ simlet_id: 5 }) as any);

    const response = await request(app).get('/simlets/5').expect(200);

    expect(response.body).toEqual(simletMapper({ simlet_id: 5 }));
    expect(mockedSimletService.getSimletBySimletIdAndUserId).toHaveBeenCalledWith(5, false, 123);
  });

  it('POST /simlets creates a simlet and injects the coordinator', async () => {
    mockedSimletService.createSimlet.mockResolvedValue(simletWith({ simlet_id: 2 }) as any);

    const response = await request(app)
      .post('/simlets')
      .send({ simlet_name: 'S1', simlet_description: 'desc' })
      .expect(201);

    expect(response.body).toEqual(simletMapper({ simlet_id: 2 }));
    expect(mockedSimletService.createSimlet).toHaveBeenCalledWith(
      { simlet_name: 'S1', simlet_description: 'desc' },
      false,
      123
    );
  });

  it('PATCH /simlets/:simlet_id updates a simlet', async () => {
    mockedSimletService.patch.mockResolvedValue(simletWith({ simlet_id: 2, simlet_name: 'Updated' }) as any);

    const response = await request(app)
      .patch('/simlets/2')
      .send({ simlet_name: 'Updated' })
      .expect(200);

    expect(response.body).toEqual(simletMapper({ simlet_id: 2, simlet_name: 'Updated' }));
    expect(mockedSimletService.patch).toHaveBeenCalledWith(2, { simlet_name: 'Updated' }, false, 123);
  });

  it('DELETE /simlets/:simlet_id deletes a simlet', async () => {
    mockedSimletService.deleteSimlet.mockResolvedValue(undefined as any);

    await request(app).delete('/simlets/2').expect(204);

    expect(mockedSimletService.deleteSimlet).toHaveBeenCalledWith(2, false, 123);
  });

  it('propagates service errors through the error middleware', async () => {
    mockedSimletService.getSimletBySimletIdAndUserId.mockRejectedValue(new NotFoundError('not found'));

    const response = await request(app).get('/simlets/999').expect(404);

    expect(response.body.message).toContain('not found');
  });
});