# Railway Deployment Guide

Railway is a cloud platform that allows you to provision infrastructure and run web servers directly from GitHub repositories. This guide walks you through deploying the webhook server on Railway.

---

## Step-by-Step Deployment

### 1. Push Code to GitHub
Fork or push this repository to your personal GitHub account. Since we use `config.yml` (which is gitignored to protect secrets), you will deploy the repository *without* committing your local `config.yml`.

### 2. Create a Project on Railway
1. Log in to [Railway.app](https://railway.app).
2. Click **New Project** in the dashboard.
3. Select **Deploy from GitHub repo**.
4. Choose your repository from the list.
5. Click **Deploy Now** (this initial deployment might fail or remain pending because configuration is missing, which is normal).

### 3. Add Environment Variable Configuration
To bypass committing `config.yml`, our server allows you to pass the entire configuration file contents as a single environment variable named `CONFIG_YML_CONTENT`.

1. In your Railway project board, select your service box.
2. Navigate to the **Variables** tab.
3. Click **Add Variable** and enter:
   * **Name**: `CONFIG_YML_CONTENT`
   * **Value**: Copy and paste the entire text contents of your local `config.yml` (including secrets and mappings), for example:
     ```yaml
     server:
       port: 3000
     github:
       secret: "mysecretsignature"
     repositories:
       "octocat/hello-world": "https://discord.com/api/webhooks/..."
     ```
4. Click **Save**. Railway will automatically trigger a redeployment.

### 4. Expose the Application to the Public Web
By default, Railway apps are not accessible from the internet. You need to generate a public domain:
1. Select your service box.
2. Go to the **Settings** tab.
3. Scroll down to the **Public Networking** section.
4. Click **Generate Domain** (or set up a custom domain).
5. Copy the generated URL (e.g. `https://your-service-production.up.railway.app`).

### 5. Final Setup in GitHub
Navigate to your GitHub repository Settings -> Webhooks, and point the payload URL to your public Railway domain:
`https://your-service-production.up.railway.app/github`
Verify that the webhook Content-type is `application/json` and that your signature secret matches.
