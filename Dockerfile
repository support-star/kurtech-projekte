FROM node:20-alpine

# Build dependencies für better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Data volume
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "server.js"]
