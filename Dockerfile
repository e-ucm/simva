FROM node:20-alpine

WORKDIR /home/node/app

RUN npm install -g tsx watch

COPY package*.json ./
RUN npm install

COPY . .

# 🔑 Fix ownership
RUN chown -R node:node /home/node/app

# Build TypeScript to dist
RUN npm run build

USER node

EXPOSE 3000

# Default CMD, can be overridden by docker-compose
CMD ["npm", "start"]