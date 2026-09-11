/**
 * @fileoverview Controller for OAuth2 Device Authorization Grant endpoints.
 * Handles HTTP requests for initiating the device flow and polling for tokens.
 *
 * These endpoints are public (unauthenticated) because the device flow is used
 * to authenticate users who are not yet logged in. They proxy the request to
 * Keycloak via the auth2 service.
 *
 * @module controllers/auth2/auth2
 */

import { NextFunction, Request, Response } from "express";
import * as auth2Service from "@/services/auth2/auth2.service";
import { BadRequestError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";

/**
 * Initiates the OAuth2 Device Authorization Grant flow.
 *
 * Routes: POST /auth2/:activity_id/device
 *
 * @async
 * @function initiateDevice
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export async function initiateDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activityId = Number(req.params.activity_id);
    if (!Number.isInteger(activityId)) {
      throw new BadRequestError("activity_id must be a valid integer.");
    }

    const login_hint = typeof req.query.login_hint === 'string' ? req.query.login_hint : undefined;
    const result = await auth2Service.initiateDeviceFlow(activityId, login_hint);
    res.status(200).send(result);
  } catch (e) {
    logger.error({ error: e }, '[AUTH2] Failed to initiate device flow');
    next(e);
  }
}

/**
 * Polls the token endpoint to exchange a device_code for tokens.
 *
 * Routes: POST /auth2/:activity_id/token
 *
 * The body can be either JSON ({ "device_code": "..." }) or form-encoded.
 * On success returns the access/refresh tokens. If the user hasn't authorized
 * yet, the Keycloak error (authorization_pending) is relayed back.
 *
 * @async
 * @function pollToken
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 */
export async function pollToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activityId = Number(req.params.activity_id);
    if (!Number.isInteger(activityId)) {
      throw new BadRequestError("activity_id must be a valid integer.");
    }

    let result: object;
    switch(req.body?.grant_type!) {
      case "refresh_token":
        result = await auth2Service.refreshAuthToken(activityId, req.body);
        res.status(200).send(result);
        break;
      case "device":
      default:
        let deviceCode = req.body?.device_code;
        if (!deviceCode) {
          deviceCode = req.query?.device_code;
        }
        if (typeof deviceCode !== 'string' || !deviceCode.trim()) {
          throw new BadRequestError("device_code is required.");
        }

        try {
          result = await auth2Service.pollForToken(activityId, deviceCode.trim());
        } catch (e: any) {
          // Keycloak returns 400 with an error payload (authorization_pending, etc.)
          // Relay that error payload back to the caller with the same status.
          const status = e?.response?.status || 400;
          const data = e?.response?.data || { error: 'invalid_request', error_description: e?.message || 'Failed to poll token' };
          return res.status(status).send(data);
        }
        res.status(200).send(result);
    }
  } catch (e) {
    logger.error({ error: e }, '[AUTH2] Failed to poll token');
    next(e);
  }
}
