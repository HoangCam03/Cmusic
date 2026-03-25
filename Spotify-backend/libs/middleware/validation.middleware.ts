import { ZodError } from 'zod';
import { ValidationError } from '../errors.js';

export const validate = (schema: any) => {
  return async (req: any, res: any, next: any) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new ValidationError(message));
      }
      return next(error);
    }
  };
};
