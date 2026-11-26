import logger from '../utilities/logger.js';

export function requestLogger(req, res, next) {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);
    const status = res.statusCode;
    const logMsg = `${req.method} ${req.originalUrl} - Status: ${status} - Duration: ${durationMs}ms`;

    if (status >= 400) {
      logger.warn(logMsg);
    } else {
      logger.info(logMsg);
    }
  });

  next();
}

export default requestLogger;
