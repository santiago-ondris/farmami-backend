import { z } from 'zod';

export const ingresoSchema = z.object({
  product_id: z.string().uuid(),
  fecha_ingreso: z.string().datetime().or(z.date()),
  lote: z.string().min(1),
  vencimiento: z.string().datetime().or(z.date()),
  proveedor: z.string().min(1),
  cadena_frio: z.boolean(),
  cantidad: z.number().int().positive(),
  observaciones: z.string().optional().nullable()
});

export const ingresoUpdateSchema = ingresoSchema.partial();
