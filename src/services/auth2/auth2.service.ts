/**
 * @fileoverview Service for OAuth2 Device Authorization Grant flow.
 * Proxies the Keycloak device flow on behalf of games (gameplay activities).
 *
 * Games authenticate participants using the OAuth2 Device Authorization Grant
 * (RFC 8628). Instead of talking to Keycloak directly, they talk to SIMVA which
 * proxies the request to Keycloak. This keeps the Keycloak client secret on the
 * server side and lets SIMVA pick the correct Keycloak client based on the
 * activity's game tracker technology (uAdventure vs plugin/Xasu).
 *
 * @module services/auth2/auth2
 */

import axios from 'axios';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { BadRequestError, NotFoundError } from '@/lib/errors/appErrors';

/**
 * Resolves the gameplay activity and its simlet for a given identifier.
 * The provided identifier can be either:
 * - an activity_id (the game calls /auth2/:activity_id/device directly)
 * - a simlet_id (the scheduler calls /auth2/:simlet_id/device)
 *
 * @async
 * @function resolveGameplayContext
 * @param {number} id - The activity or simlet identifier
 * @returns {Promise<{gameplayData: any, simletId: number}>} The gameplay row and its simlet id
 */
async function resolveGameplayContext(id: number): Promise<{ gameplayData: any; simletId: number }> {
  // First, try it as an activity id
  let gameplayData = await db.Tables.GamePlayActivities.findOne({
    where: { activity_id: id },
  });

  if (gameplayData) {
    // Activity id: resolve its simlet through the session -> simlet relationship
    const activity = await db.Tables.Activities.findOne({
      where: { activity_id: id },
    });
    const session = await db.Tables.Sessions.findOne({
      where: { session_id: activity?.session_id },
    });
    if (!session) {
      throw new NotFoundError(`Could not resolve simlet for activity ${id}.`);
    }
    return { gameplayData, simletId: session.simlet_id };
  }

  // Not an activity: treat it as a simlet id and find the first gameplay activity
  const simlet = await db.Tables.Simlets.findOne({ where: { simlet_id: id } });
  if (!simlet) {
    throw new NotFoundError(`No gameplay activity or simlet found with ID ${id}.`);
  }
  const sessions = await db.Tables.Sessions.findAll({ where: { simlet_id: id } });
  const sessionIds = sessions.map((s: any) => s.session_id);
  if (sessionIds.length === 0) {
    throw new NotFoundError(`Simlet ${id} has no sessions.`);
  }
  const activities = await db.Tables.Activities.findAll({
    where: { session_id: sessionIds, activity_type: 'gameplay' },
  });
  if (activities.length === 0) {
    throw new NotFoundError(`Simlet ${id} has no gameplay activities.`);
  }
  gameplayData = await db.Tables.GamePlayActivities.findOne({
    where: { activity_id: activities[0].activity_id },
  });
  if (!gameplayData) {
    throw new NotFoundError(`No gameplay activity found in simlet ${id}.`);
  }
  return { gameplayData, simletId: id };
}

/**
 * Determines the Keycloak client_id to use for a given gameplay activity or simlet.
 * The client is selected based on the resolved activity's game_tracker_technology:
 * - "uAdventure" -> config.sso.uadventureClientId (default 'uadventure')
 * - everything else -> config.sso.pluginClientId (default 'simva-plugin')
 *
 * @async
 * @function getClientIdForGameplay
 * @param {number} id - The activity or simlet identifier
 * @returns {Promise<string>} The Keycloak client id to use
 */
async function getClientIdForGameplay(id: number): Promise<string> {
  const { gameplayData } = await resolveGameplayContext(id);

  if (gameplayData.game_tracker_technology === 'uAdventure') {
    return config.sso.uadventureClientId;
  }
  return config.sso.pluginClientId;
}

/**
 * Initiates the OAuth2 Device Authorization Grant flow against Keycloak.
 *
 * POSTs to Keycloak's device authorization endpoint (config.sso.deviceAuthUrl)
 * and returns the Keycloak response to the caller, but with the verification
 * URLs rewritten to point at the SIMVA frontend device screen
 * (/scheduler/:simlet_id/device?usercode=...) instead of Keycloak's own
 * verification page. The caller (game or scheduler) then displays the returned
 * user_code / verification_uri to the user and polls the token endpoint
 * (pollForToken) until the user authorizes.
 *
 * @async
 * @function initiateDeviceFlow
 * @param {number} id - The gameplay activity id or simlet id
 * @param {string} [login_hint] - Optional login hint (e.g. the scheduler/:id) to prefill the SSO login
 * @returns {Promise<object>} The Keycloak device authorization response:
 *   device_code, user_code, verification_uri, verification_uri_complete, expires_in, interval
 */
export async function initiateDeviceFlow(id: number, login_hint?: string): Promise<object> {
  const clientId = await getClientIdForGameplay(id);

  const params: Record<string, string> = {
    client_id: clientId,
    client_secret: config.sso.clientSecret,
    scope: 'openid',
  };
  if (login_hint) {
    params.login_hint = login_hint;
  }

  logger.info(`[AUTH2] Initiating device flow for id ${id} (client_id: ${clientId})`);

  const response = await axios.post(
    config.sso.deviceAuthUrl,
    new URLSearchParams(params),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  const result = response.data;
  const { simletId } = await resolveGameplayContext(id);
  result.verification_uri = `${config.externalUrl}/scheduler/${simletId}/device`;
  result.verification_uri_complete = `${config.externalUrl}/scheduler/${simletId}/device?usercode=${encodeURIComponent(result.user_code)}`;
  return result;
}

/**
 * Polls Keycloak's token endpoint for the device flow, exchanging the
 * device_code for tokens. Returns the Keycloak response as-is, which is either:
 * - A successful token payload (access_token, refresh_token, etc.) if the user already authorized
 * - An error payload with error "authorization_pending" if the user has not yet authorized
 * - An error payload with error "expired_token" if the device_code has expired
 *
 * @async
 * @function pollForToken
 * @param {number} activityId - The gameplay activity identifier
 * @param {string} deviceCode - The device_code returned from initiateDeviceFlow
 * @returns {Promise<object>} The Keycloak token response
 */
export async function pollForToken(activityId: number, deviceCode: string): Promise<object> {
  const clientId = await getClientIdForGameplay(activityId);

  const params: Record<string, string> = {
    client_id: clientId,
    client_secret: config.sso.clientSecret,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    device_code: deviceCode,
  };

  logger.info(`[AUTH2] Polling token for activity ${activityId} (client_id: ${clientId})`);

  const response = await axios.post(
    config.sso.tokenUrl,
    new URLSearchParams(params),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  return response.data;
}
