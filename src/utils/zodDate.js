import { z } from 'zod';
import { parseDateInput } from './dateOnly.js';

export const dateOnlyOrDateTimeSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.string().datetime(),
  z.date()
]);

export const nullableDateOnlyOrDateTimeSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.string().datetime(),
  z.date(),
  z.null()
]);

export const requiredDate = dateOnlyOrDateTimeSchema.transform((value) => parseDateInput(value));

export const optionalDate = nullableDateOnlyOrDateTimeSchema.optional().transform((value) => {
  if (!value) {
    return null;
  }

  return parseDateInput(value);
});
