FROM node:22.14.0-bullseye

# Install ca-certificates and update them
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates && \
    update-ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Set the working directory
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

USER node

RUN npm install

# Copy the current directory contents into the container at /app
COPY --chown=node:node . .

RUN mkdir -p /home/node/logs && chown -R node:node /home/node/logs

# Make port 443 available to the world outside this container
EXPOSE 443

CMD [ "npm", "start" ]