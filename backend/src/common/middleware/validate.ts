import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';
import { ValidationError, type RequestPart, type ValidationIssue } from '../errors.js';

declare module 'express-serve-static-core' {
  interface Request {
    /** Parsed request data, populated by validate(). Read it with getValid(). */
    valid?: Partial<Record<RequestPart, unknown>>;
  }
}

const PARTS: RequestPart[] = ['params', 'query', 'body'];

/**
 * Validates req.params / req.query / req.body against zod schemas.
 * Parsed (coerced, defaulted, trimmed) values are exposed on req.valid — we don't
 * overwrite req.query because it is read-only in Express 5.
 */
export function validate(schemas: Partial<Record<RequestPart, z.ZodType>>): RequestHandler {
  return (req, _res, next) => {
    const issues: ValidationIssue[] = [];
    const valid: Partial<Record<RequestPart, unknown>> = {};

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ in: part, path: issue.path.map(String).join('.'), message: issue.message });
        }
      }
    }

    if (issues.length) return next(new ValidationError(issues));
    req.valid = valid;
    next();
  };
}


export function getValid<S extends z.ZodType>(req: Request, part: RequestPart, _schema: S): z.output<S> {
  return req.valid?.[part] as z.output<S>;
}
