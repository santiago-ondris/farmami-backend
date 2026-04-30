import prisma from '../../lib/prisma.js';
import { logAction } from '../../services/auditLog.service.js';
import { proveedorSchema, proveedorUpdateSchema, proveedorTipoEnum } from '../../validators/proveedores/proveedores.validator.js';

function normalizeZodError(error) {
  return error?.issues || error?.errors || [{ message: 'Payload invalido' }];
}

async function findActiveProveedorById(id) {
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      evaluaciones: {
        where: { deleted_at: null },
        orderBy: { fecha: 'desc' }
      }
    }
  });

  if (!proveedor || proveedor.deleted_at) {
    return null;
  }

  return proveedor;
}

export const getProveedores = async (req, res) => {
  try {
    const { search, tipo, page = 1, limit = 50 } = req.query;

    const where = { deleted_at: null };

    if (tipo) {
      const parsedTipo = proveedorTipoEnum.safeParse(tipo);
      if (!parsedTipo.success) {
        return res.status(400).json({ error: [{ message: 'Tipo de proveedor invalido' }] });
      }
      where.tipo = parsedTipo.data;
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { numero: { contains: search, mode: 'insensitive' } },
        { cuit: { contains: search, mode: 'insensitive' } },
        { gln: { contains: search, mode: 'insensitive' } }
      ];
    }

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        orderBy: [
          { nombre: 'asc' },
          { numero: 'asc' }
        ],
        skip,
        take
      }),
      prisma.proveedor.count({ where })
    ]);

    res.json({
      data: proveedores,
      total,
      page: Number(page),
      limit: take
    });
  } catch (error) {
    console.error('[getProveedores]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createProveedor = async (req, res) => {
  try {
    const data = proveedorSchema.parse(req.body);

    const numeroExistente = await prisma.proveedor.findFirst({
      where: {
        numero: { equals: data.numero, mode: 'insensitive' },
        deleted_at: null
      }
    });

    if (numeroExistente) {
      return res.status(400).json({ error: 'Ya existe un proveedor activo con ese numero' });
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        ...data,
        created_by: req.user.id
      }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'proveedores',
      registroId: proveedor.id,
      accion: 'CREATE',
      payloadAntes: null,
      payloadDespues: proveedor,
      ip: req.ip
    });

    res.status(201).json(proveedor);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }

    console.error('[createProveedor]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProveedorById = async (req, res) => {
  try {
    const proveedor = await findActiveProveedorById(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(proveedor);
  } catch (error) {
    console.error('[getProveedorById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const data = proveedorUpdateSchema.parse(req.body);

    const proveedorAntes = await prisma.proveedor.findUnique({
      where: { id }
    });

    if (!proveedorAntes || proveedorAntes.deleted_at) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    if (data.numero) {
      const numeroExistente = await prisma.proveedor.findFirst({
        where: {
          id: { not: id },
          numero: { equals: data.numero, mode: 'insensitive' },
          deleted_at: null
        }
      });

      if (numeroExistente) {
        return res.status(400).json({ error: 'Ya existe un proveedor activo con ese numero' });
      }
    }

    const proveedorDespues = await prisma.proveedor.update({
      where: { id },
      data
    });

    await logAction({
      userId: req.user.id,
      tabla: 'proveedores',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: proveedorAntes,
      payloadDespues: proveedorDespues,
      ip: req.ip
    });

    res.json(proveedorDespues);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }

    console.error('[updateProveedor]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedorAntes = await prisma.proveedor.findUnique({
      where: { id }
    });

    if (!proveedorAntes || proveedorAntes.deleted_at) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const proveedorDespues = await prisma.proveedor.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'proveedores',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: proveedorAntes,
      payloadDespues: proveedorDespues,
      ip: req.ip
    });

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('[deleteProveedor]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export { findActiveProveedorById };
