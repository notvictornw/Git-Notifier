import express from 'express';
import helmet from 'helmet';
import config from './config/config.js';
import logger from './utilities/logger.js';
import requestLogger from './middleware/logger.js';
import { jsonErrorHandler, validateHeaders } from './middleware/validator.js';
import healthRouter from './routes/health.js';
import githubRouter from './routes/github.js';
import digestRouter from './routes/digest.js';
import dashboardRouter from './routes/dashboard.js';
import { startDigestScheduler } from './services/scheduler.js';

const app = express();
const PORT = config.server.port;

// Configure Helmet for secure HTTP headers
app.use(helmet());

// Logging middleware
app.use(requestLogger);

// Capture raw body for signature verification before parsing JSON
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Handle syntax errors in JSON payloads
app.use(jsonErrorHandler);

// Optional header check validation
app.use(validateHeaders);

// Mount routers
app.use(healthRouter);
app.use(githubRouter);
app.use(digestRouter);
app.use(dashboardRouter);

// Global 404 Route
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled request error: ${err.message}`, err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred on the server'
  });
});

// Start listening
const server = app.listen(PORT, () => {
  logger.info(`Webhook server listening on port ${PORT}`);
  logger.info(`Dashboard: http://localhost:${PORT}${config.dashboard.path}`);
  startDigestScheduler();
});

// Graceful Shutdown
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed successfully.');
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcefully exiting...');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught Exception and Unhandled Rejection monitoring
process.on('uncaughtException', (err) => {
  logger.error(`CRITICAL: Uncaught Exception: ${err.message}`, err);
  // Force exit and let container runtime or process manager restart
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('CRITICAL: Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

export default app;
