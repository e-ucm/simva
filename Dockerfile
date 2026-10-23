# ---------------------------------------
# Base
# ---------------------------------------
FROM node:26.12.1-alpine AS base

WORKDIR /app

# Common dependencies
RUN apk add --no-cache curl ca-certificates bash git

FROM base AS deps

COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS dev

RUN npm install -g tsx watch
RUN chown -R node:node /app/node_modules

USER node
EXPOSE 3000

# Default CMD, can be overridden by docker-compose
CMD ["npm", "run", "dev"]

FROM deps AS build

COPY --chown=node:node ./config ./config
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./tsconfig.json ./
COPY --chown=node:node ./tsconfig.build.json ./
COPY --chown=node:node ./api.yaml ./
# Build TypeScript to dist (compiled JS, aliases rewritten to relative paths)
RUN npm run build

FROM base AS prod

WORKDIR /app

# package.json is required by `npm start` (and by `npm rebuild sqlite3`).
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/api.yaml ./
# Schema and views SQL executed by server.ts on startup.
COPY --chown=node:node ./migrate/sqlite ./migrate/sqlite

USER node
EXPOSE 3000

# Default CMD, can be overridden by docker-compose
CMD ["npm", "start"]