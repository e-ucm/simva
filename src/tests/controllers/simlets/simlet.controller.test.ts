import { Request, Response, NextFunction } from 'express';
import {
  getAllSimlets,
  getSimletById,
  createSimlet,
  patchSimlet,
  deleteSimlet,
  getSimletCount
} from '@/controlers/simlets/simlet.controler';
import * as simletService from '@/services/simlets/simlet.service';

jest.mock('@/services/simlets/simlet.service');
const mockedSimletService = simletService as jest.Mocked<typeof simletService>;

type MockAuthReq = Partial<Request> & {
  user?: {
    sql?: {
      user_id?: number;
      role?: string;
    };
  };
};

describe('Simlet Controller Unit Tests', () => {
  let mockReq: MockAuthReq;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: {
        sql: {
          user_id: 123,
          role: 'teacher'
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

  it('getAllSimlets returns user simlets', async () => {
    mockedSimletService.getSimletsByUserId.mockResolvedValue([{ simlet_id: 1 }] as any);

    await getAllSimlets(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.getSimletsByUserId).toHaveBeenCalledWith(123, '', undefined, undefined);
    expect(mockRes.json).toHaveBeenCalledWith([{ simlet_id: 1 }]);
  });

  it('getSimletById returns one simlet', async () => {
    mockReq.params = { simlet_id: '1' };
    mockedSimletService.getSimletBySimletIdAndUserId.mockResolvedValue({ simlet_id: 1 } as any);

    await getSimletById(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.getSimletBySimletIdAndUserId).toHaveBeenCalledWith(1, 123);
    expect(mockRes.json).toHaveBeenCalledWith({ simlet_id: 1 });
  });

  it('createSimlet injects coordinator id and returns created simlet', async () => {
    mockReq.body = { simlet_name: 'Test Simlet' };
    mockedSimletService.createSimlet.mockResolvedValue({ simlet_id: 10 } as any);

    await createSimlet(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.createSimlet).toHaveBeenCalledWith({ simlet_name: 'Test Simlet', simlet_coordinator_id: 123 });
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ simlet_id: 10 });
  });

  it('patchSimlet calls service patch with ids and body', async () => {
    mockReq.params = { simlet_id: '3' };
    mockReq.body = { simlet_name: 'Updated' };
    mockedSimletService.patch.mockResolvedValue({ simlet_id: 3 } as any);

    await patchSimlet(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.patch).toHaveBeenCalledWith(3, 123, { simlet_name: 'Updated' });
    expect(mockRes.json).toHaveBeenCalledWith({ simlet_id: 3 });
  });

  it('deleteSimlet calls service and returns 204', async () => {
    mockReq.params = { simlet_id: '7' };
    mockedSimletService.deleteSimlet.mockResolvedValue(undefined as any);

    await deleteSimlet(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.deleteSimlet).toHaveBeenCalledWith(7, 123);
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('getSimletCount returns count object', async () => {
    mockedSimletService.getSimletCountByUserId.mockResolvedValue(5 as any);

    await getSimletCount(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.getSimletCountByUserId).toHaveBeenCalledWith(123, '');
    expect(mockRes.json).toHaveBeenCalledWith({ count: 5 });
  });
});
