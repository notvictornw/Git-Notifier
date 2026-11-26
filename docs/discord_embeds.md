# How Discord Embeds Are Generated

Discord Embeds allow rich formatting, custom colors, author profiles, and structured lists of fields. Our server formats every event into a structured Discord embed to ensure notifications are professional, clean, and easy to read.

This document describes the structure of these embeds and how they are generated programmatically.

---

## The Embed Object Structure

Every Discord message dispatched by the server utilizes the Discord Webhook execution body:
```json
{
  "embeds": [
    {
      "title": "String",
      "description": "String",
      "url": "String",
      "color": "Integer",
      "author": {
        "name": "String",
        "icon_url": "String",
        "url": "String"
      },
      "fields": [
        {
          "name": "String",
          "value": "String",
          "inline": "Boolean"
        }
      ],
      "timestamp": "ISO-8601 Timestamp String",
      "footer": {
        "text": "String",
        "icon_url": "String"
      }
    }
  ]
}
```

---

## 1. The Base Embed Template

To maintain consistency and reduce code duplication, the helper `src/utilities/embed.js` creates a baseline template for all events:

* **Repository Name & URL**: Set as the embed's `title` and clickable `url`.
* **Author Name & Avatar**: The `author` object maps to the GitHub user who initiated the action (e.g., the pusher, issue creator, or release publisher) using `payload.sender.login` and `payload.sender.avatar_url`.
* **Timestamp**: Set to the exact ISO execution timestamp.
* **Footer**: Configured to show the source server and event type, e.g. `GitHub Webhooks • [event]`.

---

## 2. Event-Specific Enhancements

Each individual event handler adds custom context to the base template.

### A. Push Events (`src/handlers/push.js`)
* **Color**: Green (`3066993` / `0x2ECC71`).
* **Title**: Prefixed with `📤 Push to [branch]`.
* **Description**: Lists the pusher name, total commit count, and formats up to 10 commits.
* **Markdown Formatting**: Commits are listed with clickable short hashes and truncation:
  `[f2c41a2](https://github.com/.../commit/...) Added payment gateway - john-doe`

### B. Pull Requests (`src/handlers/pull_request.js`)
* **Color**: Blue (`3447003` / `0x3498DB`), Purple if Merged (`10181046`), Red if Closed without merge (`15158332`).
* **Title**: Prefixed with `🔌 Pull Request #[number] [action]`.
* **Fields**: Standardized inline fields:
  * **Author**: Developer username.
  * **State**: Current PR status (`open`, `closed`, `merged`).
  * **Draft**: `Yes` or `No`.
  * **Merged**: `Yes` or `No`.

### C. Workflow Runs (`src/handlers/workflow_run.js`)
* **Color**: Dynamic depending on conclusion:
  * Success: Green (`3066993`).
  * Failure/Timeout: Red (`15158332`).
  * In-progress: Blue (`3447003`).
* **Fields**: Inline fields showing branch name, shortened commit SHA, status, and conclusion.

---

## Color Palette Configuration

Color-coding allows developers to instantly parse notifications:

| Event Group | Color Theme | Hex Code | Decimal Code |
| :--- | :--- | :--- | :--- |
| Ping, Setup | Blurple | `#7289DA` | `7506394` |
| Push, Success events | Green | `#2ECC71` | `3066993` |
| Pull Requests, Jobs | Blue | `#3498DB` | `3447003` |
| Issues, Comments | Orange / Yellow | `#E67E22` | `15105570` |
| Releases | Gold | `#F1C40F` | `16766720` |
| Delete, Failure events | Red | `#E74C3C` | `15158332` |
| Discussions, Forks | Purple / Slate | `#8E44AD` | `9323437` |
