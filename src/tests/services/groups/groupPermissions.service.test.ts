import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAllGroupPermissions,
  getGroupPermissionById,
  getGroupPermissionsByGroup,
  getGroupPermissionsByUser,
  getGroupPermissionsByType,
  checkUserGroupPermission,
  createGroupPermission,
  updateGroupPermission,
  deleteGroupPermission,
  deleteGroupPermissionsByGroup,
  deleteGroupPermissionsByUser,
  countGroupPermissions,
  countPermissionsByGroup,
  countPermissionsByUser,
  groupPermissionExists,
  getDistinctPermissionTypes
} from "@/services/groups/groupPermissions.service";
import { createUser } from "@/services/users/user.service";
import { createGroup } from "@/services/groups/group.service";
import { NotFoundError } from "@/lib/errors/appErrors";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

let testUser: any;
let testGroup: any;
let testPermission: any;
let secondPermission: any;

/**
 * Integration tests for GroupPermissions service CRUD operations and queries.
 */
describe("GroupPermissions Service", () => {
  beforeAll(async () => {
    try {
      await db.sequelize.sync({ force: true });
      
      // Create test user and group
      testUser = await createUser({
        user_id: 1,
        username: "permission_user",
        email: "user@example.com",
        isToken: false,
        token: null,
        role: "teacher"
      });

      testGroup = await createGroup({
        group_id: 1,
        name: "Permission Group",
        use_new_generation: true,
        group_owner_id: testUser.user_id
      });
    } catch (err) {
      logger.error({ err }, "Sequelize sync failed");
    }
  });

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 100));
    await db.sequelize.close();
  });

  describe("GroupPermission Creation", () => {
    it("creates a group permission successfully", async () => {
      testPermission = await createGroupPermission({
        group_id: testGroup.group_id,
        user_id: testUser.user_id,
        permission: "read"
      });

      expect(testPermission).toBeDefined();
      expect(testPermission.group_id).toBe(testGroup.group_id);
      expect(testPermission.user_id).toBe(testUser.user_id);
      expect(testPermission.permission).toBe("read");
    });

    it("creates a second permission for testing", async () => {
      secondPermission = await createGroupPermission({
        group_id: testGroup.group_id,
        user_id: testUser.user_id,
        permission: "write"
      });

      expect(secondPermission).toBeDefined();
      expect(secondPermission.permission).toBe("write");
    });
  });

  describe("GroupPermission Retrieval", () => {
    it("fetches all group permissions", async () => {
      const permissions = await getAllGroupPermissions();
      expect(permissions).toHaveLength(2);
    });

    it("fetches group permission by ID", async () => {
      const permission = await getGroupPermissionById(testPermission.group_id, testPermission.user_id);
      expect(permission.permission).toBe("read");
    });

    it("throws NotFoundError for non-existent permission", async () => {
      await expect(getGroupPermissionById(999, 999)).rejects.toThrow(NotFoundError);
    });

    it("fetches permissions by group", async () => {
      const groupPermissions = await getGroupPermissionsByGroup(testGroup.group_id);
      expect(groupPermissions).toHaveLength(2);
    });

    it("fetches permissions by user", async () => {
      const userPermissions = await getGroupPermissionsByUser(testUser.user_id);
      expect(userPermissions).toHaveLength(2);
    });

    it("fetches permissions by type", async () => {
      const readPermissions = await getGroupPermissionsByType("read");
      expect(readPermissions).toHaveLength(1);
      expect(readPermissions[0].permission).toBe("read");

      const writePermissions = await getGroupPermissionsByType("write");
      expect(writePermissions).toHaveLength(1);
      expect(writePermissions[0].permission).toBe("write");
    });
  });

  describe("Permission Checking", () => {
    it("checks if user has specific group permission", async () => {
      const hasReadPermission = await checkUserGroupPermission(
        testUser.user_id,
        testGroup.group_id,
        "read"
      );
      expect(hasReadPermission).toBe(true);

      const hasAdminPermission = await checkUserGroupPermission(
        testUser.user_id,
        testGroup.group_id,
        "admin"
      );
      expect(hasAdminPermission).toBe(false);
    });
  });

  describe("GroupPermission Statistics", () => {
    it("counts total group permissions", async () => {
      const count = await countGroupPermissions();
      expect(count).toBe(2);
    });

    it("counts permissions by group", async () => {
      const count = await countPermissionsByGroup(testGroup.group_id);
      expect(count).toBe(2);
    });

    it("counts permissions by user", async () => {
      const count = await countPermissionsByUser(testUser.user_id);
      expect(count).toBe(2);
    });

    it("checks if group permission exists", async () => {
      const exists = await groupPermissionExists(testGroup.group_id, testUser.user_id);
      expect(exists).toBe(true);

      const notExists = await groupPermissionExists(999, 999);
      expect(notExists).toBe(false);
    });

    it("gets distinct permission types", async () => {
      const types = await getDistinctPermissionTypes();
      expect(types).toContain("read");
      expect(types).toContain("write");
      expect(types).toHaveLength(2);
    });
  });

  describe("GroupPermission Update", () => {
    it("updates group permission successfully", async () => {
      const updatedPermission = await updateGroupPermission(
        testGroup.group_id,
        testUser.user_id,
        "read",
        "admin"
      );

      expect(updatedPermission.permission).toBe("admin");
    });

    it("throws NotFoundError when updating non-existent permission", async () => {
      await expect(updateGroupPermission(999, 999, "read", "admin")).rejects.toThrow(NotFoundError);
    });
  });

  describe("GroupPermission Deletion", () => {
    it("deletes group permission successfully", async () => {
      await deleteGroupPermission(testGroup.group_id, testUser.user_id);
      
      // Verify permission is deleted
      await expect(getGroupPermissionById(testGroup.group_id, testUser.user_id)).rejects.toThrow(NotFoundError);
    });

    it("deletes permissions by group", async () => {
      // Create new permission to test bulk delete
      await createGroupPermission({
        group_id: testGroup.group_id,
        user_id: testUser.user_id,
        permission: "read"
      });

      const deletedCount = await deleteGroupPermissionsByGroup(testGroup.group_id);
      expect(deletedCount).toBeGreaterThanOrEqual(1);
      
      const remainingPermissions = await getGroupPermissionsByGroup(testGroup.group_id);
      expect(remainingPermissions).toHaveLength(0);
    });

    it("deletes permissions by user", async () => {
      // Create new permissions to test
      await createGroupPermission({
        group_id: testGroup.group_id,
        user_id: testUser.user_id,
        permission: "read"
      });

      const deletedCount = await deleteGroupPermissionsByUser(testUser.user_id);
      expect(deletedCount).toBeGreaterThanOrEqual(1);
      
      const remainingPermissions = await getGroupPermissionsByUser(testUser.user_id);
      expect(remainingPermissions).toHaveLength(0);
    });

    it("throws NotFoundError when deleting non-existent permission", async () => {
      await expect(deleteGroupPermission(999, 999)).rejects.toThrow(NotFoundError);
    });
  });
});