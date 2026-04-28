import prisma from '../lib/prisma.js';
import { logAction } from '../services/auditLog.service.js';
import { clienteSchema, clienteUpdateSchema } from '../validators/clientes.validator.js';

function normalizeZodError(error) {
  return error?.issues || error?.errors || [{ message: 'Payload invalido' }];
}

export const getClientes = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    const where = { deleted_at: null };
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { establecimiento: { contains: search, mode: 'insensitive' } }
      ];
    }

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: [
          { nombre: 'asc' },
          { establecimiento: 'asc' }
        ],
        skip,
        take
      }),
      prisma.cliente.count({ where })
    ]);

    res.json({
      data: clientes,
      total,
      page: Number(page),
      limit: take
    });
  } catch (error) {
    console.error('[getClientes]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createCliente = async (req, res) => {
  try {
    const data = clienteSchema.parse(req.body);

    const cliente = await prisma.cliente.create({
      data: {
        ...data,
        created_by: req.user.id
      }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'clientes',
      registroId: cliente.id,
      accion: 'CREATE',
      payloadAntes: null,
      payloadDespues: cliente,
      ip: req.ip
    });

    res.status(201).json(cliente);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }

    console.error('[createCliente]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        evaluaciones: {
          where: { deleted_at: null },
          orderBy: { fecha: 'desc' }
        }
      }
    });

    if (!cliente || cliente.deleted_at) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('[getClienteById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const data = clienteUpdateSchema.parse(req.body);

    const clienteAntes = await prisma.cliente.findUnique({
      where: { id }
    });

    if (!clienteAntes || clienteAntes.deleted_at) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const clienteDespues = await prisma.cliente.update({
      where: { id },
      data
    });

    await logAction({
      userId: req.user.id,
      tabla: 'clientes',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: clienteAntes,
      payloadDespues: clienteDespues,
      ip: req.ip
    });

    res.json(clienteDespues);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }

    console.error('[updateCliente]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const clienteAntes = await prisma.cliente.findUnique({
      where: { id }
    });

    if (!clienteAntes || clienteAntes.deleted_at) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const clienteDespues = await prisma.cliente.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'clientes',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: clienteAntes,
      payloadDespues: clienteDespues,
      ip: req.ip
    });

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('[deleteCliente]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
