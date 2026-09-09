/**
 * @fileoverview Express router for OAuth2 Device Authorization Grant endpoints.
 * These endpoints are public (no JWT required) and used by games to authenticate
 * participants via the device flow proxied to Keycloak.
 *
 * @module routes/auth2/auth2
 * @requires express
 * @requires @/controlers/auth2/auth2.controler
 */

import { Router } from "express";
import * as auth2Controlers from "@/controlers/auth2/auth2.controler";

/**
 * Express router for auth2 (device OAuth2) endpoints.
 *
 * Routes:
 * - POST /:activity_id/device - Initiate the device authorization flow
 * - POST /:activity_id/token  - Poll for an access token using the device_code
 *
 * @type {Router}
 */
const router = Router();

router.post("/:activity_id/device", auth2Controlers.initiateDevice);
router.post("/:activity_id/token", auth2Controlers.pollToken);

export default router;
