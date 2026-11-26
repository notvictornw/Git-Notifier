# VPS Deployment Guide

This guide explains how to deploy the GitHub to Discord Webhook server on a Virtual Private Server (VPS) running Linux (Ubuntu/Debian) using Nginx as a reverse proxy, PM2 for process management, and Let's Encrypt for SSL certificates.

---

## Step 1: Install Node.js and Tools

Log into your VPS via SSH and install Node.js 22, Git, and Nginx:

```bash
# Add NodeSource Node.js 22 repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js, git, nginx
sudo apt-get install -y nodejs git nginx
```

Verify the installation:
```bash
node -v
npm -v
```

---

## Step 2: Clone the Project and Install

Clone the repository to a folder like `/var/www/github-webhooks`:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www

git clone https://github.com/fczavian/git-notifier.git .
npm install --only=production
```

---

## Step 3: Configure Settings

Copy the configuration example and edit:

```bash
cp config.yml.example config.yml
nano config.yml
```

Set the server port (e.g. `3000`), input your secure GitHub HMAC secret, and configure the repository-to-Discord mappings.

---

## Step 4: Manage the Process with PM2

PM2 is a process manager that runs your Node.js application in the background, restarts it if it crashes, and starts it automatically on system boot.

Install PM2 globally:
```bash
sudo npm install -g pm2
```

Start the application using PM2:
```bash
pm2 start index.js --name "github-webhook"
```

Configure PM2 to start on boot:
```bash
pm2 startup
```
*Note: Run the command printed on the screen by PM2 to complete setup.*

Save the current PM2 process list:
```bash
pm2 save
```

Useful PM2 Commands:
* `pm2 status`: Show running processes.
* `pm2 logs github-webhook`: Monitor logs in real-time.
* `pm2 restart github-webhook`: Restart the application.

---

## Step 5: Configure Nginx Reverse Proxy

Nginx will receive HTTPS requests from the web and forward them to your Node app running on port 3000.

Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/webhook.yourdomain.com
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name webhook.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/webhook.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 6: Secure Your Server with SSL (Certbot)

GitHub requires HTTPS endpoints for webhooks in standard secure configurations. You can use Certbot to acquire a free Let's Encrypt certificate:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d webhook.yourdomain.com
```

Follow the prompts. Certbot will automatically configure SSL and auto-renewal.

---

## Step 7: Update the GitHub Webhook Settings

In your GitHub repository settings, update the Payload URL to use your domain:
`https://webhook.yourdomain.com/github`
