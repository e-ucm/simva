import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAllGroupPermissions,
  getGroupPermissionById,
  getGroupPermissionsByGroup,
  getGroupPermissionsByUser,
  getGroupPermissionsByType,
  getGroupPermissions,
  getUserPermissions,
  getPermission,
  hasPermission,
  grantPermission,
  revokePermission,
  revokeAllUserPermissionsInGroup,
  revokeAllGroupPermissions,
  getUsersWithPermission,
  getGroupPermissionTypes,
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

    it("fetches permissions using getGroupPermissions function", async () => {
      const groupPermissions = await getGroupPermissions(testGroup.group_id);
      expect(groupPermissions).toHaveLength(2);
    });

    it("fetches permissions using getUserPermissions function", async () => {
      const userPermissions = await getUserPermissions(testUser.user_id);
      expect(userPermissions).toHaveLength(2);
    });

    it("fetches specific permission using getPermission function", async () => {
      const permission = await getPermission(testGroup.group_id, testUser.user_id, "read");
      expect(permission).toBeDefined();
      expect(permission.permission).toBe("read");
    });

    it("throws NotFoundError when getting non-existent permission", async () => {
      await expect(getPermission(testGroup.group_id, testUser.user_id, "nonexistent"))
        .rejects.toThrow(NotFoundError);
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

    it("checks permission using hasPermission function", async () => {
      const hasRead = await hasPermission(testGroup.group_id, testUser.user_id, "read");
      expect(hasRead).toBe(true);

      const hasAdmin = await hasPermission(testGroup.group_id, testUser.user_id, "admin");
      expect(hasAdmin).toBe(false);
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

    it("gets users with specific permission", async () => {
      const readUsers = await getUsersWithPermission(testGroup.group_id, "read");
      expect(readUsers).toContain(testUser.user_id);
      expect(readUsers).toHaveLength(1);

      const writeUsers = await getUsersWithPermission(testGroup.group_id, "write");
      expect(writeUsers).toContain(testUser.user_id);
      expect(writeUsers).toHaveLength(1);
    });

    it("gets group permission types", async () => {
      const permissionTypes = await getGroupPermissionTypes(testGroup.group_id);
      expect(permissionTypes).toContain("read");
      expect(permissionTypes).toContain("write");
      expect(permissionTypes).toHaveLength(2);
    });
  });

  describe("Permission Management", () => {
    let secondUser: any;

    beforeAll(async () => {
      // Create a second user for permission management tests
      secondUser = await createUser({
        user_id: 2,
        username: "permission_user_2",
        email: "user2@example.com",
        isToken: false,
        token: null,
        role: "teacher"
      });
    });

    it("grants permission to user", async () => {
      const permission = await grantPermission(testGroup.group_id, secondUser.user_id, "admin");
      expect(permission).toBeDefined();
      expect(permission.group_id).toBe(testGroup.group_id);
      expect(permission.user_id).toBe(secondUser.user_id);
      expect(permission.permission).toBe("admin");

      // Verify the permission exists
      const hasAdmin = await hasPermission(testGroup.group_id, secondUser.user_id, "admin");
      expect(hasAdmin).toBe(true);
    });

    it("revokes specific permission from user", async () => {
      await revokePermission(testGroup.group_id, secondUser.user_id, "admin");

      // Verify the permission is removed
      const hasAdmin = await hasPermission(testGroup.group_id, secondUser.user_id, "admin");
      expect(hasAdmin).toBe(false);
    });

    it("throws NotFoundError when revoking non-existent permission", async () => {
      await expect(revokePermission(testGroup.group_id, secondUser.user_id, "nonexistent"))
        .rejects.toThrow(NotFoundError);
    });

    it("revokes all user permissions in group", async () => {
      // Grant multiple permissions first
      await grantPermission(testGroup.group_id, secondUser.user_id, "admin");
      await grantPermission(testGroup.group_id, secondUser.user_id, "read");

      const revokedCount = await revokeAllUserPermissionsInGroup(testGroup.group_id, secondUser.user_id);
      expect(revokedCount).toBeGreaterThanOrEqual(2);

      // Verify permissions are removed
      const hasAdmin = await hasPermission(testGroup.group_id, secondUser.user_id, "admin");
      const hasRead = await hasPermission(testGroup.group_id, secondUser.user_id, "read");
      expect(hasAdmin).toBe(false);
      expect(hasRead).toBe(false);
    });

    it("revokes all group permissions", async () => {
      // Grant some permissions first
      await grantPermission(testGroup.group_id, secondUser.user_id, "admin");

      const revokedCount = await revokeAllGroupPermissions(testGroup.group_id);
      expect(revokedCount).toBeGreaterThanOrEqual(1);

      // Verify all permissions for the group are removed
      const groupPermissions = await getGroupPermissions(testGroup.group_id);
      expect(groupPermissions).toHaveLength(0);
    });
  });

  describe("GroupPermission Update", () => {
    it("updates group permission successfully", async () => {
      // First create a permission to update
      await createGroupPermission({
        group_id: testGroup.group_id,
        user_id: testUser.user_id,
        permission: "read"
      });

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
      // Create a permission to delete
      await createGroupPermission({
        group_id: testGroup.group_id,
        user_id: testUser.user_id,
        permission: "read"
      });

      const deletedCount = await deleteGroupPermission(testGroup.group_id, testUser.user_id);
      expect(deletedCount).toBeGreaterThanOrEqual(1);
      
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