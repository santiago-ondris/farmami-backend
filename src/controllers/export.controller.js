import prisma from '../lib/prisma.js';
import { generarExcelIngresos, generarExcelEgresos } from '../services/export.service.js';

export const exportIngresos = async (req, res) => {
  try {
    const { filter, search, cadena_frio, fecha_desde, fecha_hasta } = req.query;

    const where = { deleted_at: null };
    
    if (filter === 'current') {
      if (search) {
        where.OR = [
          { lote: { contains: search, mode: 'insensitive' } },
          { proveedor: { contains: search, mode: 'insensitive' } },
          { product: { nombre: { contains: search, mode: 'insensitive' } } }
        ];
      }
      
      if (cadena_frio !== undefined) {
        where.cadena_frio = cadena_frio === 'true';
      }

      if (fecha_desde || fecha_hasta) {
        where.fecha_ingreso = {};
        if (fecha_desde) where.fecha_ingreso.gte = new Date(fecha_desde);
        if (fecha_hasta) where.fecha_ingreso.lte = new Date(fecha_hasta);
      }
    }

    const ingresos = await prisma.ingreso.findMany({
      where,
      include: { product: true },
      orderBy: { fecha_ingreso: 'desc' }
    });

    const buffer = await generarExcelIngresos(ingresos);

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ingresos_${dateStr}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('[exportIngresos]', error);
    res.status(500).json({ error: 'Error exportando excel' });
  }
};

export const exportEgresos = async (req, res) => {
  try {
    const { filter, search, estado_remito } = req.query;

    const where = { deleted_at: null };
    
    if (filter === 'current') {
      if (search) {
        where.OR = [
          { empresa_solicitante: { contains: search, mode: 'insensitive' } },
          { lote: { contains: search, mode: 'insensitive' } },
          { product: { nombre: { contains: search, mode: 'insensitive' } } }
        ];
      }
      
      if (estado_remito) {
        where.estado_remito = estado_remito;
      }
    }

    const egresos = await prisma.egreso.findMany({
      where,
      include: { product: true },
      orderBy: { fecha_entrega: 'desc' }
    });

    const buffer = await generarExcelEgresos(egresos);

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="egresos_${dateStr}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('[exportEgresos]', error);
    res.status(500).json({ error: 'Error exportando excel' });
  }
};
