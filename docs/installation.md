# Installation Guide

This guide covers the prerequisites and step-by-step instructions for installing the GitHub to Discord Webhook server on various environments.

---

## Prerequisites

Before starting, ensure your host environment meets the following requirements:

1. **Node.js**: Version **22.0.0** or newer.
2. **NPM**: Version **10.0.0** or newer (usually bundled with Node.js).
3. **Git**: Installed for cloning the repository.
4. **Internet Access**: A public IP address or a tunnel (Ngrok, Cloudflare) is required to receive payloads from GitHub and dispatch webhooks to Discord.

---

## Installing Globally/Locally

### 1. Clone the Codebase
Download the project files from GitHub:

```bash
git clone https://github.com/fczavian/git-notifier.git
cd git-notifier
```

### 2. Install Project Dependencies
Run npm in the root directory to download libraries:

```bash
npm install
```

This installs:
* **`express`**: The web application server framework.
* **`helmet`**: Security middleware that sets default HTTP response headers.
* **`yaml`**: Library for loading and parsing `config.yml`.
* **`nodemon`** (dev dependency): Tool that restarts the node process automatically when code changes are detected.

---

## Verification
Verify the installation works by checking if you can run the server help or verify packages:

```bash
npm run
```

This should print the available scripts:
* `start`: Runs `node index.js`.
* `dev`: Runs `nodemon index.js` for development.

---

## Next Steps
Now that dependencies are successfully installed, proceed to the [Configuration Guide](configuration.md) to set up your repository mappings and secrets.
