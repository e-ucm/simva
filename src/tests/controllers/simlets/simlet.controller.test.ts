import { jest, beforeAll } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';

jest.unstable_mockModule('@/services/simlets/simlet.service', () => ({
  getSimletsByUserId: jest.fn(),
  getSimletsForStudent: jest.fn(),
  getAllSimlets: jest.fn(),
  getSimletBySimletIdAndUserId: jest.fn(),
  createSimlet: jest.fn(),
  patch: jest.fn(),
  deleteSimlet: jest.fn(),
  getSimletParticipants: jest.fn(),
  getSimletCountByUserId: jest.fn(),
  getSimletSchedule: jest.fn(),
  exportSimlet: jest.fn(),
  getTagsForSimlets: jest.fn(),
  getTagsForSimlet: jest.fn(),
}));

let mockedSimletService: jest.Mocked<typeof import('@/services/simlets/simlet.service')>;
let getAllSimlets: typeof import('@/controlers/simlets/simlet.controler')['getAllSimlets'];
let getSimletById: typeof import('@/controlers/simlets/simlet.controler')['getSimletById'];
let createSimlet: typeof import('@/controlers/simlets/simlet.controler')['createSimlet'];
let patchSimlet: typeof import('@/controlers/simlets/simlet.controler')['patchSimlet'];
let deleteSimlet: typeof import('@/controlers/simlets/simlet.controler')['deleteSimlet'];
let getSimletCount: typeof import('@/controlers/simlets/simlet.controler')['getSimletCount'];

beforeAll(async () => {
  mockedSimletService = (await import('@/services/simlets/simlet.service')) as jest.Mocked<typeof import('@/services/simlets/simlet.service')>;
  const controller = await import('@/controlers/simlets/simlet.controler');
  getAllSimlets = controller.getAllSimlets;
  getSimletById = controller.getSimletById;
  createSimlet = controller.createSimlet;
  patchSimlet = controller.patchSimlet;
  deleteSimlet = controller.deleteSimlet;
  getSimletCount = controller.getSimletCount;
});

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
    const simlets = [{ simlet_id: 1, toJSON: jest.fn(() => ({ simlet_id: 1 })) }];
    mockReq.query = { searchString: 'abc', limit: '10', skip: '5' };
    mockedSimletService.getSimletsByUserId.mockResolvedValue(simlets as any);

    await getAllSimlets(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.getSimletsByUserId).toHaveBeenCalledWith(123, undefined, 'abc', undefined, 10, 5, undefined, undefined);
    expect(mockRes.json).toHaveBeenCalledWith([{ simlet_id: 1 }]);
  });

  it('getSimletById returns one simlet', async () => {
    mockReq.params = { simlet_id: '1' };
    mockedSimletService.getSimletBySimletIdAndUserId.mockResolvedValue({ simlet_id: 1, toJSON: jest.fn(() => ({ simlet_id: 1 })) } as any);

    await getSimletById(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.getSimletBySimletIdAndUserId).toHaveBeenCalledWith(1, false, 123);
    expect(mockRes.json).toHaveBeenCalledWith({ simlet_id: 1 });
  });

  it('createSimlet injects coordinator id and returns created simlet', async () => {
    mockReq.body = { simlet_name: 'Test Simlet' };
    mockedSimletService.createSimlet.mockResolvedValue({ simlet_id: 10, toJSON: jest.fn(() => ({ simlet_id: 10 })) } as any);

    await createSimlet(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.createSimlet).toHaveBeenCalledWith({ simlet_name: 'Test Simlet' }, false, 123);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ simlet_id: 10 });
  });

  it('patchSimlet calls service patch with ids and body', async () => {
    mockReq.params = { simlet_id: '3' };
    mockReq.body = { simlet_name: 'Updated' };
    mockedSimletService.patch.mockResolvedValue({ simlet_id: 3, toJSON: jest.fn(() => ({ simlet_id: 3 })) } as any);

    await patchSimlet(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.patch).toHaveBeenCalledWith(3, { simlet_name: 'Updated' }, false, 123);
    expect(mockRes.json).toHaveBeenCalledWith({ simlet_id: 3 });
  });

  it('deleteSimlet calls service and returns 204', async () => {
    mockReq.params = { simlet_id: '7' };
    mockedSimletService.deleteSimlet.mockResolvedValue(undefined as any);

    await deleteSimlet(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.deleteSimlet).toHaveBeenCalledWith(7, false, 123);
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('getSimletCount returns count object', async () => {
    mockedSimletService.getSimletCountByUserId.mockResolvedValue(5 as any);

    await getSimletCount(mockReq as any, mockRes as Response, mockNext);

    expect(mockedSimletService.getSimletCountByUserId).toHaveBeenCalledWith(false, undefined, undefined, undefined, 123);
    expect(mockRes.json).toHaveBeenCalledWith({ count: 5 });
  });
});