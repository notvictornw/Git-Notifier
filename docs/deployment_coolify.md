# Coolify Deployment Guide

Coolify is an open-source, self-hostable alternative to Heroku, Vercel, and Netlify. It manages your applications, databases, and services on your own servers using Docker.

This guide explains how to deploy the webhook server on Coolify.

---

## Deployment Steps

### 1. Connect Git Repository
1. Log in to your Coolify dashboard.
2. Go to **Sources** and ensure your GitHub/GitLab integration is configured.
3. Go to **Projects** -> select a project -> click **New Resource** (or click **+ Add** on your environment).
4. Select **Public GitHub Repository** or **Private GitHub Repository**.
5. Connect your repository URL and specify the branch (e.g., `main`).

### 2. Choose Build Pack
Coolify will analyze the project. You can choose:
* **Dockerfile**: Coolify will read the `Dockerfile` present in the root of the repository. (Recommended, as it uses the lightweight `node:22-alpine` build).
* **Nixpacks**: A builder that will automatically detect Node.js 22 and configure start scripts.

Select **Dockerfile** or **Nixpacks** and click **Save**.

### 3. Configure Port mapping
Under **Port Mapping** or **Configuration**:
* Ensure **Port** is set to `3000`.
* Coolify automatically provisions a reverse proxy (usually Traefik or Caddy) to handle incoming HTTPS traffic, so you do not need to configure Nginx manually.

### 4. Provide Configuration
You have two options for configuration inside Coolify:

#### Option A: Using Environment Variables (Recommended)
1. Navigate to the **Environment Variables** tab of the service in Coolify.
2. Create a new variable:
   * **Key**: `CONFIG_YML_CONTENT`
   * **Value**: Paste the full string content of your local `config.yml` file.
3. Save changes.

#### Option B: Mounting a File
If you prefer mounting configuration files directly:
1. Go to the **Storages** or **Files** section in the service settings.
2. Click **Add File** / **Mount Volume**.
3. Set the destination path to `/usr/src/app/config.yml`.
4. Paste the content of your `config.yml` into the file content editor inside Coolify.
5. Save changes.

### 5. Deploy
Click the **Deploy** button. Coolify will build the Docker container, run startup checks, assign a secure SSL domain, and start the process.

Copy the public URL provided by Coolify (e.g. `https://webhook.yourserver.com`) and add it as the webhook payload endpoint in your GitHub settings:
`https://webhook.yourserver.com/github`
Ensure Content-type is set to `application/json` and that your signature secret matches.
