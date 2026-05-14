import { db } from '@/lib/db';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

const CACHE_TTL_MS = 60_000;

let cachedOrigins: string[] = [];
let cacheExpiresAt = 0;

async function fetchGameOrigins(): Promise<string[]> {
  const rows = await db.Tables.GamePlayActivities.findAll({
    attributes: ['game_url'],
  });

  const origins = new Set<string>();
  for (const row of rows) {
    const raw: string = (row as any).game_url;
    if (!raw) continue;
    try {
      const { origin } = new URL(raw);
      if (origin && origin !== 'null') origins.add(origin);
    } catch {
      logger.debug(`CORS: skipping unparseable game_url: ${raw}`);
    }
  }
  return Array.from(origins);
}

async function getAllowedOrigins(): Promise<string[]> {
  const now = Date.now();
  if (now < cacheExpiresAt) return cachedOrigins;

  try {
    const gameOrigins = await fetchGameOrigins();
    cachedOrigins = [...new Set([...config.cors.allowedOrigins, ...gameOrigins])];
    cacheExpiresAt = now + CACHE_TTL_MS;
    logger.debug(`CORS: allowed origins refreshed: ${cachedOrigins.join(', ')}`);
  } catch (err) {
    logger.error({ err }, 'CORS: failed to refresh game origins, keeping previous list');
  }

  return cachedOrigins;
}

export function dynamicCorsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  if (!origin) {
    // Non-browser requests (curl, server-to-server) — allow
    callback(null, true);
    return;
  }

  getAllowedOrigins()
    .then((allowed) => {
      if (allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    })
    .catch((err) => callback(err));
}
