# ---------------------------------------
# Base
# ---------------------------------------
FROM timbru31/node-alpine-git:22 AS base

WORKDIR /app

# Common dependencies
RUN apk add --no-cache curl ca-certificates bash

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
COPY --chown=node:node ./public ./public
COPY --chown=node:node ./tsconfig.json ./
COPY --chown=node:node ./api.yaml ./
# Build TypeScript to dist
RUN npm run build

FROM node:22-alpine AS prod

WORKDIR /app

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/public ./public
COPY --chown=node:node --from=build /app/api.yaml ./

USER node
EXPOSE 3000

# Default CMD, can be overridden by docker-compose
CMD ["npm", "start"]