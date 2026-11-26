# Render Deployment Guide

Render is a modern cloud hosting platform for deploying web applications, static sites, databases, and cron jobs. This guide covers deploying our webhook server on Render.

---

## Step-by-Step Deployment

### 1. Push Code to GitHub
Fork or push this repository to your GitHub account (without committing your private `config.yml`).

### 2. Set Up a Web Service on Render
1. Log in to [Render.com](https://render.com).
2. Click the **New +** button in the dashboard and select **Web Service**.
3. Connect your GitHub account and select your repository.
4. On the configuration page, set:
   * **Name**: `git-notifier`
   * **Region**: Choose a region close to your target users/GitHub/Discord.
   * **Branch**: `main` (or your primary branch)
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: Select **Free** (or any paid tier).

### 3. Add Environment Variable Configuration
Instead of mounting file systems, we will use the `CONFIG_YML_CONTENT` environment variable to configure the application.

1. Scroll down on the creation page (or navigate to the **Environment** tab of the service later).
2. Click **Add Environment Variable**:
   * **Key**: `CONFIG_YML_CONTENT`
   * **Value**: Paste the full contents of your `config.yml` (containing your server settings, secrets, and repository mappings).
3. Click **Create Web Service** (or **Save Changes**).

Render will build the image, start the container, and automatically hook up routing.

### 4. Hook up GitHub Webhook
Render provides a public HTTPS URL (e.g. `https://git-notifier.onrender.com`).
Copy this URL, append `/github` to the end, and register it inside your GitHub repository settings:
`https://git-notifier.onrender.com/github`
Ensure the Content-type is set to `application/json` and that your signature secret matches.
