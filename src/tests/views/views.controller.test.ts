import request from "supertest";
import { app } from "@/app";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

// Mock the auth middleware to accept our test tokens
jest.mock('@/middlewares/auth.middleware', () => ({
  auth: (req: any, res: any, next: any) => {
    // Mock user for tests
    req.user = {
      data: {
        username: 'testuser',
        role: 'student'
      }
    };
    next();
  },
  roleAllowed: (req: any, res: any, next: any) => {
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    next();
  }
}));

describe("Views Controller", () => {
  const mockSimlet = {
    simlet_id: 1,
    name: "Test Simlet",
    description: "A test simlet",
    created_at: "2026-01-22T14:48:18.084Z",
    updated_at: "2026-01-22T14:48:18.084Z"
  };

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Setup test data if needed
    const user = await db.Tables.User.create({
      username: "testuser",
      email: "test@example.com",
      isToken: false,
      role: "student"
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db.Tables.User.destroy({ where: {} });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("GET /views/simlets/:simlet_id", () => {
    it("should return 400 for invalid simlet_id", async () => {
      const response = await request(app)
        .get("/views/simlets/invalid")
        .expect(400);

      expect(response.body.message).toBe("Invalid simlet_id parameter");
    });

    it("should return 404 when simlet not found", async () => {
      // Mock the view query to return empty result
      jest.spyOn(db.Functions, 'runViewQuery').mockResolvedValue([]);

      const response = await request(app)
        .get("/views/simlets/999")
        .expect(404);

      expect(response.body.message).toBe("Simlet not found");
    });

    it("should return simlet data when found", async () => {
      jest.spyOn(db.Functions, 'runViewQuery').mockResolvedValue([mockSimlet]);

      const response = await request(app)
        .get("/views/simlets/1")
        .expect(200);

      expect(response.body).toEqual([mockSimlet]);
    });
  });

  describe("GET /views/simlets/user/:username", () => {
    it("should return 400 for empty username", async () => {
      const response = await request(app)
        .get("/views/simlets/user/%20")  // URL-encoded space
        .expect(400);

      expect(response.body.message).toBe("Username parameter is required");
    });

    it("should return simlets for user", async () => {
      const mockSimlets = [
        { simlet_id: 1, username: "testuser", name: "Test Simlet" }
      ];
      jest.spyOn(db.Functions, 'runViewQuery').mockResolvedValue(mockSimlets);

      const response = await request(app)
        .get("/views/simlets/user/testuser")
        .expect(200);

      expect(response.body).toEqual(mockSimlets);
    });
  });

  describe("GET /views/simlets/:simlet_id/permissions", () => {
    it("should return 400 for invalid simlet_id", async () => {
      const response = await request(app)
        .get("/views/simlets/invalid/permissions")
        .expect(400);

      expect(response.body.message).toBe("Invalid simlet_id parameter");
    });

    it("should return permissions for simlet", async () => {
      const mockPermissions = [
        { user_id: 1, object_id: 1, permission: "READ" }
      ];
      jest.spyOn(db.Functions, 'runViewQuery').mockResolvedValue(mockPermissions);

      const response = await request(app)
        .get("/views/simlets/1/permissions")
        .expect(200);

      expect(response.body).toEqual(mockPermissions);
    });
  });

  describe("GET /views/sessions/:session_id", () => {
    it("should return 400 for invalid session_id", async () => {
      const response = await request(app)
        .get("/views/sessions/invalid")
        .expect(400);

      expect(response.body.message).toBe("Invalid session_id parameter");
    });

    it("should return 404 when session not found", async () => {
      jest.spyOn(db.Functions, 'runViewQuery').mockResolvedValue([]);

      const response = await request(app)
        .get("/views/sessions/999")
        .expect(404);

      expect(response.body.message).toBe("Session not found");
    });

    it("should return session data when found", async () => {
      const mockSession = [{ session_id: 1, name: "Test Session" }];
      jest.spyOn(db.Functions, 'runViewQuery').mockResolvedValue(mockSession);

      const response = await request(app)
        .get("/views/sessions/1")
        .expect(200);

      expect(response.body).toEqual(mockSession);
    });
  });

  describe("GET /views/sessions/simlet/:simlet_id/user/:username", () => {
    it("should return 400 for invalid simlet_id", async () => {
      const response = await request(app)
        .get("/views/sessions/simlet/invalid/user/testuser")
        .expect(400);

      expect(response.body.message).toBe("Invalid simlet_id parameter");
    });

    it("should return 400 for empty username", async () => {
      const response = await request(app)
        .get("/views/sessions/simlet/1/user/%20")  // URL-encoded space
        .expect(400);

      expect(response.body.message).toBe("Username parameter is required");
    });

    it("should return sessions for simlet and user", async () => {
      const mockSessions = [
        { session_id: 1, simlet_id: 1, username: "testuser" }
      ];
      jest.spyOn(db.Functions, 'runViewQuery').mockResolvedValue(mockSessions);

      const response = await request(app)
        .get("/views/sessions/simlet/1/user/testuser")
        .expect(200);

      expect(response.body).toEqual(mockSessions);
    });
  });

  describe("GET /views/sessions/:session_id/permissions", () => {
    it("should return 400 for invalid session_id", async () => {
      const response = await request(app)
        .get("/views/sessions/invalid/permissions")
        .expect(400);

      expect(response.body.message).toBe("Invalid session_id parameter");
    });

    it("should return permissions for session", async () => {
      const mockPermissions = [
        { user_id: 1, object_id: 1, permission: "WRITE" }
      ];
      jest.spyOn(db.Functions, 'runViewQuery').mockResolvedValue(mockPermissions);

      const response = await request(app)
        .get("/views/sessions/1/permissions")
        .expect(200);

      expect(response.body).toEqual(mockPermissions);
    });
  });
});