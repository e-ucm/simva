import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";

/**
 * Unit tests for database functions.
 */
describe("Database Functions", () => {
  beforeAll(async () => {
    try {
      await db.sequelize.sync({ force: true });
      
    } catch (err) {
      logger.error({ err }, "Setup failed");
    }
  });

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 100));
    await db.sequelize.close();
  });

  describe("runViewQuery", () => {
    it("should throw error for invalid query template with missing sql", async () => {
      const invalidQuery = {
        sql: null,
        params: { user_id: { type: "number", required: true } }
      };

      await expect(
        db.Functions.runViewQuery(invalidQuery, { user_id: 1 })
      ).rejects.toThrow("Invalid query template");
    });

    it("should throw error for invalid query template with missing params", async () => {
      const invalidQuery = {
        sql: "SELECT * FROM users WHERE user_id = :user_id",
        params: null
      };

      await expect(
        db.Functions.runViewQuery(invalidQuery, { user_id: 1 })
      ).rejects.toThrow("Invalid query template");
    });

    it("should throw error for invalid query template with missing both", async () => {
      const invalidQuery = {
        sql: null,
        params: null
      };

      await expect(
        db.Functions.runViewQuery(invalidQuery, {})
      ).rejects.toThrow("Invalid query template");
    });
  });
});