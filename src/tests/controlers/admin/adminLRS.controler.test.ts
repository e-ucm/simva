import { Request, Response, NextFunction } from 'express';
import { getStatements, getMoreStatements, postStatements } from '@/controlers/admin/adminLRS.controler';
import * as adminLRSService from '@/services/admin/adminLRS.service';
import { AuthentificationError, BadRequestError } from '@/lib/errors/appErrors';

jest.mock('@/services/admin/adminLRS.service', () => ({
  getStatements: jest.fn(),
  getMoreStatements: jest.fn(),
  sendStatements: jest.fn(),
}));
const mockedAdminLRSService = adminLRSService as jest.Mocked<typeof adminLRSService>;

type MockAuthReq = Partial<Request> & {
  user?: {
    sql?: {
      user_id?: number;
      role?: string;
    };
  };
};

describe('Admin LRS Controller Unit Tests', () => {
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
          role: 'administrator'
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

  describe('getStatements', () => {
    it('returns the LRS statements for an administrator', async () => {
      mockReq.query = { verb: 'completed' };
      const lrsResponse = { statements: [{ id: '1', verb: 'completed' }], more: '' };
      mockedAdminLRSService.getStatements.mockResolvedValue(lrsResponse);

      await getStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.getStatements).toHaveBeenCalledWith({ verb: 'completed' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(lrsResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('allows lrsmanagers', async () => {
      mockReq.user!.sql!.role = 'lrsmanager';
      mockedAdminLRSService.getStatements.mockResolvedValue({ statements: [] });

      await getStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('allows garbagecollectors', async () => {
      mockReq.user!.sql!.role = 'garbagecollector';
      mockedAdminLRSService.getStatements.mockResolvedValue({ statements: [] });

      await getStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('rejects students with an AuthentificationError', async () => {
      mockReq.user!.sql!.role = 'student';

      await getStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.getStatements).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('rejects teachers with an AuthentificationError', async () => {
      mockReq.user!.sql!.role = 'teacher';

      await getStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.getStatements).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    });

    it('forwards service errors to the next middleware', async () => {
      const error = new Error('LRS down');
      mockedAdminLRSService.getStatements.mockRejectedValue(error);

      await getStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getMoreStatements', () => {
    it('returns the next batch of statements for an administrator', async () => {
      mockReq.query = { more: 'https://lrs.example/xapi/statements/more/abc' };
      const lrsResponse = { statements: [{ id: '2' }], more: '' };
      mockedAdminLRSService.getMoreStatements.mockResolvedValue(lrsResponse);

      await getMoreStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.getMoreStatements).toHaveBeenCalledWith('https://lrs.example/xapi/statements/more/abc');
      expect(mockRes.json).toHaveBeenCalledWith(lrsResponse);
    });

    it('returns a BadRequestError when the more parameter is missing', async () => {
      delete mockReq.query!.more;

      await getMoreStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.getMoreStatements).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('rejects students with an AuthentificationError', async () => {
      mockReq.user!.sql!.role = 'student';
      mockReq.query = { more: 'token' };

      await getMoreStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.getMoreStatements).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    });
  });

  describe('postStatements', () => {
    it('posts the statements and returns the created ids for an administrator', async () => {
      mockReq.body = [{ id: '1', actor: {}, verb: {}, object: {} }];
      mockedAdminLRSService.sendStatements.mockResolvedValue(['1']);

      await postStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.sendStatements).toHaveBeenCalledWith([{ id: '1', actor: {}, verb: {}, object: {} }]);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(['1']);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('allows lrsmanagers', async () => {
      mockReq.user!.sql!.role = 'lrsmanager';
      mockReq.body = [{ id: '1' }];
      mockedAdminLRSService.sendStatements.mockResolvedValue(['1']);

      await postStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns a BadRequestError for an invalid body', async () => {
      mockReq.body = null;

      await postStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.sendStatements).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('rejects students with an AuthentificationError', async () => {
      mockReq.user!.sql!.role = 'student';
      mockReq.body = [{ id: '1' }];

      await postStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockedAdminLRSService.sendStatements).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
    });

    it('forwards service errors to the next middleware', async () => {
      mockReq.body = [{ id: '1' }];
      const error = new Error('LRS unaavailable');
      mockedAdminLRSService.sendStatements.mockRejectedValue(error);

      await postStatements(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});