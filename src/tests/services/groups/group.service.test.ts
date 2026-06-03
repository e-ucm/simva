import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  createGroup,
  createGroupParticipant,
  deleteGroup,
  deleteGroupParticipant,
  getGroup,
  getGroupCount,
  getGroupParticipants,
  getGroups,
  updateGroup
} from '@/services/groups/group.service';
import { Group } from '@/lib/mappers/group/Group';

jest.mock('@/lib/mappers/group/Group', () => ({
  Group: {
    getAllFromDbData: jest.fn(),
    getFromDbData: jest.fn(),
    createInDb: jest.fn()
  }
}));

const mockedGroup = Group as jest.Mocked<typeof Group>;

describe('Group Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getGroups delegates to Group.getAllFromDbData', async () => {
    const groups = [{ group_id: 1 }];
    mockedGroup.getAllFromDbData.mockResolvedValue(groups as any);

    const result = await getGroups(5, true, 'abc', 10, 0);

    expect(mockedGroup.getAllFromDbData).toHaveBeenCalledWith(5, true, 10, 0, 'abc');
    expect(result).toEqual(groups);
  });

  it('getGroup delegates to Group.getFromDbData', async () => {
    const group = { group_id: 2 };
    mockedGroup.getFromDbData.mockResolvedValue(group as any);

    const result = await getGroup(2, 5);

    expect(mockedGroup.getFromDbData).toHaveBeenCalledWith(2, 5);
    expect(result).toEqual(group);
  });

  it('createGroup delegates to Group.createInDb', async () => {
    const payload = { group_name: 'G1' };
    const created = { group_id: 3 };
    mockedGroup.createInDb.mockResolvedValue(created as any);

    const result = await createGroup(payload, true, 5);

    expect(mockedGroup.createInDb).toHaveBeenCalledWith(payload, true, 5);
    expect(result).toEqual(created);
  });

  it('group participant helpers delegate through group instance', async () => {
    const participants = [{ participant_id: 1 }];
    const participant = { participant_id: 2 };
    const groupInstance = {
      getParticipants: jest.fn().mockResolvedValue(participants),
      createParticipant: jest.fn().mockResolvedValue(participant),
      deleteParticipant: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue({ group_id: 1, group_name: 'U' })
    };
    mockedGroup.getFromDbData.mockResolvedValue(groupInstance as any);

    await expect(getGroupParticipants(1, 5)).resolves.toEqual(participants);
    await expect(createGroupParticipant(1, 5, { participant_id: 2 })).resolves.toEqual(participant);
    await expect(updateGroup(1, 5, { group_name: 'U' })).resolves.toEqual({ group_id: 1, group_name: 'U' });
    await deleteGroupParticipant(1, 2, 5, false);

    expect(groupInstance.getParticipants).toHaveBeenCalled();
    expect(groupInstance.createParticipant).toHaveBeenCalledWith({ participant_id: 2 });
    expect(groupInstance.update).toHaveBeenCalledWith({ group_name: 'U' });
    expect(groupInstance.deleteParticipant).toHaveBeenCalledWith(2, false);
  });

  it('deleteGroup is currently not implemented', async () => {
    await expect(deleteGroup(1)).rejects.toThrow('Function not implemented.');
  });

  it('getGroupCount is currently not implemented', () => {
    expect(() => getGroupCount(1, '')).toThrow('Function not implemented.');
  });
});
