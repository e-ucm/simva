import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAllGroups,
  getGroupById,
  getGroupsByType,
  getGroupsByOwner,
  searchGroupsByName,
  createGroup,
  updateGroup,
  deleteGroup,
  countGroups,
  countGroupsByType,
  countGroupsByOwner,
  groupExists,
  getGroupsCreatedAfter,
  getDistinctTypes,
  isGroupNameAvailable
} from "@/services/groups/group.service";
import { createUser } from "@/services/users/user.service";
import { NotFoundError } from "@/lib/errors/appErrors";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

let testUser: any;
let testGroup: any;
let secondGroup: any;

/**
 * Integration tests for Group service CRUD operations and queries.
 */
describe("Group Service", () => {
  beforeAll(async () => {
    try {
      await db.sequelize.sync({ force: true });
      
      // Create a test user to own groups
      testUser = await createUser({
        user_id: 1,
        username: "group_owner",
        email: "owner@example.com",
        isToken: false,
        token: null,
        role: "teacher"
      });
    } catch (err) {
      logger.error({ err }, "Sequelize sync failed");
    }
  });

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 100));
    await db.sequelize.close();
  });

  describe("Group Creation", () => {
    it("creates a group successfully", async () => {
      testGroup = await createGroup({
        group_id: 1,
        name: "Test Group",
        use_new_generation: true,
        group_owner_id: testUser.user_id
      });

      expect(testGroup).toBeDefined();
      expect(testGroup.group_id).toBe(1);
      expect(testGroup.name).toBe("Test Group");
      expect(testGroup.use_new_generation).toBe(true);
      expect(testGroup.group_owner_id).toBe(testUser.user_id);
    });

    it("creates a second group for testing", async () => {
      secondGroup = await createGroup({
        group_id: 2,
        name: "Research Group",
        use_new_generation: false,
        group_owner_id: testUser.user_id
      });

      expect(secondGroup).toBeDefined();
      expect(secondGroup.name).toBe("Research Group");
      expect(secondGroup.use_new_generation).toBe(false);
    });
  });

  describe("Group Retrieval", () => {
    it("fetches all groups", async () => {
      const groups = await getAllGroups();
      expect(groups).toHaveLength(2);
      expect(groups[0].name).toBe("Test Group");
      expect(groups[1].name).toBe("Research Group");
    });

    it("fetches group by ID", async () => {
      const group = await getGroupById(1);
      expect(group.name).toBe("Test Group");
      expect(group.use_new_generation).toBe(true);
    });

    it("throws NotFoundError for non-existent group ID", async () => {
      await expect(getGroupById(999)).rejects.toThrow(NotFoundError);
    });

    it("fetches groups by generation setting", async () => {
      const newGenGroups = await getGroupsByType(true);
      expect(newGenGroups).toHaveLength(1);
      expect(newGenGroups[0].name).toBe("Test Group");

      const oldGenGroups = await getGroupsByType(false);
      expect(oldGenGroups).toHaveLength(1);
      expect(oldGenGroups[0].name).toBe("Research Group");
    });

    it("fetches groups by owner", async () => {
      const ownerGroups = await getGroupsByOwner(testUser.user_id);
      expect(ownerGroups).toHaveLength(2);
    });
  });

  describe("Group Search", () => {
    it("searches groups by name pattern", async () => {
      const groups = await searchGroupsByName("Test");
      expect(groups).toHaveLength(1);
      expect(groups[0].name).toBe("Test Group");
    });

    it("searches groups with case insensitive pattern", async () => {
      const groups = await searchGroupsByName("group");
      expect(groups).toHaveLength(2); // Both contain "Group"
    });

    it("checks if group name is available", async () => {
      const available = await isGroupNameAvailable("New Unique Group");
      expect(available).toBe(true);

      const taken = await isGroupNameAvailable("Test Group");
      expect(taken).toBe(false);
    });
  });

  describe("Group Statistics", () => {
    it("counts total groups", async () => {
      const count = await countGroups();
      expect(count).toBe(2);
    });

    it("counts groups by generation setting", async () => {
      const newGenCount = await countGroupsByType(true);
      expect(newGenCount).toBe(1);

      const oldGenCount = await countGroupsByType(false);
      expect(oldGenCount).toBe(1);
    });

    it("counts groups by owner", async () => {
      const ownerCount = await countGroupsByOwner(testUser.user_id);
      expect(ownerCount).toBe(2);

      // Test with non-existent owner
      const noGroupsOwner = await countGroupsByOwner(999);
      expect(noGroupsOwner).toBe(0);
    });

    it("checks if group exists", async () => {
      const exists = await groupExists(1);
      expect(exists).toBe(true);

      const notExists = await groupExists(999);
      expect(notExists).toBe(false);
    });

    it("gets groups created after date", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentGroups = await getGroupsCreatedAfter(yesterday);
      expect(recentGroups).toHaveLength(2);
    });

    it("gets distinct generation settings", async () => {
      const settings = await getDistinctTypes();
      expect(settings).toContain(true);
      expect(settings).toContain(false);
      expect(settings).toHaveLength(2);
    });
  });

  describe("Group Update", () => {
    it("updates group successfully", async () => {
      const updatedGroup = await updateGroup(1, {
        name: "Updated Test Group",
        use_new_generation: false
      });

      expect(updatedGroup.name).toBe("Updated Test Group");
      expect(updatedGroup.use_new_generation).toBe(false);
      expect(updatedGroup.group_owner_id).toBe(testUser.user_id); // Should remain unchanged
    });

    it("throws NotFoundError when updating non-existent group", async () => {
      await expect(updateGroup(999, { name: "Non-existent" })).rejects.toThrow(NotFoundError);
    });
  });

  describe("Group Deletion", () => {
    it("deletes group successfully", async () => {
      await deleteGroup(2);
      
      // Verify group is deleted
      await expect(getGroupById(2)).rejects.toThrow(NotFoundError);
      
      // Verify count is updated
      const count = await countGroups();
      expect(count).toBe(1);
    });

    it("throws NotFoundError when deleting non-existent group", async () => {
      await expect(deleteGroup(999)).rejects.toThrow(NotFoundError);
    });
  });
});