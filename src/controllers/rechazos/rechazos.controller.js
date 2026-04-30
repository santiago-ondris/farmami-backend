import prisma from '../../lib/prisma.js';
import { logAction } from '../../services/auditLog.service.js';
import { rechazoSchema, rechazoUpdateSchema } from '../../validators/rechazos/rechazos.validator.js';
import { getDateRangeEnd, getDateRangeStart } from '../../utils/dateOnly.js';

function normalizeZodError(error) {
  return error?.issues || error?.errors || [{ message: 'Payload invalido' }];
}

async function validateRechazoRelations({ productId, proveedorId }) {
  const [product, proveedor] = await Promise.all([
    productId ? prisma.product.findUnique({ where: { id: productId } }) : Promise.resolve(null),
    proveedorId ? prisma.proveedor.findUnique({ where: { id: proveedorId } }) : Promise.resolve(null)
  ]);

  if (productId && (!product || product.deleted_at)) {
    return { error: { status: 404, message: 'Producto no encontrado' } };
  }

  if (proveedorId && (!proveedor || proveedor.deleted_at)) {
    return { error: { status: 404, message: 'Proveedor no encontrado' } };
  }

  return { product, proveedor };
}

export const getRechazos = async (req, res) => {
  try {
    const { search, fecha_desde, fecha_hasta, product_id, proveedor_id, page = 1, limit = 50 } = req.query;

    const where = { deleted_at: null };

    if (search) {
      where.OR = [
        { lote: { contains: search, mode: 'insensitive' } },
        { motivo_rechazo: { contains: search, mode: 'insensitive' } },
        { product: { nombre: { contains: search, mode: 'insensitive' } } },
        { proveedor: { nombre: { contains: search, mode: 'insensitive' } } },
        { proveedor: { numero: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (product_id) {
      where.product_id = product_id;
    }

    if (proveedor_id) {
      where.proveedor_id = proveedor_id;
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha.gte = getDateRangeStart(fecha_desde);
      if (fecha_hasta) where.fecha.lte = getDateRangeEnd(fecha_hasta);
    }

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [rechazos, total] = await Promise.all([
      prisma.rechazo.findMany({
        where,
        include: {
          product: true,
          proveedor: true
        },
        orderBy: { fecha: 'desc' },
        skip,
        take
      }),
      prisma.rechazo.count({ where })
    ]);

    res.json({ data: rechazos, total, page: Number(page), limit: take });
  } catch (error) {
    console.error('[getRechazos]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createRechazo = async (req, res) => {
  try {
    const data = rechazoSchema.parse(req.body);
    const validation = await validateRechazoRelations({
      productId: data.product_id,
      proveedorId: data.proveedor_id
    });

    if (validation.error) {
      return res.status(validation.error.status).json({ error: validation.error.message });
    }

    const rechazo = await prisma.rechazo.create({
      data: {
        ...data,
        created_by: req.user.id
      },
      include: {
        product: true,
        proveedor: true
      }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'rechazos',
      registroId: rechazo.id,
      accion: 'CREATE',
      payloadAntes: null,
      payloadDespues: rechazo,
      ip: req.ip
    });

    res.status(201).json(rechazo);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }
    console.error('[createRechazo]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getRechazoById = async (req, res) => {
  try {
    const rechazo = await prisma.rechazo.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        proveedor: true
      }
    });

    if (!rechazo || rechazo.deleted_at) {
      return res.status(404).json({ error: 'Rechazo no encontrado' });
    }

    res.json(rechazo);
  } catch (error) {
    console.error('[getRechazoById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateRechazo = async (req, res) => {
  try {
    const data = rechazoUpdateSchema.parse(req.body);
    const { id } = req.params;

    const rechazoAntes = await prisma.rechazo.findUnique({ where: { id } });
    if (!rechazoAntes || rechazoAntes.deleted_at) {
      return res.status(404).json({ error: 'Rechazo no encontrado' });
    }

    const validation = await validateRechazoRelations({
      productId: data.product_id,
      proveedorId: data.proveedor_id
    });

    if (validation.error) {
      return res.status(validation.error.status).json({ error: validation.error.message });
    }

    const rechazoDespues = await prisma.rechazo.update({
      where: { id },
      data,
      include: {
        product: true,
        proveedor: true
      }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'rechazos',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: rechazoAntes,
      payloadDespues: rechazoDespues,
      ip: req.ip
    });

    res.json(rechazoDespues);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }
    console.error('[updateRechazo]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteRechazo = async (req, res) => {
  try {
    const { id } = req.params;
    const rechazoAntes = await prisma.rechazo.findUnique({ where: { id } });

    if (!rechazoAntes || rechazoAntes.deleted_at) {
      return res.status(404).json({ error: 'Rechazo no encontrado' });
    }

    const rechazoDespues = await prisma.rechazo.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'rechazos',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: rechazoAntes,
      payloadDespues: rechazoDespues,
      ip: req.ip
    });

    res.json({ message: 'Rechazo eliminado correctamente' });
  } catch (error) {
    console.error('[deleteRechazo]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
