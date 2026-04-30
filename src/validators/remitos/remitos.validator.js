import { z } from 'zod';
import { requiredDate } from '../../utils/zodDate.js';

const remitoEstadoEnum = z.enum(['Pendiente', 'Entregado', 'Cancelado']);

export const remitoItemSchema = z.object({
  product_id: z.string().uuid(),
  descripcion: z.string().trim().min(1, 'La descripcion es obligatoria'),
  cantidad: z.number().int().positive(),
  lote: z.string().trim().min(1, 'El lote es obligatorio'),
  vencimiento: requiredDate
});

export const remitoSchema = z.object({
  fecha: requiredDate,
  hora: z.string().regex(/^\d{2}:\d{2}$/, 'La hora debe tener formato HH:MM'),
  cliente_id: z.string().uuid(),
  estado: remitoEstadoEnum.optional().default('Pendiente'),
  items: z.array(remitoItemSchema).min(1, 'Debe incluir al menos un item'),
  force: z.boolean().optional().default(false)
});

export const remitoUpdateSchema = z.object({
  fecha: requiredDate.optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cliente_id: z.string().uuid().optional(),
  estado: remitoEstadoEnum.optional()
});

export { remitoEstadoEnum };
