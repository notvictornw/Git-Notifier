import crypto from 'crypto';
import config from '../config/config.js';
import logger from '../utilities/logger.js';

export function verifySignature(req, res, next) {
  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) {
    logger.warn('Signature validation failed: X-Hub-Signature-256 header is missing');
    return res.status(401).json({ error: 'Unauthorized', message: 'Signature missing' });
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    logger.warn('Signature validation failed: Invalid X-Hub-Signature-256 header format');
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid signature format' });
  }

  const signature = parts[1];
  const rawBody = req.rawBody;

  if (!rawBody) {
    logger.warn('Signature validation failed: Raw body is empty or missing');
    return res.status(401).json({ error: 'Unauthorized', message: 'Payload body missing' });
  }

  const hmac = crypto.createHmac('sha256', config.github.secret);
  hmac.update(rawBody);
  const computedSignature = hmac.digest('hex');

  const signatureBuf = Buffer.from(signature, 'hex');
  const computedBuf = Buffer.from(computedSignature, 'hex');

  if (signatureBuf.length !== computedBuf.length || !crypto.timingSafeEqual(signatureBuf, computedBuf)) {
    logger.warn(`Signature validation failed: signature mismatch from IP ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid signature' });
  }

  next();
}

export default verifySignature;
