import prisma from '../lib/prisma.js';
import { ingresoSchema, ingresoUpdateSchema } from '../validators/ingreso.validator.js';
import { logAction } from '../services/auditLog.service.js';
import { calcularStock } from '../services/stock.service.js';

export const getIngresos = async (req, res) => {
  try {
    const { search, cadena_frio, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;

    const where = { deleted_at: null };
    
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

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [ingresos, total] = await Promise.all([
      prisma.ingreso.findMany({
        where,
        include: { product: true },
        orderBy: { fecha_ingreso: 'desc' },
        skip,
        take
      }),
      prisma.ingreso.count({ where })
    ]);

    res.json({ data: ingresos, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('[getIngresos]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createIngreso = async (req, res) => {
  try {
    const data = ingresoSchema.parse(req.body);

    const product = await prisma.product.findUnique({
      where: { id: data.product_id }
    });

    if (!product || product.deleted_at) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const ingreso = await prisma.ingreso.create({
      data: {
        ...data,
        fecha_ingreso: new Date(data.fecha_ingreso),
        vencimiento: new Date(data.vencimiento),
        created_by: req.user.id
      }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'ingresos',
      registroId: ingreso.id,
      accion: 'CREATE',
      payloadAntes: null,
      payloadDespues: ingreso,
      ip: req.ip
    });

    const stockActual = await calcularStock(data.product_id);

    res.status(201).json({ ...ingreso, stockActual });
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('[createIngreso]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getIngresoById = async (req, res) => {
  try {
    const { id } = req.params;
    const ingreso = await prisma.ingreso.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!ingreso || ingreso.deleted_at) return res.status(404).json({ error: 'Ingreso no encontrado' });

    res.json(ingreso);
  } catch (error) {
    console.error('[getIngresoById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateIngreso = async (req, res) => {
  try {
    const { id } = req.params;
    const data = ingresoUpdateSchema.parse(req.body);

    const ingresoAntes = await prisma.ingreso.findUnique({ where: { id } });
    if (!ingresoAntes || ingresoAntes.deleted_at) return res.status(404).json({ error: 'Ingreso no encontrado' });

    const updateData = { ...data };
    if (data.fecha_ingreso) updateData.fecha_ingreso = new Date(data.fecha_ingreso);
    if (data.vencimiento) updateData.vencimiento = new Date(data.vencimiento);

    const ingresoDespues = await prisma.ingreso.update({
      where: { id },
      data: updateData
    });

    await logAction({
      userId: req.user.id,
      tabla: 'ingresos',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: ingresoAntes,
      payloadDespues: ingresoDespues,
      ip: req.ip
    });

    res.json(ingresoDespues);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('[updateIngreso]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteIngreso = async (req, res) => {
  try {
    const { id } = req.params;

    const ingresoAntes = await prisma.ingreso.findUnique({ where: { id } });
    if (!ingresoAntes || ingresoAntes.deleted_at) return res.status(404).json({ error: 'Ingreso no encontrado' });

    const ingresoDespues = await prisma.ingreso.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'ingresos',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: ingresoAntes,
      payloadDespues: ingresoDespues,
      ip: req.ip
    });

    res.json({ message: 'Ingreso eliminado correctamente' });
  } catch (error) {
    console.error('[deleteIngreso]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
