process.env.NODE_ENV = "development";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

/**
 * Tests for database initialization and logging.
 */
describe("Database", () => {
  beforeAll(async () => {
  });

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 100));
    await db.sequelize.close();
  });

  it("should execute queries with logging", async () => {
    // Mock logger.debug to verify SQL logging is called
    const loggerDebugSpy = jest.spyOn(require('@/lib/logger').logger, 'debug');
    
    // This will trigger the logging function in the Sequelize config
    await db.sequelize.query("SELECT 1 as test");
    
    // Verify that the SQL logging function was called
    expect(loggerDebugSpy).toHaveBeenCalledWith(expect.stringContaining("SELECT 1 as test"));
    
    // Verify db is properly initialized
    expect(db.sequelize).toBeDefined();
    expect(db.Tables).toBeDefined();
    expect(db.Functions).toBeDefined();
    expect(db.Views).toBeDefined();
    
    // Restore spy
    loggerDebugSpy.mockRestore();
  });

  it("should log SQL queries through sequelize logging function", async () => {
    const loggerDebugSpy = jest.spyOn(require('@/lib/logger').logger, 'debug');
    
    // Execute multiple different SQL operations to trigger logging
    await db.sequelize.query("SELECT COUNT(*) as count FROM sqlite_master");
    await db.sequelize.query("PRAGMA table_info(sqlite_master)");
    
    // Verify the logging function (line 49) was called for each query
    expect(loggerDebugSpy).toHaveBeenCalledWith(expect.stringContaining("SELECT COUNT(*)"));
    expect(loggerDebugSpy).toHaveBeenCalledWith(expect.stringContaining("PRAGMA table_info"));
    
    loggerDebugSpy.mockRestore();
  });
  
  it("should have all required tables", () => {
    // Core models
    expect(db.Tables.User).toBeDefined();
    
    // Activity models
    expect(db.Tables.Activities).toBeDefined();
    expect(db.Tables.ActivityCompletion).toBeDefined();
    expect(db.Tables.GamePlayActivities).toBeDefined();
    expect(db.Tables.LimesurveyActivities).toBeDefined();
    expect(db.Tables.ManualActivities).toBeDefined();
    
    // Allocator models
    expect(db.Tables.Allocators).toBeDefined();
    expect(db.Tables.ExperimentalParticipants).toBeDefined();
    expect(db.Tables.RandomAllocators).toBeDefined();
    
    // Group models
    expect(db.Tables.Group).toBeDefined();
    expect(db.Tables.GroupParticipants).toBeDefined();
    expect(db.Tables.GroupPermissions).toBeDefined();
    
    // Session models
    expect(db.Tables.Sessions).toBeDefined();
    expect(db.Tables.SessionPermissions).toBeDefined();
    expect(db.Tables.SessionTags).toBeDefined();
    
    // Simlet models
    expect(db.Tables.Simlets).toBeDefined();
    expect(db.Tables.SimletGroups).toBeDefined();
    expect(db.Tables.SimletPermissions).toBeDefined();
    expect(db.Tables.SimletShlinks).toBeDefined();
    
    // Tag models
    expect(db.Tables.SessionTagsList).toBeDefined();
    
    // Template models
    expect(db.Tables.ActivityTemplates).toBeDefined();
    expect(db.Tables.ActivityTemplatePermissions).toBeDefined();
    expect(db.Tables.GameplayActivitiesTemplates).toBeDefined();
    expect(db.Tables.LimesurveyActivitiesTemplates).toBeDefined();
    expect(db.Tables.ManualActivitiesTemplates).toBeDefined();
  });
});