# File server for Opengram.
#
# The original docker-compose pulled ${MyTelegramRegistry}/mytelegram-file-server
# from a registry. That image does not exist for linux/amd64 in this fork (there is
# no MyTelegram.FileServer .NET project in the source tree), so the container crashed
# on start with exit code 139 (SIGSEGV). This Dockerfile builds the file server
# LOCALLY from the same Node.js code base that the fork already uses for file
# handling, so it always matches the host architecture and starts reliably.

FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install --production

COPY server.js ./
COPY appsettings.json ./

# uploads dir must exist and be writable
RUN mkdir -p /app/uploads /app/Logs

EXPOSE 5000

# Simple container healthcheck against the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-5000}/health || exit 1

CMD ["node", "server.js"]
