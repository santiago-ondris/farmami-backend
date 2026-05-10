import { z } from 'zod';
import { optionalDate } from '../../utils/zodDate.js';

const optionalTrimmedString = z.union([z.string(), z.null()]).optional().transform((value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
});

const documentationFlagsCreateSchema = {
  documentacion_habilitacion_djf: z.boolean().optional().default(false),
  documentacion_habilitacion_ru_ge_pre_sa: z.boolean().optional().default(false),
  documentacion_cuit: z.boolean().optional().default(false),
  documentacion_ingresos_brutos: z.boolean().optional().default(false),
  documentacion_gln: z.boolean().optional().default(false),
  documentacion_habilitacion_municipal: z.boolean().optional().default(false)
};

const documentationFlagsUpdateSchema = {
  documentacion_habilitacion_djf: z.boolean().optional(),
  documentacion_habilitacion_ru_ge_pre_sa: z.boolean().optional(),
  documentacion_cuit: z.boolean().optional(),
  documentacion_ingresos_brutos: z.boolean().optional(),
  documentacion_gln: z.boolean().optional(),
  documentacion_habilitacion_municipal: z.boolean().optional()
};

export const clienteSchema = z.object({
  establecimiento: z.string().trim().min(1, 'El establecimiento es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  direccion: optionalTrimmedString,
  localidad: optionalTrimmedString,
  direccion_tecnica: optionalTrimmedString,
  vigencia_habilitacion: optionalDate,
  gln: optionalTrimmedString,
  contacto: optionalTrimmedString,
  cuit: optionalTrimmedString,
  ...documentationFlagsCreateSchema
});

export const clienteUpdateSchema = z.object({
  establecimiento: z.string().trim().min(1, 'El establecimiento es obligatorio').optional(),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').optional(),
  direccion: optionalTrimmedString,
  localidad: optionalTrimmedString,
  direccion_tecnica: optionalTrimmedString,
  vigencia_habilitacion: optionalDate,
  gln: optionalTrimmedString,
  contacto: optionalTrimmedString,
  cuit: optionalTrimmedString,
  ...documentationFlagsUpdateSchema
});
