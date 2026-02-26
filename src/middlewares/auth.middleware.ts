/**
 * @fileoverview Authentication middleware for SIMVA API.
 * Provides JWT token validation, role-based access control, and route protection.
 * 
 * This module provides:
 * - JWT token validation with multiple issuer support (Keycloak, internal)
 * - Role-based route access control using OpenAPI specification
 * - Optional authentication for public endpoints
 * - User creation/update from Keycloak tokens
 * - Comprehensive error handling for authentication failures
 * 
 * @module auth.middleware
 * @requires express
 * @requires jsonwebtoken
 * @requires @/lib/logger
 * @requires @/services/users/user.service
 * @requires @/lib/config
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/lib/logger';
import fs from 'fs';
import yaml from 'yaml';
import { validateJWT, KeycloakJWTPayload } from '@/services/users/user.auth.service';
import { AuthentificationError, NotFoundError } from '@/lib/errors/appErrors';
import path from 'path';
import { config } from '@/lib/config';

/**
 * Extended Express Request interface that includes authenticated user data.
 * Used by all protected routes to access user information.
 * 
 * @interface AuthenticatedRequest
 * @extends Request
 * @property {KeycloakJWTPayload} [user] - Decoded and validated user data from JWT
 */
export interface AuthenticatedRequest extends Request {
  user?: KeycloakJWTPayload;
}

/**
 * Structure for defining role-based route permissions.
 * Maps user roles to allowed HTTP methods and routes.
 * 
 * @interface RouteStructure
 */
interface RouteStructure {
  [role: string]: {
    [method: string]: string[];
  };
}

/**
 * Authentication manager class that handles route permissions and JWT validation.
 * Parses OpenAPI specification to determine role-based access control.
 * 
 * @class Authenticator
 */
export class Authenticator {
  private static allowedRoutes: RouteStructure = {};
  private static initialized = false;

  /**
   * Initialize the authentication paths from the OpenAPI specification.
   * Parses api.yaml to build role-based route permission matrix.
   * 
   * @static
   * @method initPaths
   * @returns {void}
   * 
   * @example
   * ```typescript
   * Authenticator.initPaths();
   * // Loads route permissions from api.yaml
   * ```
   */
  static initPaths(): void {
    try {
      const apiYamlPath = path.resolve(config.appFolder, 'api.yaml');
      const descriptor = yaml.parse(fs.readFileSync(apiYamlPath, 'utf8'));

      for (const path in descriptor.paths) {
        const route = descriptor.paths[path];
        for (const [method, methodConfig] of Object.entries(route) as [string, any][]) {
          if (!methodConfig.tags) {
            // Routes without tags are allowed for all roles
            if (!this.allowedRoutes['*']) {
              this.allowedRoutes['*'] = {};
            }

            const tag = this.allowedRoutes['*'];

            if (!tag[method]) {
              tag[method] = [];
            }

            tag[method].push(path);
          } else {
            for (let i = 0; i < methodConfig.tags.length; i++) {
              // Remove the last 's' from the tags to match role names
              const roleTag = methodConfig.tags[i].toLowerCase().slice(0, -1);
              if(!roleTag.endsWith('_database') && !roleTag.endsWith('health')) {
                if (!this.allowedRoutes[roleTag]) {
                    this.allowedRoutes[roleTag] = {};
                }

                const tag = this.allowedRoutes[roleTag];

                if (!tag[method]) {
                    tag[method] = [];
                }

                tag[method].push(path);
                }
            }
          }
        }
      }

      logger.debug('####################### FINAL TREE OF ALLOWED ROUTES #######################');
      logger.debug(JSON.stringify(this.allowedRoutes, null, 2));
      logger.debug('############################################################################');

      this.initialized = true;
    } catch (error) {
      logger.error({error}, 'Failed to initialize authentication paths:');
    }
  }

  /**
   * Compare a generic route pattern with a specific route.
   * Handles OpenAPI path parameters (e.g., {id}) in route matching.
   * 
   * @private
   * @static
   * @method compareRoutes
   * @param {string} generic - Generic route pattern from OpenAPI (e.g., /users/{id})
   * @param {string} specific - Specific route from request (e.g., /users/123)
   * @returns {boolean} True if routes match, false otherwise
   * 
   * @example
   * ```typescript
   * compareRoutes('/users/{id}', '/users/123'); // returns true
   * compareRoutes('/users/{id}', '/posts/123'); // returns false
   * ```
   */
  private static compareRoutes(generic: string, specific: string): boolean {
    const gsplit = generic.split('/');
    const ssplit = specific.split('/');

    if (gsplit.length !== ssplit.length) {
      return false;
    }

    for (let i = 0; i < gsplit.length; i++) {
      if (gsplit[i][0] === '{') {
        // Skip path parameters
        continue;
      } else if (gsplit[i] === ssplit[i]) {
        continue;
      } else {
        return false;
      }
    }
    return true;
  }

  /**
   * Get user role from Keycloak realm access roles.
   * Maps Keycloak roles to SIMVA internal role system.
   * 
   * @private
   * @static
   * @method getRoleFromRealmAccessRoles
   * @param {KeycloakJWTPayload} userdata - Decoded JWT payload containing realm_access
   * @returns {string} Mapped SIMVA role (teacher, student, or norole)
   * 
   * @example
   * ```typescript
   * const role = getRoleFromRealmAccessRoles({
   *   sso: {
   *     realm_access: { roles: ['teacher', 'researcher'] }
   *   }
   * });
   * // Returns 'teacher'
   * ```
   */
  private static getRoleFromRealmAccessRoles(userdata: KeycloakJWTPayload): string {
    let role = 'norole';
    if (userdata.sso.realm_access?.roles) {
      if (userdata.sso.realm_access.roles.includes('teacher') || userdata.sso.realm_access.roles.includes('researcher')) {
        role = 'teacher';
      } else if (userdata.sso.realm_access.roles.includes('teaching-assistant') || userdata.sso.realm_access.roles.includes('student')) {
        role = 'student';
      }
    }
    return role;
  }

  /**
   * Main authentication middleware function.
   * Validates JWT tokens and enforces role-based access control.
   * 
   * @static
   * @method auth
   * @param {AuthenticatedRequest} req - Express request object (will be extended with user data)
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when authentication is complete
   * 
   * @example
   * ```typescript
   * app.use(Authenticator.auth);
   * // or
   * app.get('/protected', Authenticator.auth, handler);
   * ```
   */

  static isPublicEndpoint(path: string): boolean {
    const publicEndpoints = [
      '/health',
      '/limesurvey-completion-webhooks'
    ];
    
    return publicEndpoints.some(endpoint => path === endpoint || path.startsWith(endpoint));
  }

  static auth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.initialized) {
          this.initPaths();
        }
        
        // Skip authentication for public endpoints
        const requestPath = req.path;
        if (this.isPublicEndpoint(requestPath)) {
          logger.debug(`[AUTH] Public endpoint ${req.method} ${req.path} - skipping authentication`);
          return this.optional(req, res, next);
        }
        
        logger.debug(`[AUTH] Starting authentication for ${req.method} ${req.path}`);
        let token: string | undefined = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
        if (!token && req.query && typeof (req.query as any).token === 'string' && (req.query as any).token) {
          token = `Bearer ${(req.query as any).token}`;
          logger.debug('[AUTH] Token found in query parameters');
        }
        
        logger.debug(`Authenticating request for ${req.path} ${req.method}`);
        
        if (!token) {
          logger.debug('[AUTH] No authorization token found');
          throw new AuthentificationError('No authorization header');
        }

        if (typeof token !== 'string' || token.indexOf('Bearer') !== 0) {
          logger.debug('[AUTH] Invalid Bearer token format');
          throw new AuthentificationError('Auth header is not a valid Bearer.');
        }

        token = token.substring(7);
        logger.debug(`[AUTH] Extracted token: ${token.substring(0, 20)}...`);
        
        try {
          logger.debug('[AUTH] Starting JWT validation');
          req.user = await validateJWT(token);
          logger.debug(`[AUTH] JWT validation successful for user: ${req.user.sql.username}`);
          // After successful authentication and user resolution, proceed
          return next();
        } catch (error) {
          logger.error({
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            path: req.path,
            method: req.method
          }, '[AUTH] Authentication failed');
          logger.debug(`[AUTH] JWT validation failed: ${error instanceof Error ? error.message : String(error)}`);
          throw new AuthentificationError('JWT token is not valid.');
        }
    } catch(e) {
      next(e);
    }
  };

  /**
   * Role-based authorization middleware.
   * Checks if authenticated user has permission to access the requested route.
   * 
   * @static
   * @method roleAllowed
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when authorization check is complete
   * 
   * @example
   * ```typescript
   * app.get('/admin/*', auth, roleAllowed, adminHandler);
   * ```
   */
  static roleAllowed = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const method = req.method.toLowerCase();
      const url = req.originalUrl.split('?')[0];
      
      logger.debug(`[ROLE] Checking authorization for ${method.toUpperCase()} ${url}`);

      // Skip authentication for public endpoints
      const requestPath = req.path;
      if (this.isPublicEndpoint(requestPath)) {
        logger.debug('[ROLE] Public endpoint access allowed');
        return next();
      }
      
      if (!req.user?.sso) {
        logger.debug('[ROLE] No user data found in request');
        throw new NotFoundError('No user data found');
      }

      // Get user role - use database role or derive from realm access
      let userRole = req.user.sql.role;
      if (!userRole && req.user.sso.realm_access) {
        userRole = this.getRoleFromRealmAccessRoles(req.user);
        logger.debug(`[ROLE] Derived role from realm access: ${userRole}`);
      }
      
      logger.debug(`[ROLE] User: ${req.user.sql.username}, Role: ${userRole}`);
      if (!userRole) {
        logger.debug('[ROLE] No role found for user');
        throw new NotFoundError('No role found for user');
      }

      // Check if role has any allowed routes for this method
      if (!this.allowedRoutes[userRole] || !this.allowedRoutes[userRole][method]) {
        logger.debug(`[ROLE] No routes found for role ${userRole} and method ${method}`);
        // Also check wildcard routes
        if (!this.allowedRoutes['*'] || !this.allowedRoutes['*'][method]) {
          logger.debug('[ROLE] No wildcard routes found either');
          throw new NotFoundError('The route you are trying to access does not exist.');
        }
      }

      // url already computed above
      logger.debug(`Checking access: ${url} ${method} ${userRole}`);

      // Check role-specific routes
      let allowedList = this.allowedRoutes[userRole]?.[method] || [];
      
      // Also check wildcard routes
      if (this.allowedRoutes['*']?.[method]) {
        allowedList = allowedList.concat(this.allowedRoutes['*'][method]);
      }
      
      logger.debug(`[ROLE] Checking against ${allowedList.length} allowed routes`);

      for (let i = 0; i < allowedList.length; i++) {
        if (this.compareRoutes(allowedList[i], url)) {
          logger.debug(`[ROLE] Access allowed - matched route: ${allowedList[i]}`);
          return next();
        }
      }

      logger.debug(`[ROLE] Access denied - no matching route found for ${url}`);
      throw new AuthentificationError('You are not authorized to access this route.');
    } catch(e) {
      next(e);
    }
  };

  /**
   * Optional authentication middleware for public routes.
   * Attempts to authenticate if token is provided, but continues without error if authentication fails.
   * 
   * @static
   * @method optional
   * @param {AuthenticatedRequest} req - Express request object (may be extended with user data)
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when optional authentication is complete
   * 
   * @example
   * ```typescript
   * app.get('/public', optionalAuth, publicHandler);
   * // Route works with or without authentication
   * ```
   */
  static optional = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers.authorization || `Bearer ${req.query.token}`;
        if (!token || typeof token !== 'string' || token.indexOf('Bearer') !== 0) {
          return next(); // Continue without authentication
        }

        try {
          const tokenString = token.substring(7);
          req.user = await validateJWT(tokenString);
          logger.debug(`[AUTH] User authenticated: ${req.user.sql.username}`);
        } catch (e) {
          // Swallow authentication errors and continue
          logger.debug('[AUTH] Optional authentication failed, continuing without user context');
        }
        next();
    } catch (e) {
      next(e);
    }
  };
}

// Initialize paths on module load
Authenticator.initPaths();

/**
 * Main authentication middleware export.
 * Validates JWT tokens and adds user data to request.
 * 
 * @function auth
 * @type {Function}
 */
export const auth = Authenticator.auth;

/**
 * Role-based authorization middleware export.
 * Enforces route access based on user roles.
 * 
 * @function roleAllowed
 * @type {Function}
 */
export const roleAllowed = Authenticator.roleAllowed;