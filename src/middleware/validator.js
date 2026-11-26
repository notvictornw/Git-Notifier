import logger from '../utilities/logger.js';

export function jsonErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn(`Invalid JSON payload received from ${req.ip}`);
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON payload received'
    });
  }
  next(err);
}

export function validateHeaders(req, res, next) {
  if (req.originalUrl === '/github') {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];

    if (!signature) {
      logger.warn(`Missing X-Hub-Signature-256 header in request from ${req.ip}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing X-Hub-Signature-256 header'
      });
    }

    if (!event) {
      logger.warn(`Missing X-GitHub-Event header in request from ${req.ip}`);
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing X-GitHub-Event header'
      });
    }
  }
  next();
}
