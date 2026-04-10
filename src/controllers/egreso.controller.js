import prisma from '../lib/prisma.js';
import { egresoSchema, egresoUpdateSchema } from '../validators/egreso.validator.js';
import { logAction } from '../services/auditLog.service.js';
import { calcularStock } from '../services/stock.service.js';

export const getEgresos = async (req, res) => {
  try {
    const { search, estado_remito, page = 1, limit = 50 } = req.query;

    const where = { deleted_at: null };
    
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

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [egresos, total] = await Promise.all([
      prisma.egreso.findMany({
        where,
        include: { product: true },
        orderBy: { fecha_entrega: 'desc' },
        skip,
        take
      }),
      prisma.egreso.count({ where })
    ]);

    res.json({ data: egresos, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('[getEgresos]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createEgreso = async (req, res) => {
  try {
    const data = egresoSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: data.product_id }
    });

    if (!product || product.deleted_at) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    let egreso;
    let resultingStock;

    try {
      egreso = await prisma.$transaction(async (tx) => {
        const [ingresoSum, egresoSum] = await Promise.all([
          tx.ingreso.aggregate({
            where: { product_id: data.product_id, deleted_at: null },
            _sum: { cantidad: true }
          }),
          tx.egreso.aggregate({
            where: { product_id: data.product_id, deleted_at: null, estado_remito: { not: 'Cancelado' } },
            _sum: { cantidad: true }
          })
        ]);

        const currentStock = (ingresoSum._sum.cantidad || 0) - (egresoSum._sum.cantidad || 0);
        resultingStock = currentStock - data.cantidad;

        if (resultingStock < 0 && !data.confirm_negative) {
          const err = new Error('stock_negativo');
          err.isStockWarning = true;
          err.stockResultante = resultingStock;
          throw err;
        }

        return tx.egreso.create({
          data: {
            product_id: data.product_id,
            fecha_entrega: new Date(data.fecha_entrega),
            cantidad: data.cantidad,
            empresa_solicitante: data.empresa_solicitante,
            lote: data.lote,
            vencimiento: new Date(data.vencimiento),
            serial: data.serial,
            orden_compra: data.orden_compra,
            estado_remito: data.estado_remito,
            created_by: req.user.id
          }
        });
      }, { isolationLevel: 'Serializable' });
    } catch (txError) {
      if (txError.isStockWarning) {
        return res.status(400).json({
          warning: 'stock_negativo',
          stock_resultante: txError.stockResultante,
          message: 'Este egreso dejará el stock en negativo.'
        });
      }
      throw txError;
    }

    const loteExists = await prisma.ingreso.findFirst({
      where: { product_id: data.product_id, lote: data.lote, deleted_at: null }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'egresos',
      registroId: egreso.id,
      accion: 'CREATE',
      payloadAntes: null,
      payloadDespues: egreso,
      ip: req.ip
    });

    res.status(201).json({
      ...egreso,
      stockActual: resultingStock,
      warning: !loteExists ? 'lote_no_encontrado' : null
    });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('[createEgreso]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEgresoById = async (req, res) => {
  try {
    const { id } = req.params;
    const egreso = await prisma.egreso.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!egreso || egreso.deleted_at) return res.status(404).json({ error: 'Egreso no encontrado' });

    res.json(egreso);
  } catch (error) {
    console.error('[getEgresoById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateEgreso = async (req, res) => {
  try {
    const { id } = req.params;
    const data = egresoUpdateSchema.parse(req.body);

    const egresoAntes = await prisma.egreso.findUnique({ where: { id } });
    if (!egresoAntes || egresoAntes.deleted_at) return res.status(404).json({ error: 'Egreso no encontrado' });

    const updateData = { ...data };
    if (data.fecha_entrega) updateData.fecha_entrega = new Date(data.fecha_entrega);
    if (data.vencimiento) updateData.vencimiento = new Date(data.vencimiento);

    const egresoDespues = await prisma.egreso.update({
      where: { id },
      data: updateData
    });

    await logAction({
      userId: req.user.id,
      tabla: 'egresos',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: egresoAntes,
      payloadDespues: egresoDespues,
      ip: req.ip
    });

    res.json(egresoDespues);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('[updateEgreso]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteEgreso = async (req, res) => {
  try {
    const { id } = req.params;

    const egresoAntes = await prisma.egreso.findUnique({ where: { id } });
    if (!egresoAntes || egresoAntes.deleted_at) return res.status(404).json({ error: 'Egreso no encontrado' });

    const egresoDespues = await prisma.egreso.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'egresos',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: egresoAntes,
      payloadDespues: egresoDespues,
      ip: req.ip
    });

    res.json({ message: 'Egreso eliminado correctamente' });
  } catch (error) {
    console.error('[deleteEgreso]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
