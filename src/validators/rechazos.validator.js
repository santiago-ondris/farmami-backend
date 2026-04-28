import { z } from 'zod';

const optionalTrimmedString = z.union([z.string(), z.null()]).optional().transform((value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
});

const requiredDate = z.union([z.string(), z.date()]).transform((value) => (
  value instanceof Date ? value : new Date(value)
));

export const rechazoSchema = z.object({
  fecha: requiredDate,
  product_id: z.string().uuid(),
  lote: z.string().trim().min(1, 'El lote es obligatorio'),
  motivo_rechazo: z.string().trim().min(1, 'El motivo de rechazo es obligatorio'),
  cantidad: z.number().int().positive(),
  remito: optionalTrimmedString,
  proveedor_id: z.string().uuid()
});

export const rechazoUpdateSchema = rechazoSchema.partial();
