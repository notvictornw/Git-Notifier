# Configuration Guide (config.yml)

The server is configured using a single YAML configuration file named `config.yml` located in the root of the project directory.

---

## File Schema and Parameters

Below is a breakdown of the configuration keys and their purpose.

```yaml
server:
  # The port on which the Express application will run.
  # Type: Integer
  # Default: 3000
  port: 3000

github:
  # The secret key configured in your GitHub repository's Webhook Settings.
  # This is used to sign payloads and verify that they originate from GitHub.
  # Type: String (Secret)
  # Required: Yes (Cannot be empty or default)
  secret: "YOUR_GITHUB_WEBHOOK_SECRET"

# Map of repository names to Discord webhook URLs.
# Format: "owner/repository-name": "https://discord.com/api/webhooks/..."
# Type: Object
# Required: Yes (at least one valid mapping is recommended)
repositories:
  "octocat/hello-world": "https://discord.com/api/webhooks/12345/abc"
```

### Parameter Rules
1. **`server.port`**: Must be a number between 1 and 65535.
2. **`github.secret`**: Cannot be empty. The server will refuse to start if it is missing or set to default example values.
3. **`repositories`**:
   - The repository name must be in `owner/repo` format.
   - The key is case-insensitive. The server normalizes all keys to lowercase on launch.
   - The webhook URL must start with `https://`.

---

## Example Configurations

### Standard Single Repo Configuration
```yaml
server:
  port: 3000

github:
  secret: "8f5d0ad542bb01c107ff0ea9d8e573d8b"

repositories:
  "contoso-company/core-service": "https://discord.com/api/webhooks/11223344/abcdef"
```

### Multi-repository Routing Configuration
```yaml
server:
  port: 8080

github:
  secret: "f3a2b1c0d9e8f7a6"

repositories:
  "contoso-company/core-service": "https://discord.com/api/webhooks/11223344/abcdef"
  "contoso-company/frontend-web": "https://discord.com/api/webhooks/55667788/ghijkl"
  "individual-user/side-project": "https://discord.com/api/webhooks/99001122/mnopqr"
```

---

## Environment Fallback for Docker/VPS
If you want to customize the path where the server looks for the config file, you can set the `CONFIG_PATH` environment variable. This is highly useful for running in containerized environments like Docker or Kubernetes.

Example:
```bash
export CONFIG_PATH="/etc/webhook-server/production-config.yml"
npm start
```

---

## Common Configuration Mistakes

### 1. Tab Characters in YAML
YAML does not support tab characters for indentation. You must use spaces (typically 2 spaces per indentation level).
* **Incorrect**:
  ```yaml
  server:
  	port: 3000 # Tab character used before port
  ```
* **Correct**:
  ```yaml
  server:
    port: 3000 # Two spaces used
  ```

### 2. Missing Quote Marks for Org/Repo Names
Keys containing special characters or forward slashes should be enclosed in quotes to prevent YAML parsing issues.
* **Incorrect**:
  ```yaml
  repositories:
    octocat/hello-world: https://discord.com/api/webhooks/...
  ```
* **Correct**:
  ```yaml
  repositories:
    "octocat/hello-world": "https://discord.com/api/webhooks/..."
  ```

### 3. Missing GitHub Webhook Secret
If you leave `github.secret` empty, the server will log a critical error and exit. This safeguard protects your server from unauthorized webhook payloads.
