/**
 * @fileoverview Main Express application setup for SIMVA API.
 * Configures middleware, routes, and error handling for the SIMVA system.
 * 
 * This module sets up:
 * - Express JSON middleware for request parsing
 * - Health check endpoint
 * - Authentication middleware (applied globally)
 * - User management routes (feature-based: @/routes/users/)
 * - Views/analytics routes (feature-based: @/routes/views/)
 * - Error handling middleware
 * 
 * @module app
 * @requires express
 * @requires @/routes/users/user.routes
 * @requires @/routes/views/views.routes
 * @requires @/middlewares/error.middleware
 * @requires @/middlewares/auth.middleware
 */

import express, { NextFunction, Request, Response } from 'express';
import userRoutes from '@/routes/users/user.routes';
import viewsRoutes from '@/routes/views/views.routes';
import { errorMiddleware } from '@/middlewares/error.middleware';
import { auth } from "@/middlewares/auth.middleware";
import { logger } from '@/lib/logger';

/**
 * Main Express application instance for SIMVA API.
 * 
 * Configured with:
 * - JSON body parsing middleware
 * - Global authentication middleware 
 * - Health check endpoint
 * - User and views route handlers
 * - Global error handling middleware
 * 
 * @type {express.Express}
 */
export const app: express.Express = express();

app.use((req: Request, _: Response, next : NextFunction) => {
  logger.info(`${req.method} at ${req.originalUrl} with body ${req.body}`);
  next();
})

app.use(express.json());
app.use(auth);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/users', userRoutes);
app.use('/views', viewsRoutes);

app.use(errorMiddleware);
