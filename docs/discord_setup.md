# Discord Setup and Repository Mapping Guide

This guide explains how to create Discord webhooks, acquire their URLs, and configure repository-to-webhook mapping inside the `config.yml` configuration file.

---

## Part 1: Creating a Discord Webhook

Discord webhooks allow external services to post messages directly to a channel inside your server.

### 1. Open Channel Settings
1. Launch Discord and navigate to the server where you have administrative permissions.
2. In the channel list, hover over the text channel where you want to receive webhook notifications (e.g. `#git-activity` or `#alerts`).
3. Click the **Cog Icon** (**Edit Channel**) next to the channel name.

### 2. Add Integration Webhook
1. In the left-hand sidebar of the Channel Settings dialog, click **Integrations**.
2. Click the **Webhooks** option (or click **Create Webhook** if none exist yet).
3. Click **New Webhook**.
4. Configure the webhook profile:
   * **Name**: Choose a name for the poster profile (e.g. `GitHub Webhooks`).
   * **Channel**: Select the target text channel if it is not already correct.
   * **Avatar**: Optionally upload a custom avatar (like a GitHub logo).
5. Click the **Copy Webhook URL** button.
6. Click **Save Changes** in the bottom bar and close settings.

Keep this Webhook URL handy. It will look like:
`https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz_1234567890`

---

## Part 2: Repository Webhook Mapping

Our server supports routing notifications from different GitHub repositories to different Discord channels or servers.

### Mappings Configuration File
Mappings are stored in the `config.yml` file under the `repositories` section. The keys represent the case-insensitive repository name in the standard `owner/repository` format, and the values are their corresponding Discord webhook URLs.

Open your `config.yml` and structure your mappings like this:

```yaml
repositories:
  # Map repository 'hello-world' owned by user 'octocat' to target channel A
  "octocat/hello-world": "https://discord.com/api/webhooks/123456789012345678/abcdefg"

  # Map repository 'main-project' owned by org 'acme' to target channel B
  "acme/main-project": "https://discord.com/api/webhooks/987654321098765432/hijklmn"
```

### How the Router Handles Mappings

When a payload arrives from GitHub:
1. The server extracts the `repository.full_name` from the payload (e.g., `octocat/Hello-World`).
2. The server normalizes this repository name to lowercase (`octocat/hello-world`).
3. The server checks the `repositories` map in `config.yml`:
   * **If a mapping exists**: The server loads the corresponding webhook URL, parses the event, and pushes the generated embed to the Discord queue.
   * **If no mapping exists**: The server logs an info message and responds with `200 OK` (e.g., `[INFO] Received push webhook for unconfigured repository: owner/repo. Acknowledged and skipped.`). This ensures that you don't receive errors on GitHub for repositories you do not want to monitor.
