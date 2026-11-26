# Server Deployment Guide

This document provides a summary of installation, running locally, configuring the environment, and restarting the application in production.

---

## 1. Local Development Mode

To start the server for development purposes with auto-reload (nodemon) and verbose logging:

```bash
# Install dependencies
npm install

# Run the server in development mode
npm run dev
```

The server will automatically reload when code is modified. If `config.yml` is modified, the server configuration checks are re-evaluated.

---

## 2. Production Execution

To run the server in production without developer dependencies:

```bash
# Install production dependencies only
npm install --only=production

# Start the server
npm start
```

For production deployments, the application should run as a background service or container. We recommend:
* **PM2**: Excellent for Linux/VPS environments (see [VPS Deployment Guide](deployment_vps.md)).
* **Docker/Docker Compose**: Best for containerized servers (see [Docker Deployment Guide](deployment_docker.md)).

---

## 3. Updating the Application

When a new release is pushed to GitHub, update your active server:

### Direct VPS/Server Update
```bash
# Pull new files
git pull

# Install any new dependencies
npm install --only=production

# Restart the process (if using PM2)
pm2 restart github-webhook
```

### Docker Compose Update
```bash
# Pull files
git pull

# Rebuild image and restart containers
docker compose up -d --build
```

---

## 4. Troubleshooting Server Status

Check the server logs to verify request processing. If things fail:
* Verify the Nginx logs: `/var/log/nginx/error.log`
* Verify the PM2 logs: `pm2 logs github-webhook`
* Verify the Docker logs: `docker compose logs -f`
* Ensure the health endpoint GET `/` returns `200 OK` from the local system (`curl http://localhost:3000`).
