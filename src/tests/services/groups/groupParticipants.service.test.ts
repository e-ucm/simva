import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAllGroupParticipants,
  getGroupParticipantById,
  getParticipantsByGroup,
  getGroupsByParticipant,
  createGroupParticipant,
  updateGroupParticipant,
  deleteGroupParticipant,
  deleteParticipantsByGroup,
  deleteParticipantsByUser,
  countGroupParticipants,
  countParticipantsByGroup,
  countParticipantsByUser,
  groupParticipantExists
} from "@/services/groups/groupParticipants.service";
import { createUser } from "@/services/users/user.service";
import { createGroup } from "@/services/groups/group.service";
import { NotFoundError } from "@/lib/errors/appErrors";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

let testUser: any;
let secondUser: any;
let testGroup: any;
let secondGroup: any;
let testParticipant: any;

/**
 * Integration tests for GroupParticipants service CRUD operations and queries.
 */
describe("GroupParticipants Service", () => {
  beforeAll(async () => {
    try {
      await db.sequelize.sync({ force: true });
      
      // Create test users and groups
      testUser = await createUser({
        user_id: 1,
        username: "participant_user",
        email: "participant@example.com",
        isToken: false,
        token: null,
        role: "student"
      });

      secondUser = await createUser({
        user_id: 2,
        username: "another_participant",
        email: "another@example.com",
        isToken: false,
        token: null,
        role: "teacher"
      });

      testGroup = await createGroup({
        group_id: 1,
        name: "Participant Group",
        use_new_generation: true,
        group_owner_id: testUser.user_id
      });

      secondGroup = await createGroup({
        group_id: 2,
        name: "Second Group",
        use_new_generation: false,
        group_owner_id: secondUser.user_id
      });
    } catch (err) {
      logger.error({ err }, "Sequelize sync failed");
    }
  });

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 100));
    await db.sequelize.close();
  });

  describe("GroupParticipant Creation", () => {
    it("creates a group participant successfully", async () => {
      testParticipant = await createGroupParticipant({
        group_id: testGroup.group_id,
        participant_id: testUser.user_id
      });

      expect(testParticipant).toBeDefined();
      expect(testParticipant.group_id).toBe(testGroup.group_id);
      expect(testParticipant.participant_id).toBe(testUser.user_id);
    });

    it("creates another participant for testing", async () => {
      const secondParticipant = await createGroupParticipant({
        group_id: testGroup.group_id,
        participant_id: secondUser.user_id
      });

      expect(secondParticipant).toBeDefined();
      expect(secondParticipant.group_id).toBe(testGroup.group_id);
      expect(secondParticipant.participant_id).toBe(secondUser.user_id);
    });

    it("creates participant in second group", async () => {
      await createGroupParticipant({
        group_id: secondGroup.group_id,
        participant_id: testUser.user_id
      });
    });
  });

  describe("GroupParticipant Retrieval", () => {
    it("fetches all group participants", async () => {
      const participants = await getAllGroupParticipants();
      expect(participants).toHaveLength(3);
    });

    it("fetches group participant by ID", async () => {
      const participant = await getGroupParticipantById(testGroup.group_id, testUser.user_id);
      expect(participant.group_id).toBe(testGroup.group_id);
      expect(participant.participant_id).toBe(testUser.user_id);
    });

    it("throws NotFoundError for non-existent participant", async () => {
      await expect(getGroupParticipantById(999, 999)).rejects.toThrow(NotFoundError);
    });

    it("fetches participants by group", async () => {
      const groupParticipants = await getParticipantsByGroup(testGroup.group_id);
      expect(groupParticipants).toHaveLength(2);
    });

    it("fetches groups by participant", async () => {
      const userGroups = await getGroupsByParticipant(testUser.user_id);
      expect(userGroups).toHaveLength(2);
    });
  });

  describe("GroupParticipant Statistics", () => {
    it("counts total group participants", async () => {
      const count = await countGroupParticipants();
      expect(count).toBe(3);
    });

    it("counts participants by group", async () => {
      const firstGroupCount = await countParticipantsByGroup(testGroup.group_id);
      expect(firstGroupCount).toBe(2);

      const secondGroupCount = await countParticipantsByGroup(secondGroup.group_id);
      expect(secondGroupCount).toBe(1);
    });

    it("counts participants by user", async () => {
      const firstUserCount = await countParticipantsByUser(testUser.user_id);
      expect(firstUserCount).toBe(2);

      const secondUserCount = await countParticipantsByUser(secondUser.user_id);
      expect(secondUserCount).toBe(1);
    });

    it("checks if group participant exists", async () => {
      const exists = await groupParticipantExists(testGroup.group_id, testUser.user_id);
      expect(exists).toBe(true);

      const notExists = await groupParticipantExists(999, 999);
      expect(notExists).toBe(false);
    });
  });

  describe("GroupParticipant Update", () => {
    it("updates group participant successfully (no-op)", async () => {
      const updatedParticipant = await updateGroupParticipant(
        testGroup.group_id,
        testUser.user_id,
        {}
      );

      expect(updatedParticipant.group_id).toBe(testGroup.group_id);
      expect(updatedParticipant.participant_id).toBe(testUser.user_id);
    });

    it("throws NotFoundError when updating non-existent participant", async () => {
      await expect(updateGroupParticipant(999, 999, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("GroupParticipant Deletion", () => {
    it("deletes group participant successfully", async () => {
      await deleteGroupParticipant(secondGroup.group_id, testUser.user_id);
      
      // Verify participant is deleted
      await expect(getGroupParticipantById(secondGroup.group_id, testUser.user_id)).rejects.toThrow(NotFoundError);
      
      // Verify count is updated
      const count = await countGroupParticipants();
      expect(count).toBe(2);
    });

    it("deletes participants by group", async () => {
      const deletedCount = await deleteParticipantsByGroup(testGroup.group_id);
      expect(deletedCount).toBe(2); // Should delete both participants in the group
      
      const remainingParticipants = await getParticipantsByGroup(testGroup.group_id);
      expect(remainingParticipants).toHaveLength(0);
    });

    it("deletes participants by user", async () => {
      // Create new participant to test
      await createGroupParticipant({
        group_id: secondGroup.group_id,
        participant_id: testUser.user_id
      });

      const deletedCount = await deleteParticipantsByUser(testUser.user_id);
      expect(deletedCount).toBeGreaterThanOrEqual(1);
      
      const remainingParticipants = await getGroupsByParticipant(testUser.user_id);
      expect(remainingParticipants).toHaveLength(0);
    });

    it("throws NotFoundError when deleting non-existent participant", async () => {
      await expect(deleteGroupParticipant(999, 999)).rejects.toThrow(NotFoundError);
    });
  });
});