import { z } from 'zod';
import { optionalDate } from '../../utils/zodDate.js';

export const ordenCompraItemSchema = z.object({
  producto: z.string().trim().min(1, 'El producto es obligatorio'),
  cantidad_pedida: z.number().int().positive('La cantidad debe ser mayor a cero'),
  precio_unitario: z.number().positive('El precio unitario debe ser mayor a cero')
});

export const ordenCompraSchema = z.object({
  proveedor_id: z.string().uuid(),
  condicion_pago: z.string().trim().min(1, 'La condicion de pago es obligatoria'),
  fecha_entrega: optionalDate,
  items: z.array(ordenCompraItemSchema).min(1, 'Debe incluir al menos un item')
});

export const ordenCompraUpdateSchema = ordenCompraSchema;
