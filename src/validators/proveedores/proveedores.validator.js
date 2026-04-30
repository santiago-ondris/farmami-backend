import { z } from 'zod';

const optionalTrimmedString = z.union([z.string(), z.null()]).optional().transform((value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
});

const proveedorTipoEnum = z.enum([
  'LABORATORIO',
  'DROGUERIA',
  'IMPORTADOR',
  'DISTRIBUIDOR',
  'PROVEEDOR_SERVICIOS',
  'PROVEEDOR_INSUMOS'
]);

export const proveedorSchema = z.object({
  numero: z.string().trim().min(1, 'El numero es obligatorio'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  direccion: optionalTrimmedString,
  cuit: optionalTrimmedString,
  gln: optionalTrimmedString,
  nombre_contacto: optionalTrimmedString,
  telefono_contacto: optionalTrimmedString,
  tipo: proveedorTipoEnum,
  producto_o_servicio: optionalTrimmedString,
  habilitacion_jurisdiccion_provincial: z.boolean().optional().default(false),
  ultima_resolucion_djf: z.boolean().optional().default(false),
  disposicion_habilitacion_anmat: z.boolean().optional().default(false),
  cert_buenas_practicas_transito: z.boolean().optional().default(false),
  resolucion_cambio_direccion_tecnica: z.boolean().optional().default(false),
  registro_productos_anmat: z.boolean().optional().default(false),
  habilitacion_municipal: z.boolean().optional().default(false),
  constancia_afip: z.boolean().optional().default(false),
  documentacion_completa: z.boolean().optional().default(false),
  observaciones: optionalTrimmedString
});

export const proveedorUpdateSchema = proveedorSchema.partial();
export { proveedorTipoEnum };
