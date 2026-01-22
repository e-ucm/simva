import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAllGroupParticipants,
  getGroupParticipantById,
  getParticipantsByGroup,
  getGroupsByParticipant,
  isParticipant,
  addParticipant,
  removeParticipant,
  removeAllParticipants,
  removeParticipantFromAllGroups,
  getParticipantIds,
  getGroupIds,
  countParticipants,
  countUserGroups,
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

    it("adds participant using addParticipant function", async () => {
      // Create a third user for this test
      const thirdUser = await createUser({
        user_id: 3,
        username: "third_user",
        email: "third@example.com",
        isToken: false,
        token: null,
        role: "student"
      });

      const participant = await addParticipant(testGroup.group_id, thirdUser.user_id);
      expect(participant).toBeDefined();
      expect(participant.group_id).toBe(testGroup.group_id);
      expect(participant.participant_id).toBe(thirdUser.user_id);
    });
  });

  describe("GroupParticipant Retrieval", () => {
    it("fetches all group participants", async () => {
      const participants = await getAllGroupParticipants();
      expect(participants).toHaveLength(4); // Now includes the third user added
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
      expect(groupParticipants).toHaveLength(3); // Now includes the third user
    });

    it("fetches groups by participant", async () => {
      const userGroups = await getGroupsByParticipant(testUser.user_id);
      expect(userGroups).toHaveLength(2);
    });

    it("checks if user is participant in group", async () => {
      const isUserParticipant = await isParticipant(testGroup.group_id, testUser.user_id);
      expect(isUserParticipant).toBe(true);

      const isNotParticipant = await isParticipant(testGroup.group_id, 999);
      expect(isNotParticipant).toBe(false);
    });

    it("gets participant IDs for a group", async () => {
      const participantIds = await getParticipantIds(testGroup.group_id);
      expect(participantIds).toContain(testUser.user_id);
      expect(participantIds).toContain(secondUser.user_id);
      expect(participantIds).toHaveLength(3); // Now includes the third user
    });

    it("gets group IDs for a participant", async () => {
      const groupIds = await getGroupIds(testUser.user_id);
      expect(groupIds).toContain(testGroup.group_id);
      expect(groupIds).toContain(secondGroup.group_id);
      expect(groupIds).toHaveLength(2);
    });
  });

  describe("GroupParticipant Statistics", () => {
    it("counts total group participants", async () => {
      const count = await countGroupParticipants();
      expect(count).toBe(4); // Now includes the third user
    });

    it("counts participants by group", async () => {
      const firstGroupCount = await countParticipantsByGroup(testGroup.group_id);
      expect(firstGroupCount).toBe(3); // Now includes the third user

      const secondGroupCount = await countParticipantsByGroup(secondGroup.group_id);
      expect(secondGroupCount).toBe(1);
    });

    it("counts participants by user", async () => {
      const firstUserCount = await countParticipantsByUser(testUser.user_id);
      expect(firstUserCount).toBe(2);

      const secondUserCount = await countParticipantsByUser(secondUser.user_id);
      expect(secondUserCount).toBe(1);
    });

    it("counts participants with countParticipants function", async () => {
      const firstGroupCount = await countParticipants(testGroup.group_id);
      expect(firstGroupCount).toBe(3); // Now includes the third user

      const secondGroupCount = await countParticipants(secondGroup.group_id);
      expect(secondGroupCount).toBe(1);
    });

    it("counts user groups with countUserGroups function", async () => {
      const firstUserGroups = await countUserGroups(testUser.user_id);
      expect(firstUserGroups).toBe(2);

      const secondUserGroups = await countUserGroups(secondUser.user_id);
      expect(secondUserGroups).toBe(1);
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
    it("removes participant using removeParticipant function", async () => {
      // Create a test participant to remove
      await addParticipant(secondGroup.group_id, secondUser.user_id);
      
      await removeParticipant(secondGroup.group_id, secondUser.user_id);
      
      // Verify participant is removed
      const isStillParticipant = await isParticipant(secondGroup.group_id, secondUser.user_id);
      expect(isStillParticipant).toBe(false);
    });

    it("removes all participants from a group using removeAllParticipants", async () => {
      // First, ensure we have participants in the second group
      const existingCount = await countParticipants(secondGroup.group_id);
      
      const removedCount = await removeAllParticipants(secondGroup.group_id);
      expect(removedCount).toBe(existingCount);
      
      const remainingCount = await countParticipants(secondGroup.group_id);
      expect(remainingCount).toBe(0);
    });

    it("removes participant from all groups using removeParticipantFromAllGroups", async () => {
      // Create a new participant in multiple groups 
      const fourthUser = await createUser({
        user_id: 4,
        username: "fourth_user",
        email: "fourth@example.com",
        isToken: false,
        token: null,
        role: "student"
      });

      await addParticipant(testGroup.group_id, fourthUser.user_id);
      await addParticipant(secondGroup.group_id, fourthUser.user_id);
      
      const removedCount = await removeParticipantFromAllGroups(fourthUser.user_id);
      expect(removedCount).toBeGreaterThanOrEqual(2);
      
      const remainingGroupsCount = await countUserGroups(fourthUser.user_id);
      expect(remainingGroupsCount).toBe(0);
    });

    it("deletes group participant successfully", async () => {
      // First ensure the participant exists by creating it
      await createGroupParticipant({
        group_id: secondGroup.group_id,
        participant_id: testUser.user_id
      });
      
      // Now delete the participant
      await deleteGroupParticipant(secondGroup.group_id, testUser.user_id);
      
      // Verify participant is deleted
      await expect(getGroupParticipantById(secondGroup.group_id, testUser.user_id)).rejects.toThrow(NotFoundError);
    });

    it("deletes participants by group", async () => {
      const initialCount = await countParticipantsByGroup(testGroup.group_id);
      const deletedCount = await deleteParticipantsByGroup(testGroup.group_id);
      expect(deletedCount).toBe(initialCount);
      
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

    it("throws NotFoundError when removing non-existent participant", async () => {
      await expect(removeParticipant(999, 999)).rejects.toThrow(NotFoundError);
    });
  });
});