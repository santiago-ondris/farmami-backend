import { z } from 'zod';

const dateOnlyOrDateTimeSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.string().datetime(),
  z.date()
]);

const optionalTrimmedString = z.union([z.string(), z.null()]).optional().transform((value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
});

export const ingresoSchema = z.object({
  product_id: z.string().uuid(),
  fecha_ingreso: dateOnlyOrDateTimeSchema,
  nro_remito: optionalTrimmedString,
  lote: z.string().min(1),
  vencimiento: dateOnlyOrDateTimeSchema,
  proveedor_id: z.string().uuid(),
  cadena_frio: z.boolean(),
  cantidad: z.number().int().positive(),
  observaciones: z.string().optional().nullable()
});

export const ingresoUpdateSchema = ingresoSchema.partial();
