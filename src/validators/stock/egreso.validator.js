import { z } from 'zod';

const dateOnlyOrDateTimeSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.string().datetime(),
  z.date()
]);

export const egresoSchema = z.object({
  product_id: z.string().uuid(),
  fecha_entrega: dateOnlyOrDateTimeSchema,
  cantidad: z.number().int().positive(),
  empresa_solicitante: z.string().min(1),
  lote: z.string().min(1),
  vencimiento: dateOnlyOrDateTimeSchema,
  serial: z.string().optional().nullable(),
  orden_compra: z.string().optional().nullable(),
  estado_remito: z.enum(['Pendiente', 'Entregado', 'Cancelado']).default('Pendiente'),
  confirm_negative: z.boolean().optional()
});

export const egresoUpdateSchema = egresoSchema.partial().omit({ confirm_negative: true });
