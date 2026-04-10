import { z } from 'zod';

export const egresoSchema = z.object({
  product_id: z.string().uuid(),
  fecha_entrega: z.string().datetime().or(z.date()),
  cantidad: z.number().int().positive(),
  empresa_solicitante: z.string().min(1),
  lote: z.string().min(1),
  vencimiento: z.string().datetime().or(z.date()),
  serial: z.string().optional().nullable(),
  orden_compra: z.string().optional().nullable(),
  estado_remito: z.enum(['Pendiente', 'Entregado', 'Cancelado']).default('Pendiente'),
  confirm_negative: z.boolean().optional()
});

export const egresoUpdateSchema = egresoSchema.partial().omit({ confirm_negative: true });
