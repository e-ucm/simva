/**
 * @fileoverview Comprehensive integration test suite for simlet routes.
 * Tests all HTTP methods and authentication scenarios for simlet endpoints.
 * 
 * @module tests/routes/simlets/simlet.routes.test
 * @requires jest
 * @requires supertest
 * @requires @/app
 * @requires @/lib/db
 * @requires @/services/simlets/simlet.service
 * @requires @/lib/errors/appErrors
 */

import request from 'supertest';
import { app } from '@/app';
import { db } from '@/lib/db';
import { NotFoundError, AuthentificationError } from '@/lib/errors/appErrors';
import * as simletService from '@/services/simlets/simlet.service';

// Mock the auth middleware
jest.mock('@/middlewares/auth.middleware', () => ({
  auth: (req: any, res: any, next: any) => {
    // Mock user for tests
    req.user = {
      sql: {
        user_id: 123,
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

// Mock simlet service
jest.mock('@/services/simlets/simlet.service');
const mockedSimletService = simletService as jest.Mocked<typeof simletService>;

describe('Simlet Routes Integration Tests', () => {
  const mockSimlet = {
    simlet_id: 1,
    mongo_id: null,
    name: 'Test Simlet',
    description: 'Test Description',
    objective: 'Test Objective',
    allocator_id: 1,
    simlet_coordinator_id: 123,
    sandbox_session_id: null,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

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

  describe('GET /simlets', () => {
    it('returns all simlets successfully', async () => {
      const mockSimlets = [mockSimlet];
      mockedSimletService.getAllSimlets.mockResolvedValue(mockSimlets as any);

      const res = await request(app).get('/simlets');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual(mockSimlets);
      expect(mockedSimletService.getAllSimlets).toHaveBeenCalledWith(undefined, undefined);
    });

    it('returns paginated simlets when limit and offset provided', async () => {
      const mockSimlets = [mockSimlet];
      mockedSimletService.getAllSimlets.mockResolvedValue(mockSimlets as any);

      const res = await request(app).get('/simlets?limit=10&offset=20');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSimlets);
      expect(mockedSimletService.getAllSimlets).toHaveBeenCalledWith(10, 20);
    });

    it('returns simlets by coordinator when coordinator filter provided', async () => {
      const mockSimlets = [mockSimlet];
      mockedSimletService.getSimletsByCoordinator.mockResolvedValue(mockSimlets as any);

      const res = await request(app).get('/simlets?coordinator=123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSimlets);
      expect(mockedSimletService.getSimletsByCoordinator).toHaveBeenCalledWith(123);
    });

    it('handles service errors properly', async () => {
      mockedSimletService.getAllSimlets.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app).get('/simlets');

      expect(res.status).toBe(500);
      expect(mockedSimletService.getAllSimlets).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /simlets/:id', () => {
    it('returns simlet by ID successfully', async () => {
      mockedSimletService.getSimletById.mockResolvedValue(mockSimlet as any);

      const res = await request(app).get('/simlets/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSimlet);
      expect(mockedSimletService.getSimletById).toHaveBeenCalledWith(1);
    });

    it('returns 404 when simlet not found', async () => {
      mockedSimletService.getSimletById.mockRejectedValue(new NotFoundError('Simlet with ID 999 not found'));

      const res = await request(app).get('/simlets/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(mockedSimletService.getSimletById).toHaveBeenCalledWith(999);
    });

    it('handles invalid simlet ID parameter', async () => {
      const res = await request(app).get('/simlets/invalid-id');

      expect(res.status).toBe(404);
      expect(mockedSimletService.getSimletById).toHaveBeenCalledWith(NaN);
    });
  });

  describe('POST /simlets', () => {
    it('creates a new simlet successfully', async () => {
      const newSimletData = {
        name: 'New Simlet',
        description: 'New Description',
        objective: 'New Objective',
        allocator_id: 1,
        simlet_coordinator_id: 123
      };

      const createdSimlet = {
        simlet_id: 2,
        ...newSimletData,
        mongo_id: null,
        sandbox_session_id: null,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      mockedSimletService.createSimlet.mockResolvedValue(createdSimlet as any);

      const res = await request(app)
        .post('/simlets')
        .send(newSimletData);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdSimlet);
      expect(mockedSimletService.createSimlet).toHaveBeenCalledWith(newSimletData);
    });

    it('handles validation errors during simlet creation', async () => {
      const invalidSimletData = {
        name: '',
        description: ''
      };

      mockedSimletService.createSimlet.mockRejectedValue(new Error('Validation failed'));

      const res = await request(app)
        .post('/simlets')
        .send(invalidSimletData);

      expect(res.status).toBe(500);
      expect(mockedSimletService.createSimlet).toHaveBeenCalledWith(invalidSimletData);
    });

    it('handles database errors during simlet creation', async () => {
      const newSimletData = {
        name: 'New Simlet',
        description: 'New Description',
        allocator_id: 1,
        simlet_coordinator_id: 123
      };

      mockedSimletService.createSimlet.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .post('/simlets')
        .send(newSimletData);

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /simlets/:id', () => {
    it('updates simlet successfully', async () => {
      const updateData = { name: 'Updated Simlet Name' };
      const updatedSimlet = { ...mockSimlet, name: 'Updated Simlet Name' };

      mockedSimletService.updateSimlet.mockResolvedValue(updatedSimlet as any);

      const res = await request(app)
        .put('/simlets/1')
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedSimlet);
      expect(mockedSimletService.updateSimlet).toHaveBeenCalledWith(1, updateData);
    });

    it('handles update of non-existent simlet', async () => {
      const updateData = { name: 'Updated Name' };
      mockedSimletService.updateSimlet.mockRejectedValue(new NotFoundError('Simlet with ID 999 not found'));

      const res = await request(app)
        .put('/simlets/999')
        .send(updateData);

      expect(res.status).toBe(404);
      expect(mockedSimletService.updateSimlet).toHaveBeenCalledWith(999, updateData);
    });

    it('handles invalid simlet ID parameter', async () => {
      const updateData = { name: 'Updated Name' };

      const res = await request(app)
        .put('/simlets/invalid-id')
        .send(updateData);

      expect(res.status).toBe(404);
      expect(mockedSimletService.updateSimlet).toHaveBeenCalledWith(NaN, updateData);
    });

    it('handles database errors during update', async () => {
      const updateData = { name: 'Updated Name' };
      mockedSimletService.updateSimlet.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .put('/simlets/1')
        .send(updateData);

      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /simlets/:id', () => {
    it('deletes simlet successfully', async () => {
      mockedSimletService.deleteSimlet.mockResolvedValue();

      const res = await request(app).delete('/simlets/1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(mockedSimletService.deleteSimlet).toHaveBeenCalledWith(1);
    });

    it('handles deletion of non-existent simlet', async () => {
      mockedSimletService.deleteSimlet.mockRejectedValue(new NotFoundError('Simlet with ID 999 not found'));

      const res = await request(app).delete('/simlets/999');

      expect(res.status).toBe(404);
      expect(mockedSimletService.deleteSimlet).toHaveBeenCalledWith(999);
    });

    it('handles invalid simlet ID parameter', async () => {
      const res = await request(app).delete('/simlets/invalid-id');

      expect(res.status).toBe(404);
      expect(mockedSimletService.deleteSimlet).toHaveBeenCalledWith(NaN);
    });

    it('handles database errors during deletion', async () => {
      mockedSimletService.deleteSimlet.mockRejectedValue(new Error('Database error'));

      const res = await request(app).delete('/simlets/1');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /simlets/count', () => {
    it('returns total count when no filters provided', async () => {
      mockedSimletService.countSimlets.mockResolvedValue(42);

      const res = await request(app).get('/simlets/count');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ count: 42 });
      expect(mockedSimletService.countSimlets).toHaveBeenCalled();
    });

    it('returns count by coordinator when coordinator filter provided', async () => {
      mockedSimletService.countSimletsByCoordinator.mockResolvedValue(5);

      const res = await request(app).get('/simlets/count?coordinator=123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ count: 5 });
      expect(mockedSimletService.countSimletsByCoordinator).toHaveBeenCalledWith(123);
    });

    it('returns count by allocator when allocator filter provided', async () => {
      mockedSimletService.countSimletsByAllocator.mockResolvedValue(3);

      const res = await request(app).get('/simlets/count?allocator=456');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ count: 3 });
      expect(mockedSimletService.countSimletsByAllocator).toHaveBeenCalledWith(456);
    });
  });

  describe('GET /simlets/search', () => {
    it('returns search results for valid query', async () => {
      const searchResults = [mockSimlet];
      mockedSimletService.searchSimletsByName.mockResolvedValue(searchResults as any);
      mockedSimletService.searchSimletsByDescription.mockResolvedValue([] as any);

      const res = await request(app).get('/simlets/search?q=math');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(searchResults);
      expect(mockedSimletService.searchSimletsByName).toHaveBeenCalledWith('math');
      expect(mockedSimletService.searchSimletsByDescription).toHaveBeenCalledWith('math');
    });

    it('returns empty array when no search term provided', async () => {
      const res = await request(app).get('/simlets/search');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('handles service errors during search', async () => {
      mockedSimletService.searchSimletsByName.mockRejectedValue(new Error('Search error'));

      const res = await request(app).get('/simlets/search?q=test');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /simlets/sandbox', () => {
    it('returns simlets with sandbox sessions', async () => {
      const sandboxSimlets = [mockSimlet];
      mockedSimletService.getSimletsWithSandbox.mockResolvedValue(sandboxSimlets as any);

      const res = await request(app).get('/simlets/sandbox');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(sandboxSimlets);
      expect(mockedSimletService.getSimletsWithSandbox).toHaveBeenCalled();
    });

    it('handles service errors', async () => {
      mockedSimletService.getSimletsWithSandbox.mockRejectedValue(new Error('Service error'));

      const res = await request(app).get('/simlets/sandbox');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /simlets/me', () => {
    it('returns current user coordinated simlets', async () => {
      const mySimlets = [mockSimlet];
      mockedSimletService.getSimletsByCoordinator.mockResolvedValue(mySimlets as any);

      const res = await request(app).get('/simlets/me');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mySimlets);
      expect(mockedSimletService.getSimletsByCoordinator).toHaveBeenCalledWith(123);
    });

    it('handles authentication errors', async () => {
      // Temporarily override auth middleware to simulate authentication failure
      jest.doMock('@/middlewares/auth.middleware', () => ({
        auth: (req: any, res: any, next: any) => {
          req.user = undefined;
          next();
        }
      }));

      const res = await request(app).get('/simlets/me');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /simlets/:id/exists', () => {
    it('returns true when simlet exists', async () => {
      mockedSimletService.simletExists.mockResolvedValue(true);

      const res = await request(app).get('/simlets/1/exists');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ exists: true });
      expect(mockedSimletService.simletExists).toHaveBeenCalledWith(1);
    });

    it('returns false when simlet does not exist', async () => {
      mockedSimletService.simletExists.mockResolvedValue(false);

      const res = await request(app).get('/simlets/999/exists');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ exists: false });
      expect(mockedSimletService.simletExists).toHaveBeenCalledWith(999);
    });

    it('handles service errors', async () => {
      mockedSimletService.simletExists.mockRejectedValue(new Error('Service error'));

      const res = await request(app).get('/simlets/1/exists');

      expect(res.status).toBe(500);
    });
  });

  describe('Route path conflicts', () => {
    it('routes to specific endpoints before parameterized routes', async () => {
      // This test ensures /simlets/count routes to getSimletsCount instead of getSimletById with id='count'
      mockedSimletService.countSimlets.mockResolvedValue(10);

      const res = await request(app).get('/simlets/count');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ count: 10 });
      expect(mockedSimletService.countSimlets).toHaveBeenCalled();
      expect(mockedSimletService.getSimletById).not.toHaveBeenCalled();
    });

    it('routes search endpoint correctly', async () => {
      mockedSimletService.searchSimletsByName.mockResolvedValue([]);
      mockedSimletService.searchSimletsByDescription.mockResolvedValue([]);

      const res = await request(app).get('/simlets/search?q=test');

      expect(res.status).toBe(200);
      expect(mockedSimletService.searchSimletsByName).toHaveBeenCalledWith('test');
      expect(mockedSimletService.getSimletById).not.toHaveBeenCalled();
    });

    it('routes sandbox endpoint correctly', async () => {
      mockedSimletService.getSimletsWithSandbox.mockResolvedValue([]);

      const res = await request(app).get('/simlets/sandbox');

      expect(res.status).toBe(200);
      expect(mockedSimletService.getSimletsWithSandbox).toHaveBeenCalled();
      expect(mockedSimletService.getSimletById).not.toHaveBeenCalled();
    });

    it('routes me endpoint correctly', async () => {
      mockedSimletService.getSimletsByCoordinator.mockResolvedValue([]);

      const res = await request(app).get('/simlets/me');

      expect(res.status).toBe(200);
      expect(mockedSimletService.getSimletsByCoordinator).toHaveBeenCalledWith(123);
      expect(mockedSimletService.getSimletById).not.toHaveBeenCalled();
    });
  });
});