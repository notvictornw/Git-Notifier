# Changelog

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-05

### Added
- Complete modular Express server supporting Node.js 22+.
- Timing-safe HMAC SHA-256 webhook signature verification middleware.
- Request logger showing endpoint latency and response codes.
- Size limit restrictions (10MB) and JSON parsing error handlers.
- Auto-retry queue-based Discord posting service respecting `retry-after` rate limits.
- Core base embed layout constructor containing repos, tags, avatars, and timestamps.
- Support for 17 distinct GitHub Webhook events with individual file handlers:
  - `ping`
  - `push`
  - `pull_request`
  - `issues`
  - `issue_comment`
  - `commit_comment`
  - `release`
  - `create`
  - `delete`
  - `fork`
  - `watch`
  - `discussion`
  - `discussion_comment`
  - `workflow_run`
  - `workflow_job`
  - `deployment`
  - `deployment_status`
- Dynamic YAML configuration via `config.yml` (and `CONFIG_YML_CONTENT` environment variable for cloud deployment).
- Full suite of deployment files (Dockerfile, docker-compose.yml, config.yml.example).
- Extensive documentation for VPS, Docker, Railway, Render, Coolify, Ngrok, and Cloudflare Tunnel.
