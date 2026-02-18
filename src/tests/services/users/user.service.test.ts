import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getAllUsers, getUserById, getUserByUsername } from '@/services/users/user.service';
import { User } from '@/lib/mappers/Users/User';

jest.mock('@/lib/mappers/Users/User', () => ({
  User: {
    getFromDbData: jest.fn(),
    getAllFromDbData: jest.fn()
  }
}));

const mockedUser = User as jest.Mocked<typeof User>;

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllUsers delegates to mapper with pagination and search', async () => {
    const users = [{ user_id: 1, username: 'alice' }];
    mockedUser.getAllFromDbData.mockResolvedValue(users as any);

    const result = await getAllUsers(10, 20, 'ali');

    expect(mockedUser.getAllFromDbData).toHaveBeenCalledWith(10, 20, 'ali');
    expect(result).toEqual(users);
  });

  it('getUserById delegates to mapper by id', async () => {
    const user = { user_id: 2, username: 'bob' };
    mockedUser.getFromDbData.mockResolvedValue(user as any);

    const result = await getUserById(2);

    expect(mockedUser.getFromDbData).toHaveBeenCalledWith(2);
    expect(result).toEqual(user);
  });

  it('getUserByUsername delegates to mapper by username', async () => {
    const user = { user_id: 3, username: 'carol' };
    mockedUser.getFromDbData.mockResolvedValue(user as any);

    const result = await getUserByUsername('carol');

    expect(mockedUser.getFromDbData).toHaveBeenCalledWith(undefined, 'carol');
    expect(result).toEqual(user);
  });

  it('propagates mapper errors', async () => {
    const error = new Error('mapper failed');
    mockedUser.getFromDbData.mockRejectedValue(error);

    await expect(getUserById(999)).rejects.toThrow('mapper failed');
  });
});
