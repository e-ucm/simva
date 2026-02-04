import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  getAllSimlets,
  getSimletById,
  getSimletsByCoordinator,
  getSimletsByAllocator,
  searchSimletsByName,
  searchSimletsByDescription,
  getSimletsCreatedAfter,
  createSimlet,
  updateSimlet,
  deleteSimlet,
  countSimlets,
  countSimletsByCoordinator,
  countSimletsByAllocator,
  simletExists,
  isSimletNameAvailable,
  getSimletsWithSandbox,
  getSimletsWithoutSandbox,
  getSimletsWithObjectives
} from "@/services/simlets/simlet.service";
import { createUser } from "@/services/users/user.service";
import { NotFoundError } from "@/lib/errors/appErrors";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

let testCoordinator: any;
let testAllocator: any;
let testSimlet: any;
let secondSimlet: any;

/**
 * Integration tests for Simlet service CRUD operations and queries.
 * Tests all business logic functions with proper database setup and cleanup.
 */
describe("Simlet Service", () => {
  beforeAll(async () => {
    try {
      await db.sequelize.sync({ force: true });
      
      // Create test user to be simlet coordinator
      testCoordinator = await createUser({
        user_id: 1,
        username: "simlet_coordinator",
        email: "coordinator@example.com",
        isToken: false,
        token: null,
        role: "teacher"
      });

      // Create test allocator (assuming it exists in the Tables)
      testAllocator = await db.Tables.Allocators.create({
        allocator_type: "random"
      });
    } catch (err) {
      logger.error({ err }, "Test setup failed");
    }
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  beforeEach(async () => {
    // Clean up simlets table before each test
    await db.Tables.Simlets.destroy({ where: {}, force: true });
  });

  describe("createSimlet", () => {
    it("creates a simlet successfully", async () => {
      const simletData = {
        name: "Test Simlet",
        description: "A test simulation learning environment",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      };

      testSimlet = await createSimlet(simletData);

      expect(testSimlet.simlet_id).toBeDefined();
      expect(testSimlet.name).toBe("Test Simlet");
      expect(testSimlet.description).toBe("A test simulation learning environment");
      expect(testSimlet.allocator_id).toBe(testAllocator.allocator_id);
      expect(testSimlet.simlet_coordinator_id).toBe(testCoordinator.user_id);
      expect(testSimlet.createdAt).toBeDefined();
      expect(testSimlet.updatedAt).toBeDefined();
    });

    it("creates a simlet with optional fields", async () => {
      const simletData = {
        name: "Advanced Simlet",
        description: "Advanced learning environment",
        objective: "Learn advanced mathematics",
        sandbox_session_id: 123,
        mongo_id: "507f1f77bcf86cd799439011",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      };

      testSimlet = await createSimlet(simletData);

      expect(testSimlet.objective).toBe("Learn advanced mathematics");
      expect(testSimlet.sandbox_session_id).toBe(123);
      expect(testSimlet.mongo_id).toBe("507f1f77bcf86cd799439011");
    });
  });

  describe("getAllSimlets", () => {
    beforeEach(async () => {
      testSimlet = await createSimlet({
        name: "First Simlet",
        description: "First test simlet",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      secondSimlet = await createSimlet({
        name: "Second Simlet",
        description: "Second test simlet",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("retrieves all simlets", async () => {
      const simlets = await getAllSimlets();

      expect(simlets).toHaveLength(2);
      expect(simlets[0].name).toBe("First Simlet");
      expect(simlets[1].name).toBe("Second Simlet");
    });

    it("retrieves simlets with limit", async () => {
      const simlets = await getAllSimlets(1);

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("First Simlet");
    });

    it("retrieves simlets with limit and offset", async () => {
      const simlets = await getAllSimlets(1, 1);

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("Second Simlet");
    });
  });

  describe("getSimletById", () => {
    beforeEach(async () => {
      testSimlet = await createSimlet({
        name: "Test Simlet",
        description: "Test description",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("retrieves a simlet by ID", async () => {
      const simlet = await getSimletById(testSimlet.simlet_id);

      expect(simlet.simlet_id).toBe(testSimlet.simlet_id);
      expect(simlet.name).toBe("Test Simlet");
    });

    it("throws NotFoundError for non-existent simlet", async () => {
      await expect(getSimletById(999999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateSimlet", () => {
    beforeEach(async () => {
      testSimlet = await createSimlet({
        name: "Original Simlet",
        description: "Original description",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("updates a simlet successfully", async () => {
      const updatedSimlet = await updateSimlet(testSimlet.simlet_id, {
        name: "Updated Simlet",
        description: "Updated description"
      });

      expect(updatedSimlet.name).toBe("Updated Simlet");
      expect(updatedSimlet.description).toBe("Updated description");
      expect(updatedSimlet.simlet_id).toBe(testSimlet.simlet_id);
    });

    it("updates only specified fields", async () => {
      const originalName = testSimlet.name;
      const updatedSimlet = await updateSimlet(testSimlet.simlet_id, {
        description: "Only description updated"
      });

      expect(updatedSimlet.name).toBe(originalName);
      expect(updatedSimlet.description).toBe("Only description updated");
    });

    it("throws NotFoundError when updating non-existent simlet", async () => {
      await expect(updateSimlet(999999, { name: "Updated" })).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteSimlet", () => {
    beforeEach(async () => {
      testSimlet = await createSimlet({
        name: "To Delete",
        description: "This simlet will be deleted",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("deletes a simlet successfully", async () => {
      await deleteSimlet(testSimlet.simlet_id);

      await expect(getSimletById(testSimlet.simlet_id)).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when deleting non-existent simlet", async () => {
      await expect(deleteSimlet(999999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getSimletsByCoordinator", () => {
    it("retrieves simlets by coordinator ID", async () => {
      testSimlet = await createSimlet({
        name: "Coordinator Simlet",
        description: "Managed by coordinator",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      const simlets = await getSimletsByCoordinator(testCoordinator.user_id);

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("Coordinator Simlet");
      expect(simlets[0].simlet_coordinator_id).toBe(testCoordinator.user_id);
    });

    it("returns empty array when coordinator has no simlets", async () => {
      const simlets = await getSimletsByCoordinator(999);

      expect(simlets).toHaveLength(0);
    });
  });

  describe("getSimletsByAllocator", () => {
    it("retrieves simlets by allocator ID", async () => {
      testSimlet = await createSimlet({
        name: "Allocator Simlet",
        description: "Uses specific allocator",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      const simlets = await getSimletsByAllocator(testAllocator.allocator_id);

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("Allocator Simlet");
      expect(simlets[0].allocator_id).toBe(testAllocator.allocator_id);
    });
  });

  describe("searchSimletsByName", () => {
    beforeEach(async () => {
      await createSimlet({
        name: "Mathematics Learning",
        description: "Math focused simlet",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      await createSimlet({
        name: "Science Exploration",
        description: "Science focused simlet",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("finds simlets matching name pattern", async () => {
      const simlets = await searchSimletsByName("Math");

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("Mathematics Learning");
    });

    it("returns empty array when no matches found", async () => {
      const simlets = await searchSimletsByName("NonExistent");

      expect(simlets).toHaveLength(0);
    });
  });

  describe("searchSimletsByDescription", () => {
    beforeEach(async () => {
      await createSimlet({
        name: "Interactive Simlet",
        description: "Interactive learning environment",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("finds simlets matching description pattern", async () => {
      const simlets = await searchSimletsByDescription("interactive");

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("Interactive Simlet");
    });
  });

  describe("getSimletsCreatedAfter", () => {
    it("retrieves simlets created after specific date", async () => {
      const pastDate = new Date('2020-01-01');
      
      testSimlet = await createSimlet({
        name: "Recent Simlet",
        description: "Created recently",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      const simlets = await getSimletsCreatedAfter(pastDate);

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("Recent Simlet");
    });
  });

  describe("countSimlets", () => {
    it("counts total simlets correctly", async () => {
      await createSimlet({
        name: "Count Test 1",
        description: "For counting",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      await createSimlet({
        name: "Count Test 2",
        description: "For counting",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      const count = await countSimlets();

      expect(count).toBe(2);
    });
  });

  describe("countSimletsByCoordinator", () => {
    it("counts simlets by coordinator correctly", async () => {
      await createSimlet({
        name: "Coordinator Count 1",
        description: "Test",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      const count = await countSimletsByCoordinator(testCoordinator.user_id);

      expect(count).toBe(1);
    });
  });

  describe("countSimletsByAllocator", () => {
    it("counts simlets by allocator correctly", async () => {
      await createSimlet({
        name: "Allocator Count 1",
        description: "Test",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      const count = await countSimletsByAllocator(testAllocator.allocator_id);

      expect(count).toBe(1);
    });
  });

  describe("simletExists", () => {
    beforeEach(async () => {
      testSimlet = await createSimlet({
        name: "Existence Test",
        description: "Test existence",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("returns true for existing simlet", async () => {
      const exists = await simletExists(testSimlet.simlet_id);

      expect(exists).toBe(true);
    });

    it("returns false for non-existent simlet", async () => {
      const exists = await simletExists(999999);

      expect(exists).toBe(false);
    });
  });

  describe("isSimletNameAvailable", () => {
    beforeEach(async () => {
      await createSimlet({
        name: "Taken Name",
        description: "Name is taken",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("returns false for taken name", async () => {
      const available = await isSimletNameAvailable("Taken Name");

      expect(available).toBe(false);
    });

    it("returns true for available name", async () => {
      const available = await isSimletNameAvailable("Available Name");

      expect(available).toBe(true);
    });
  });

  describe("getSimletsWithSandbox", () => {
    beforeEach(async () => {
      await createSimlet({
        name: "With Sandbox",
        description: "Has sandbox session",
        sandbox_session_id: 123,
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      await createSimlet({
        name: "Without Sandbox",
        description: "No sandbox session",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("retrieves only simlets with sandbox sessions", async () => {
      const simlets = await getSimletsWithSandbox();

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("With Sandbox");
      expect(simlets[0].sandbox_session_id).toBe(123);
    });
  });

  describe("getSimletsWithObjectives", () => {
    beforeEach(async () => {
      await createSimlet({
        name: "With Objective",
        description: "Has learning objective",
        objective: "Learn something important",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });

      await createSimlet({
        name: "Without Objective",
        description: "No learning objective",
        allocator_id: testAllocator.allocator_id,
        simlet_coordinator_id: testCoordinator.user_id
      });
    });

    it("retrieves only simlets with objectives", async () => {
      const simlets = await getSimletsWithObjectives();

      expect(simlets).toHaveLength(1);
      expect(simlets[0].name).toBe("With Objective");
      expect(simlets[0].objective).toBe("Learn something important");
    });
  });
});