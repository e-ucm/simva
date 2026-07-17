/**
 * @fileoverview Main Express application setup for SIMVA API.
 * Configures middleware, routes, and error handling for the SIMVA system.
 * 
 * This module sets up:
 * - Express JSON middleware for request parsing
 * - Health check endpoint
 * - Authentication middleware (applied globally)
 * - User management routes (feature-based: @/routes/users/)
 * - Error handling middleware
 * 
 * @module app
 * @requires express
 * @requires @/routes/users/user.routes
 * @requires @/middlewares/error.middleware
 * @requires @/middlewares/auth.middleware
 */

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { dynamicCorsOrigin } from '@/lib/utils/corsOrigins';
import * as OpenApiValidator from 'express-openapi-validator';
import userRoutes from '@/routes/users/user.routes';
import groupRoutes from '@/routes/groups/group.routes';
import simletRoutes from '@/routes/simlets/simlet.routes';
import activitiesRoutes from '@/routes/activities/activities.routes';
import limesurveyRoutes from '@/routes/limesurvey/limesurvey.routes';
import activitiesTypesRoutes from '@/routes/activitiesTypes/activitiesTypes.routes';
import allocatorsTypesRoutes from '@/routes/allocatorsTypes/allocatorsTypes.routes';
import tagsRoutes from '@/routes/tags/tags.router';
import { errorMiddleware } from '@/middlewares/error.middleware';
import { auth, roleAllowed } from "@/middlewares/auth.middleware";
import { logger } from '@/lib/logger';
import { checkDatabaseConnection } from '@/lib/db';
import { limesurveyWebhookHandler, verifyHookdeckSignature } from '@/lib/utils/limesurveyWebhook';
import { config } from '@/lib/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

/**
 * Main Express application instance for SIMVA API.
 * 
 * Configured with:
 * - JSON body parsing middleware
 * - Global authentication middleware 
 * - Health check endpoint
 * - User, groups, simlets, and activity types route handlers
 * - Global error handling middleware
 * 
 * @type {express.Express}
 */
export const app: express.Express = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const corsOptions: cors.CorsOptions = {
  origin: dynamicCorsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Experience-API-Version'],
  credentials: true,
};
app.use(cors(corsOptions));
//app.options('*', cors(corsOptions));

app.use((req: Request, _: Response, next : NextFunction) => {
  logger.debug(`${req.method} at ${req.originalUrl} with body ${req.body}`);
  next();
})

app.use(auth);
app.use(roleAllowed);

app.use(
  OpenApiValidator.middleware({
    apiSpec: `${config.appFolder}/api.yaml`,
    validateRequests: true, // (default)
    validateResponses: true, // false by default
  }),
);

app.post('/limesurvey-completion-webhooks', verifyHookdeckSignature, limesurveyWebhookHandler);

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  res.json({ status: true, db: { status: await checkDatabaseConnection() } });
});

app.get('/version', async (_req: Request, res: Response) => {
  res.json({ "version": pkg.version, "features": { "simlets": true, "sessions": true, "activities": true, "lrs_prefix": true, "groups": true, "users": true } });
});

app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/simlets', simletRoutes);
app.use('/activities', activitiesRoutes);
app.use('/limesurvey', limesurveyRoutes);
app.use('/activitytypes', activitiesTypesRoutes);
app.use('/allocatortypes', allocatorsTypesRoutes);
app.use('/tags', tagsRoutes);

app.use(errorMiddleware);
