import { z } from 'zod';

const aptitudEnum = z.enum(['APTO', 'NO_APTO']);

const requiredDate = z.union([z.string(), z.date()]).transform((value) => (
  value instanceof Date ? value : new Date(value)
));

const evaluacionProveedorFieldsSchema = z.object({
  fecha: requiredDate,
  habilitacion_jurisdiccion_provincial: aptitudEnum,
  ultima_resolucion_djf: aptitudEnum,
  disposicion_habilitacion_anmat: aptitudEnum,
  cert_buenas_practicas_transito: aptitudEnum,
  resolucion_cambio_direccion_tecnica: aptitudEnum,
  registro_productos_anmat: aptitudEnum,
  habilitacion_municipal: aptitudEnum,
  constancia_afip: aptitudEnum,
  documentacion_completa: aptitudEnum
});

export const evaluacionProveedorSchema = evaluacionProveedorFieldsSchema;
export const evaluacionProveedorUpdateSchema = evaluacionProveedorFieldsSchema.partial();
