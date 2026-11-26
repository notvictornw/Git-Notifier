import logger from '../utilities/logger.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class DiscordQueue {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.queue = [];
    this.running = false;
  }

  enqueue(embeds) {
    this.queue.push(embeds);
    if (!this.running) {
      this.run().catch((err) => {
        logger.error(`Queue runner error for webhook: ${err.message}`);
        this.running = false;
      });
    }
  }

  async run() {
    this.running = true;
    while (this.queue.length > 0) {
      const embeds = this.queue[0];
      const success = await this.sendWithRetry(embeds);
      // Whether it succeeds or fails permanently, remove it to prevent blockage
      this.queue.shift();
    }
    this.running = false;
  }

  async sendWithRetry(embeds, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds })
        });

        if (response.ok) {
          return true;
        }

        if (response.status === 429) {
          const rateLimitData = await response.json().catch(() => ({}));
          const retryAfterHeader = response.headers.get('retry-after');

          let retryAfterSec = 2;
          if (rateLimitData.retry_after !== undefined) {
            retryAfterSec = rateLimitData.retry_after;
          } else if (retryAfterHeader) {
            retryAfterSec = parseFloat(retryAfterHeader);
          }

          const delayMs = Math.ceil(retryAfterSec * 1000);
          logger.warn(`Rate limit hit on Discord webhook. Waiting ${delayMs}ms before retry (Attempt ${attempt}/${maxRetries})`);
          await sleep(delayMs);
          continue;
        }

        const errorText = await response.text().catch(() => 'No error body');
        logger.error(`Discord webhook delivery failed permanently (Status: ${response.status}): ${errorText}`);
        return false;
      } catch (err) {
        logger.error(`Fetch error during Discord delivery: ${err.message}`);
        if (attempt === maxRetries) {
          return false;
        }
        const backoff = Math.pow(2, attempt) * 1000;
        await sleep(backoff);
      }
    }
    return false;
  }
}

const queues = new Map();

export const discordService = {
  send(webhookUrl, embeds) {
    if (!webhookUrl) return;

    let queue = queues.get(webhookUrl);
    if (!queue) {
      queue = new DiscordQueue(webhookUrl);
      queues.set(webhookUrl, queue);
    }
    queue.enqueue(embeds);
  }
};

export default discordService;
