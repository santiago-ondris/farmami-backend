import { z } from 'zod';
import { requiredDate } from '../../utils/zodDate.js';

const aptitudEnum = z.enum(['APTO', 'NO_APTO']);

const evaluacionClienteFieldsSchema = z.object({
  fecha: requiredDate,
  habilitacion_direccion_jurisdiccion: aptitudEnum,
  habilitacion_sanitaria_rugepresa: aptitudEnum,
  constancia_cuit: aptitudEnum,
  constancia_ingresos_brutos: aptitudEnum,
  certificado_gln: aptitudEnum,
  habilitacion_municipal: aptitudEnum,
  puntualidad_pagos: aptitudEnum,
  frecuencia_compras: aptitudEnum,
  volumen_compras: aptitudEnum,
  condicion_financiera_general: aptitudEnum,
  experiencia_personal_compra: aptitudEnum
});

export const evaluacionClienteSchema = evaluacionClienteFieldsSchema;
export const evaluacionClienteUpdateSchema = evaluacionClienteFieldsSchema.partial();
