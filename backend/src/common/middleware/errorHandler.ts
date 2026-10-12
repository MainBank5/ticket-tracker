import type { ErrorRequestHandler, RequestHandler } from 'express';
import { config } from '../../config/env.js';
import { AppError } from '../errors.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Cannot ${req.method} ${req.path}`));
};

// body-parser (express.json) tags its errors with a `type` string.
function errorType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string') {
    return err.type;
  }
  return undefined;
}

// Every error leaves the API in the same shape: { error: { code, message, details? } }
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details !== undefined && { details: err.details }) },
    });
    return;
  }

  switch (errorType(err)) {
    case 'entity.parse.failed':
      res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
      return;
    case 'entity.too.large':
      res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
      return;
  }

  if (!config.isTest) console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
