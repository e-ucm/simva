import { Request, Response, NextFunction } from "express";
import { logger } from "@/lib/logger";
import { NotFoundError, BadRequestError } from "@/lib/errors/appErrors";

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

  res.status(500).json({ message: "Internal server error" });
}
