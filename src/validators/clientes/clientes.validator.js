import { z } from 'zod';
import { optionalDate } from '../../utils/zodDate.js';

const optionalTrimmedString = z.union([z.string(), z.null()]).optional().transform((value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
});

export const clienteSchema = z.object({
  establecimiento: z.string().trim().min(1, 'El establecimiento es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  direccion: optionalTrimmedString,
  localidad: optionalTrimmedString,
  direccion_tecnica: optionalTrimmedString,
  vigencia_habilitacion: optionalDate,
  gln: optionalTrimmedString,
  contacto: optionalTrimmedString,
  cuit: optionalTrimmedString
});

export const clienteUpdateSchema = clienteSchema.partial();
