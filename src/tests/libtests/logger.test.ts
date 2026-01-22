import * as fs from 'fs';
import * as path from 'path';
import { config } from "@/lib/config";

/**
 * Tests for logger module functionality.
 * Note: Some logger lines are hard to test as they involve file system operations
 * and global error handlers that run in different contexts.
 */
describe("Logger", () => {
  let originalConfig: any;
  
  beforeEach(() => {
    // Store original config
    originalConfig = { ...config.logger };
  });
  
  afterEach(() => {
    // Restore original config
    Object.assign(config.logger, originalConfig);
  });

  describe("logger initialization", () => {
    it("should create logs directory if it doesn't exist", () => {
      // Test the directory creation logic by importing logger
      // This will trigger the fs.existsSync and fs.mkdirSync code paths
      
      const testLogsFolder = path.join(process.cwd(), 'test-logs');
      
      // Temporarily change config to point to test directory
      config.logger.folder = testLogsFolder;
      
      // Clean up test directory if it exists
      if (fs.existsSync(testLogsFolder)) {
        fs.rmSync(testLogsFolder, { recursive: true, force: true });
      }
      
      // Import logger to trigger directory creation
      delete require.cache[require.resolve('@/lib/logger')];
      require('@/lib/logger');
      
      // Check if directory was created
      expect(fs.existsSync(testLogsFolder)).toBe(true);
      
      // Clean up
      if (fs.existsSync(testLogsFolder)) {
        fs.rmSync(testLogsFolder, { recursive: true, force: true });
      }
    });

    it("should handle existing logs directory", () => {
      const testLogsFolder = path.join(process.cwd(), 'existing-logs');
      
      // Create directory first
      if (!fs.existsSync(testLogsFolder)) {
        fs.mkdirSync(testLogsFolder, { recursive: true });
      }
      
      config.logger.folder = testLogsFolder;
      
      // Import logger - should not throw error for existing directory
      delete require.cache[require.resolve('@/lib/logger')];
      expect(() => require('@/lib/logger')).not.toThrow();
      
      // Clean up
      if (fs.existsSync(testLogsFolder)) {
        fs.rmSync(testLogsFolder, { recursive: true, force: true });
      }
    });
  });

  describe("logger instance", () => {
    it("should export logger instance", () => {
      const { logger } = require('@/lib/logger');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.fatal).toBe('function');
    });

    it("should be able to log messages", () => {
      const { logger } = require('@/lib/logger');
      
      // These should not throw
      expect(() => logger.info('Test info message')).not.toThrow();
      expect(() => logger.debug('Test debug message')).not.toThrow();
      expect(() => logger.warn('Test warn message')).not.toThrow();
    });
  });

  describe("process handlers", () => {
    it("should handle uncaught exceptions without logger errors", () => {
      // Mock console.error to capture fallback behavior
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate logger throwing an error
      const { logger } = require('@/lib/logger');
      const originalFatal = logger.fatal;
      logger.fatal = jest.fn().mockImplementation(() => {
        throw new Error('Logger failed');
      });
      
      // Trigger uncaught exception handler by emitting the event
      const testError = new Error('Test uncaught exception');
      process.emit('uncaughtException' as any, testError);
      
      // Should have fallen back to console.error
      expect(consoleSpy).toHaveBeenCalledWith('uncaughtException', testError);
      
      // Restore
      logger.fatal = originalFatal;
      consoleSpy.mockRestore();
    });

    it("should handle unhandled rejections without logger errors", () => {
      // Mock console.error to capture fallback behavior
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Simulate logger throwing an error
      const { logger } = require('@/lib/logger');
      const originalFatal = logger.fatal;
      logger.fatal = jest.fn().mockImplementation(() => {
        throw new Error('Logger failed');
      });
      
      // Trigger unhandled rejection handler by emitting the event
      const testReason = new Error('Test unhandled rejection');
      process.emit('unhandledRejection' as any, testReason);
      
      // Should have fallen back to console.error
      expect(consoleSpy).toHaveBeenCalledWith('unhandledRejection', testReason);
      
      // Restore
      logger.fatal = originalFatal;
      consoleSpy.mockRestore();
    });
  });
});