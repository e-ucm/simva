import { Request, Response, NextFunction } from 'express';
import { getMe } from '@/controlers/user.controller';
import { AuthentificationError } from '@/lib/errors/appErrors';
import * as userService from '@/services/users/user.service';

// Mock user service
jest.mock('@/services/users/user.service');
const mockedUserService = userService as jest.Mocked<typeof userService>;

describe('User Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe function', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    it('returns user data when authentication is valid', async () => {
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: 'testuser@example.com',
        role: 'admin'
      };

      mockReq.user = {
        data: {
          user_id: 1,
          username: 'testuser',
          role: 'admin'
        }
      };

      mockedUserService.getUserById.mockResolvedValue(mockUser as any);

      await getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('throws AuthentificationError when user_id is missing from auth data', async () => {
      mockReq.user = {
        data: {
          username: 'testuser',
          role: 'admin'
          // Missing user_id
        }
      };

      await getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
      expect(mockedUserService.getUserById).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('throws AuthentificationError when user_id is null', async () => {
      mockReq.user = {
        data: {
          user_id: null,
          username: 'testuser',
          role: 'admin'
        }
      };

      await getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
      expect(mockedUserService.getUserById).not.toHaveBeenCalled();
    });

    it('throws AuthentificationError when user_id is undefined', async () => {
      mockReq.user = {
        data: {
          user_id: undefined,
          username: 'testuser',
          role: 'admin'
        }
      };

      await getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
    });

    it('throws AuthentificationError when auth data structure is completely missing', async () => {
      mockReq.user = undefined;

      await getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
      expect(mockedUserService.getUserById).not.toHaveBeenCalled();
    });

    it('throws AuthentificationError when user.data is missing', async () => {
      mockReq.user = {
        // Missing data property
      };

      await getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthentificationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe('User not authenticated');
    });

    it('propagates service errors correctly', async () => {
      const serviceError = new Error('Database connection failed');
      
      mockReq.user = {
        data: {
          user_id: 1,
          username: 'testuser',
          role: 'admin'
        }
      };

      mockedUserService.getUserById.mockRejectedValue(serviceError);

      await getMe(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});