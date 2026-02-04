/**
 * @fileoverview Comprehensive test suite for simlet controller.
 * Tests all CRUD operations and error scenarios for the simlet controller.
 * 
 * @module tests/controllers/simlets/simlet.controller.test
 * @requires jest
 * @requires @/controlers/simlets/simlet.controller
 * @requires @/services/simlets/simlet.service
 * @requires @/lib/errors/appErrors
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllSimlets,
  getSimletById,
  createSimlet,
  updateSimlet,
  deleteSimlet,
  getSimletsCount,
  searchSimlets,
  checkSimletExists,
  getSimletsWithSandbox,
  getMySimlets
} from '@/controlers/simlets/simlet.controller';
import { NotFoundError, AuthentificationError } from '@/lib/errors/appErrors';
import * as simletService from '@/services/simlets/simlet.service';

// Mock user types for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    sql?: {
      user_id?: number;
      username?: string;
      role?: string;
    };
    data?: {
      username?: string;
      role?: string;
    };
  };
}

// Mock simlet service
jest.mock('@/services/simlets/simlet.service');
const mockedSimletService = simletService as jest.Mocked<typeof simletService>;

describe('Simlet Controller Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockAuthReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockSimlet = {
    simlet_id: 1,
    mongo_id: null,
    name: 'Test Simlet',
    description: 'Test Description',
    objective: 'Test Objective',
    allocator_id: 1,
    simlet_coordinator_id: 123,
    sandbox_session_id: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      params: {},
      query: {},
      body: {}
    };

    mockAuthReq = {
      params: {},
      query: {},
      body: {},
      user: {
        sql: {
          user_id: 123,
          username: 'testuser',
          role: 'admin'
        },
        data: {
          username: 'testuser',
          role: 'admin'
        }
      }
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('getAllSimlets', () => {
    it('returns all simlets without pagination', async () => {
      const mockSimlets = [mockSimlet];
      mockedSimletService.getAllSimlets.mockResolvedValue(mockSimlets as any);

      await getAllSimlets(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.getAllSimlets).toHaveBeenCalledWith(undefined, undefined);
      expect(mockRes.json).toHaveBeenCalledWith(mockSimlets);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns paginated simlets when limit and offset provided', async () => {
      const mockSimlets = [mockSimlet];
      mockReq.query = { limit: '10', offset: '20' };
      mockedSimletService.getAllSimlets.mockResolvedValue(mockSimlets as any);

      await getAllSimlets(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.getAllSimlets).toHaveBeenCalledWith(10, 20);
      expect(mockRes.json).toHaveBeenCalledWith(mockSimlets);
    });

    it('returns simlets by coordinator when coordinator query provided', async () => {
      const mockSimlets = [mockSimlet];
      mockReq.query = { coordinator: '123' };
      mockedSimletService.getSimletsByCoordinator.mockResolvedValue(mockSimlets as any);

      await getAllSimlets(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.getSimletsByCoordinator).toHaveBeenCalledWith(123);
      expect(mockRes.json).toHaveBeenCalledWith(mockSimlets);
    });

    it('handles service errors properly', async () => {
      const error = new Error('Database error');
      mockedSimletService.getAllSimlets.mockRejectedValue(error);

      await getAllSimlets(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('getSimletById', () => {
    it('returns simlet by ID successfully', async () => {
      mockReq.params = { id: '1' };
      mockedSimletService.getSimletById.mockResolvedValue(mockSimlet as any);

      await getSimletById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.getSimletById).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockSimlet);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('handles not found errors', async () => {
      mockReq.params = { id: '999' };
      const error = new NotFoundError('Simlet with ID 999 not found');
      mockedSimletService.getSimletById.mockRejectedValue(error);

      await getSimletById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('createSimlet', () => {
    it('creates simlet successfully', async () => {
      const simletData = {
        name: 'New Simlet',
        description: 'New Description',
        allocator_id: 1,
        simlet_coordinator_id: 123
      };
      mockReq.body = simletData;
      mockedSimletService.createSimlet.mockResolvedValue(mockSimlet as any);

      await createSimlet(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.createSimlet).toHaveBeenCalledWith(simletData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockSimlet);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('handles validation errors', async () => {
      const error = new Error('Validation failed');
      mockReq.body = {};
      mockedSimletService.createSimlet.mockRejectedValue(error);

      await createSimlet(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('updateSimlet', () => {
    it('updates simlet successfully', async () => {
      const updateData = { name: 'Updated Simlet' };
      mockReq.params = { id: '1' };
      mockReq.body = updateData;
      const updatedSimlet = { ...mockSimlet, name: 'Updated Simlet' };
      mockedSimletService.updateSimlet.mockResolvedValue(updatedSimlet as any);

      await updateSimlet(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.updateSimlet).toHaveBeenCalledWith(1, updateData);
      expect(mockRes.json).toHaveBeenCalledWith(updatedSimlet);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('handles not found errors during update', async () => {
      mockReq.params = { id: '999' };
      mockReq.body = { name: 'Updated Simlet' };
      const error = new NotFoundError('Simlet with ID 999 not found');
      mockedSimletService.updateSimlet.mockRejectedValue(error);

      await updateSimlet(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteSimlet', () => {
    it('deletes simlet successfully', async () => {
      mockReq.params = { id: '1' };
      mockedSimletService.deleteSimlet.mockResolvedValue();

      await deleteSimlet(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.deleteSimlet).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('handles not found errors during delete', async () => {
      mockReq.params = { id: '999' };
      const error = new NotFoundError('Simlet with ID 999 not found');
      mockedSimletService.deleteSimlet.mockRejectedValue(error);

      await deleteSimlet(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.send).not.toHaveBeenCalled();
    });
  });

  describe('getSimletsCount', () => {
    it('returns total count when no filters provided', async () => {
      mockedSimletService.countSimlets.mockResolvedValue(42);

      await getSimletsCount(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.countSimlets).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ count: 42 });
    });

    it('returns count by coordinator when coordinator filter provided', async () => {
      mockReq.query = { coordinator: '123' };
      mockedSimletService.countSimletsByCoordinator.mockResolvedValue(5);

      await getSimletsCount(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.countSimletsByCoordinator).toHaveBeenCalledWith(123);
      expect(mockRes.json).toHaveBeenCalledWith({ count: 5 });
    });

    it('returns count by allocator when allocator filter provided', async () => {
      mockReq.query = { allocator: '456' };
      mockedSimletService.countSimletsByAllocator.mockResolvedValue(3);

      await getSimletsCount(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.countSimletsByAllocator).toHaveBeenCalledWith(456);
      expect(mockRes.json).toHaveBeenCalledWith({ count: 3 });
    });
  });

  describe('searchSimlets', () => {
    it('returns search results for valid query', async () => {
      mockReq.query = { q: 'math' };
      const nameResults = [mockSimlet];
      const descriptionResults = [];
      mockedSimletService.searchSimletsByName.mockResolvedValue(nameResults as any);
      mockedSimletService.searchSimletsByDescription.mockResolvedValue(descriptionResults as any);

      await searchSimlets(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.searchSimletsByName).toHaveBeenCalledWith('math');
      expect(mockedSimletService.searchSimletsByDescription).toHaveBeenCalledWith('math');
      expect(mockRes.json).toHaveBeenCalledWith(nameResults);
    });

    it('returns empty array when no search term provided', async () => {
      mockReq.query = {};

      await searchSimlets(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith([]);
      expect(mockedSimletService.searchSimletsByName).not.toHaveBeenCalled();
    });

    it('deduplicates results from name and description searches', async () => {
      mockReq.query = { q: 'test' };
      const nameResults = [mockSimlet];
      const descriptionResults = [mockSimlet, { ...mockSimlet, simlet_id: 2 }];
      mockedSimletService.searchSimletsByName.mockResolvedValue(nameResults as any);
      mockedSimletService.searchSimletsByDescription.mockResolvedValue(descriptionResults as any);

      await searchSimlets(mockReq as Request, mockRes as Response, mockNext);

      const expectedResults = [mockSimlet, { ...mockSimlet, simlet_id: 2 }];
      expect(mockRes.json).toHaveBeenCalledWith(expectedResults);
    });
  });

  describe('checkSimletExists', () => {
    it('returns true when simlet exists', async () => {
      mockReq.params = { id: '1' };
      mockedSimletService.simletExists.mockResolvedValue(true);

      await checkSimletExists(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.simletExists).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({ exists: true });
    });

    it('returns false when simlet does not exist', async () => {
      mockReq.params = { id: '999' };
      mockedSimletService.simletExists.mockResolvedValue(false);

      await checkSimletExists(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ exists: false });
    });
  });

  describe('getSimletsWithSandbox', () => {
    it('returns simlets with sandbox sessions', async () => {
      const sandboxSimlets = [mockSimlet];
      mockedSimletService.getSimletsWithSandbox.mockResolvedValue(sandboxSimlets as any);

      await getSimletsWithSandbox(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedSimletService.getSimletsWithSandbox).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(sandboxSimlets);
    });
  });

  describe('getMySimlets', () => {
    it('returns current user simlets when authenticated', async () => {
      const mySimlets = [mockSimlet];
      mockedSimletService.getSimletsByCoordinator.mockResolvedValue(mySimlets as any);

      await getMySimlets(mockAuthReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockedSimletService.getSimletsByCoordinator).toHaveBeenCalledWith(123);
      expect(mockRes.json).toHaveBeenCalledWith(mySimlets);
    });

    it('throws AuthentificationError when user_id is missing', async () => {
      const authReq = { 
        ...mockAuthReq, 
        user: { sql: { username: 'test' }, data: { username: 'test' } } 
      };

      await getMySimlets(authReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
    });

    it('throws AuthentificationError when user is not authenticated', async () => {
      const authReq = { ...mockAuthReq, user: undefined };

      await getMySimlets(authReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    });

    it('throws AuthentificationError when user.sql is missing', async () => {
      const authReq = { ...mockAuthReq, user: { data: { username: 'test' } } };

      await getMySimlets(authReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    });
  });
});