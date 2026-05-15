'use strict';

const AppError = require('../utils/AppError');

function validateRequest(schemas) {
  return (req, _res, next) => {
    const targets = ['body', 'query', 'params'];
    for (const key of targets) {
      const schema = schemas[key];
      if (!schema) continue;
      const { value, error } = schema.validate(req[key], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        const details = error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        }));
        return next(AppError.badRequest('Validation failed', { details }));
      }
      req[key] = value;
    }
    return next();
  };
}

module.exports = validateRequest;
