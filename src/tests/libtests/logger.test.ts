import { jest } from '@jest/globals';
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
    it("should create logs directory if it doesn't exist", async () => {
      const testLogsFolder = path.join(process.cwd(), 'test-logs');

      // Clean up test directory if it exists
      if (fs.existsSync(testLogsFolder)) {
        fs.rmSync(testLogsFolder, { recursive: true, force: true });
      }

      // Load a fresh config and logger so the directory creation runs again
      jest.resetModules();
      const { config: freshConfig } = await import('@/lib/config');
      freshConfig.logger.folder = testLogsFolder;
      await import('@/lib/logger');

      // Check if directory was created
      expect(fs.existsSync(testLogsFolder)).toBe(true);

      // Clean up
      if (fs.existsSync(testLogsFolder)) {
        fs.rmSync(testLogsFolder, { recursive: true, force: true });
      }
    });

    it("should handle existing logs directory", async () => {
      const testLogsFolder = path.join(process.cwd(), 'existing-logs');

      // Create directory first
      if (!fs.existsSync(testLogsFolder)) {
        fs.mkdirSync(testLogsFolder, { recursive: true });
      }

      jest.resetModules();
      const { config: freshConfig } = await import('@/lib/config');
      freshConfig.logger.folder = testLogsFolder;

      // Import logger - should not throw error for existing directory
      await expect(import('@/lib/logger')).resolves.toBeDefined();

      // Clean up
      if (fs.existsSync(testLogsFolder)) {
        fs.rmSync(testLogsFolder, { recursive: true, force: true });
      }
    });
  });

  describe("logger instance", () => {
    it("should export logger instance", async () => {
      const { logger } = await import('@/lib/logger');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.fatal).toBe('function');
    });

    it("should be able to log messages", async () => {
      const { logger } = await import('@/lib/logger');

      // These should not throw
      expect(() => logger.info('Test info message')).not.toThrow();
      expect(() => logger.debug('Test debug message')).not.toThrow();
      expect(() => logger.warn('Test warn message')).not.toThrow();
    });
  });

  describe("process handlers", () => {
    it("should handle uncaught exceptions without logger errors", async () => {
      // Mock logger.error to capture fallback behavior
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      const originalFatal = logger.fatal;
      logger.fatal = jest.fn().mockImplementation(() => {
        throw new Error('Logger failed');
      }) as any;

      // Trigger uncaught exception handler by emitting the event
      const testError = new Error('Test uncaught exception');
      process.emit('uncaughtException' as any, testError);

      // Should have fallen back to logger.error
      expect(consoleSpy).toHaveBeenCalledWith('uncaughtException', testError);

      // Restore
      logger.fatal = originalFatal;
      consoleSpy.mockRestore();
    });

    it("should handle unhandled rejections without logger errors", async () => {
      // Mock logger.error to capture fallback behavior
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { logger } = await import('@/lib/logger');
      const originalFatal = logger.fatal;
      logger.fatal = jest.fn().mockImplementation(() => {
        throw new Error('Logger failed');
      }) as any;

      // Trigger unhandled rejection handler by emitting the event
      const testReason = new Error('Test unhandled rejection');
      process.emit('unhandledRejection' as any, testReason);

      // Should have fallen back to logger.error
      expect(consoleSpy).toHaveBeenCalledWith('unhandledRejection', testReason);

      // Restore
      logger.fatal = originalFatal;
      consoleSpy.mockRestore();
    });
  });
});
