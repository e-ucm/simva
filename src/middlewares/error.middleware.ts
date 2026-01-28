import { Request, Response, NextFunction } from "express";
import { logger } from "@/lib/logger";
import { NotFoundError, BadRequestError, AuthentificationError, ValidationError } from "@/lib/errors/appErrors";

/**
 * Express error handling middleware.
 * Catches and formats errors passed through the error handling chain.
 * Returns appropriate HTTP status codes and error messages.
 *
 * @middleware
 * @param {Error} err - The error object
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function (unused)
 * @returns {void} Sends JSON error response
 *
 * @example
 * ```typescript
 * app.use(errorMiddleware);
 * ```
 */
export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err);

  if (err instanceof NotFoundError) {
    return res.status(404).json({ message: err.message });
  }

  if (err instanceof BadRequestError) {
    return res.status(400).json({ message: err.message });
  }
  
  if (err instanceof ValidationError) {
    return res.status(400).json({ message: err.message });
  }
  
  if (err instanceof AuthentificationError) {
    return res.status(401).json({ message: err.message });
  }

  // For generic errors, return the error message in development/test, generic message in production
  const message = process.env.NODE_ENV === 'production' ? "Internal server error" : (err.message || "Internal server error");
  res.status(500).json({ message });
}
