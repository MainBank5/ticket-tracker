import { ValidationError } from '../errors.js';

/**
 * Validates req.body / req.query / req.params against zod schemas.
 * Parsed (coerced, defaulted, trimmed) values are exposed on req.valid —
 * we don't overwrite req.query because it is read-only in Express 5.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const details = [];
    req.valid = {};

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        req.valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ in: part, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (details.length) return next(new ValidationError(details));
    next();
  };
}
