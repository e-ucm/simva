/**
 * @fileoverview Middleware exports for SIMVA API.
 * Centralizes all Express middleware functions for easy importing.
 * 
 * This module re-exports:
 * - Authentication middleware (auth, roleAllowed, optionalAuth)
 * - Error handling middleware
 * - Authenticator class for advanced auth configuration
 * 
 * @module middlewares/index
 * @requires @/middlewares/auth.middleware
 * @requires @/middlewares/error.middleware
 */

// Authentication middleware exports
export { auth, roleAllowed, optionalAuth, Authenticator } from '@/middlewares/auth.middleware';

// Error middleware exports  
export { errorMiddleware } from '@/middlewares/error.middleware';