import { z } from 'zod';

export const productSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  laboratorio: z.string().min(1, 'El laboratorio es obligatorio')
});

export const productUpdateSchema = productSchema.partial();
