/**
 * @fileoverview Main Express application setup for SIMVA API.
 * Configures middleware, routes, and error handling for the SIMVA system.
 * 
 * This module sets up:
 * - Express JSON middleware for request parsing
 * - Health check endpoint
 * - Authentication middleware (applied globally)
 * - User management routes
 * - Views/analytics routes  
 * - Error handling middleware
 * 
 * @module app
 * @requires express
 * @requires ./routes/user.routes
 * @requires ./routes/views.routes
 * @requires ./middlewares/error.middleware
 * @requires ./middlewares/auth.middleware
 */

import express, { Request, Response } from 'express';
import userRoutes from './routes/user.routes';
import viewsRoutes from './routes/views.routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { auth } from "@/middlewares/auth.middleware";

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

app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use(auth);

app.use('/users', userRoutes);
app.use('/views', viewsRoutes);

app.use(errorMiddleware);
