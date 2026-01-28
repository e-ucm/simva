import request from 'supertest';
import { app } from '@/app';
import { db } from '@/lib/db';
import { NotFoundError, ValidationError } from '@/lib/errors/appErrors';
import * as groupParticipantsService from '@/services/groups/groupParticipants.service';

// Mock the auth middleware
jest.mock('@/middlewares/auth.middleware', () => ({
  auth: (req: any, res: any, next: any) => {
    // Mock user for tests
    req.user = {
      sql: {
        user_id: 1,
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

// Mock group participants service
jest.mock('@/services/groups/groupParticipants.service');
const mockedGroupParticipantsService = groupParticipantsService as jest.Mocked<typeof groupParticipantsService>;

describe('Group Participants Controller Routes', () => {
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

  describe('GET /group-participants/group/:groupId', () => {
    it('returns participants for valid group ID', async () => {
      const mockParticipants = [
        { group_id: 1, participant_id: 10 },
        { group_id: 1, participant_id: 11 }
      ];
      
      mockedGroupParticipantsService.getGroupParticipants.mockResolvedValue(mockParticipants as any);

      const response = await request(app)
        .get('/group-participants/group/1')
        .expect(200);

      expect(response.body).toEqual(mockParticipants);
      expect(mockedGroupParticipantsService.getGroupParticipants).toHaveBeenCalledWith(1);
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .get('/group-participants/group/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for negative group ID', async () => {
      const response = await request(app)
        .get('/group-participants/group/-1')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });
  });

  describe('POST /group-participants/group/:groupId/participant/:participantId', () => {
    it('adds participant to group successfully', async () => {
      const newRelation = { group_id: 1, participant_id: 10 };
      
      mockedGroupParticipantsService.addParticipantToGroup.mockResolvedValue(newRelation as any);

      const response = await request(app)
        .post('/group-participants/group/1/participant/10')
        .expect(201);

      expect(response.body).toEqual(newRelation);
      expect(mockedGroupParticipantsService.addParticipantToGroup).toHaveBeenCalledWith(1, 10);
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .post('/group-participants/group/invalid/participant/10')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for invalid participant ID', async () => {
      const response = await request(app)
        .post('/group-participants/group/1/participant/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid participant ID');
    });

    it('handles service errors during addition', async () => {
      mockedGroupParticipantsService.addParticipantToGroup.mockRejectedValue(
        new ValidationError('Participant already in group')
      );

      const response = await request(app)
        .post('/group-participants/group/1/participant/10')
        .expect(400);

      expect(response.body.message).toContain('Participant already in group');
    });
  });

  describe('DELETE /group-participants/group/:groupId/participant/:participantId', () => {
    it('removes participant from group successfully', async () => {
      mockedGroupParticipantsService.removeParticipantFromGroup.mockResolvedValue();

      const response = await request(app)
        .delete('/group-participants/group/1/participant/10')
        .expect(204);

      expect(response.body).toEqual({});
      expect(mockedGroupParticipantsService.removeParticipantFromGroup).toHaveBeenCalledWith(1, 10);
    });

    it('returns 404 when relationship not found', async () => {
      mockedGroupParticipantsService.removeParticipantFromGroup.mockRejectedValue(
        new NotFoundError('Participant not found in group')
      );

      const response = await request(app)
        .delete('/group-participants/group/1/participant/999')
        .expect(404);

      expect(response.body.message).toContain('Participant not found in group');
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .delete('/group-participants/group/invalid/participant/10')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for invalid participant ID', async () => {
      const response = await request(app)
        .delete('/group-participants/group/1/participant/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid participant ID');
    });
  });

  describe('GET /group-participants/participant/:participantId', () => {
    it('returns groups for valid participant ID', async () => {
      const mockGroups = [
        { group_id: 1, participant_id: 10 },
        { group_id: 2, participant_id: 10 }
      ];
      
      mockedGroupParticipantsService.getParticipantGroups.mockResolvedValue(mockGroups as any);

      const response = await request(app)
        .get('/group-participants/participant/10')
        .expect(200);

      expect(response.body).toEqual(mockGroups);
      expect(mockedGroupParticipantsService.getParticipantGroups).toHaveBeenCalledWith(10);
    });

    it('returns validation error for invalid participant ID', async () => {
      const response = await request(app)
        .get('/group-participants/participant/invalid')
        .expect(400);

      expect(response.body.message).toContain('Invalid participant ID');
    });

    it('returns validation error for negative participant ID', async () => {
      const response = await request(app)
        .get('/group-participants/participant/-1')
        .expect(400);

      expect(response.body.message).toContain('Invalid participant ID');
    });
  });

  describe('GET /group-participants/group/:groupId/participant/:participantId/exists', () => {
    it('returns true when participant is in group', async () => {
      mockedGroupParticipantsService.isParticipantInGroup.mockResolvedValue(true);

      const response = await request(app)
        .get('/group-participants/group/1/participant/10/exists')
        .expect(200);

      expect(response.body).toEqual({ exists: true });
      expect(mockedGroupParticipantsService.isParticipantInGroup).toHaveBeenCalledWith(1, 10);
    });

    it('returns false when participant is not in group', async () => {
      mockedGroupParticipantsService.isParticipantInGroup.mockResolvedValue(false);

      const response = await request(app)
        .get('/group-participants/group/1/participant/999/exists')
        .expect(200);

      expect(response.body).toEqual({ exists: false });
      expect(mockedGroupParticipantsService.isParticipantInGroup).toHaveBeenCalledWith(1, 999);
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .get('/group-participants/group/invalid/participant/10/exists')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('returns validation error for invalid participant ID', async () => {
      const response = await request(app)
        .get('/group-participants/group/1/participant/invalid/exists')
        .expect(400);

      expect(response.body.message).toContain('Invalid participant ID');
    });
  });

  describe('GET /group-participants/group/:groupId/count', () => {
    it('returns participant count for valid group', async () => {
      mockedGroupParticipantsService.getGroupParticipantsCount.mockResolvedValue(5);

      const response = await request(app)
        .get('/group-participants/group/1/count')
        .expect(200);

      expect(response.body).toEqual({ count: 5 });
      expect(mockedGroupParticipantsService.getGroupParticipantsCount).toHaveBeenCalledWith(1);
    });

    it('returns validation error for invalid group ID', async () => {
      const response = await request(app)
        .get('/group-participants/group/invalid/count')
        .expect(400);

      expect(response.body.message).toContain('Invalid group ID');
    });

    it('handles service errors when getting count', async () => {
      mockedGroupParticipantsService.getGroupParticipantsCount.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/group-participants/group/1/count')
        .expect(500);

      expect(response.body.message).toContain('Database error');
    });
  });
});