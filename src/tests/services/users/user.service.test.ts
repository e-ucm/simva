import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAllUsers,
  getUserById,
  getUserByUsername,
  createUser,
  updateUsers,
  deleteUsers
} from "@/services/users/user.service";
import { NotFoundError } from "@/lib/errors/appErrors";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

let testUser: any;
let secondUser: any;

/**
 * Integration tests for User service CRUD operations and queries.
 */
describe("User Service", () => {
  beforeAll(async () => {
    try {
      await db.sequelize.sync({ force: true });
    } catch (err) {
      logger.error({ err }, "Sequelize sync failed");
    }
  });

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 100));
    await db.sequelize.close();
  });

  describe("User Creation", () => {
    it("creates a user successfully", async () => {
      testUser = await createUser({
        user_id: 1,
        username: "john_doe",
        email: "john@example.com",
        isToken: false,
        token: null,
        role: "teacher"
      });

      expect(testUser).toBeDefined();
      expect(testUser.user_id).toBe(1);
      expect(testUser.username).toBe("john_doe");
      expect(testUser.email).toBe("john@example.com");
      expect(testUser.role).toBe("teacher");
      expect(testUser.isToken).toBe(false);
    });

    it("creates a second user for testing", async () => {
      secondUser = await createUser({
        user_id: 2,
        username: "jane_smith",
        email: "jane@example.com",
        isToken: true,
        token: "test_token_123",
        role: "student"
      });

      expect(secondUser).toBeDefined();
      expect(secondUser.username).toBe("jane_smith");
      expect(secondUser.role).toBe("student");
      expect(secondUser.isToken).toBe(true);
    });
  });

  describe("User Retrieval", () => {
    it("fetches all users", async () => {
      const users = await getAllUsers();
      expect(users).toHaveLength(2);
      expect(users[0].username).toBe("john_doe");
      expect(users[1].username).toBe("jane_smith");
    });

    it("fetches user by ID", async () => {
      const user = await getUserById(1);
      expect(user.username).toBe("john_doe");
      expect(user.email).toBe("john@example.com");
    });

    it("throws NotFoundError for non-existent user ID", async () => {
      await expect(getUserById(999)).rejects.toThrow(NotFoundError);
    });

    it("fetches user by username", async () => {
      const user = await getUserByUsername("john_doe");
      expect(user.user_id).toBe(1);
      expect(user.email).toBe("john@example.com");
    });

    it("throws NotFoundError for non-existent username", async () => {
      await expect(getUserByUsername("non_existent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("User Update", () => {
    it("updates user successfully", async () => {
      const updatedUser = await updateUsers({ user_id: 1 }, {
        email: "john.updated@example.com",
        role: "admin"
      });
      expect(updatedUser).toBe(1); // Number of affected rows
      
      const userAfterUpdate = await getUserById(1);

      expect(userAfterUpdate.email).toBe("john.updated@example.com");
      expect(userAfterUpdate.role).toBe("admin");
      expect(userAfterUpdate.username).toBe("john_doe"); // Should remain unchanged
    });

    it("throws NotFoundError when updating non-existent user", async () => {
      await expect(updateUsers({ user_id: 999 }, { role: "admin" })).rejects.toThrow(NotFoundError);
    });
  });

  describe("User Deletion", () => {
    it("deletes user successfully", async () => {
      await deleteUsers({ user_id: 2 });
      
      // Verify user is deleted
      await expect(getUserById(2)).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when deleting non-existent user", async () => {
      await expect(deleteUsers({ user_id: 999 })).rejects.toThrow(NotFoundError);
    });
  });
});