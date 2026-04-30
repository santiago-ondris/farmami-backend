import prisma from '../../lib/prisma.js';
import { logAction } from '../../services/auditLog.service.js';
import {
  evaluacionClienteSchema,
  evaluacionClienteUpdateSchema
} from '../../validators/clientes/evaluaciones-clientes.validator.js';

function normalizeZodError(error) {
  return error?.issues || error?.errors || [{ message: 'Payload invalido' }];
}

function extractClienteEvaluationSequence(numero) {
  const match = /^EC-(\d+)$/.exec(numero || '');
  return match ? Number(match[1]) : 0;
}

async function generateNextClienteEvaluationNumber() {
  const lastEvaluacion = await prisma.evaluacionCliente.findFirst({
    where: {
      numero_evaluacion: { startsWith: 'EC-' }
    },
    orderBy: { created_at: 'desc' },
    select: { numero_evaluacion: true }
  });

  const nextSequence = extractClienteEvaluationSequence(lastEvaluacion?.numero_evaluacion) + 1;
  return `EC-${String(nextSequence).padStart(3, '0')}`;
}

async function getClienteActivo(clienteId) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId }
  });

  if (!cliente || cliente.deleted_at) {
    return null;
  }

  return cliente;
}

export const getEvaluacionesCliente = async (req, res) => {
  try {
    const { id: clienteId } = req.params;

    const cliente = await getClienteActivo(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const evaluaciones = await prisma.evaluacionCliente.findMany({
      where: {
        cliente_id: clienteId,
        deleted_at: null
      },
      orderBy: { fecha: 'desc' }
    });

    res.json(evaluaciones);
  } catch (error) {
    console.error('[getEvaluacionesCliente]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createEvaluacionCliente = async (req, res) => {
  try {
    const { id: clienteId } = req.params;
    const cliente = await getClienteActivo(clienteId);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const data = evaluacionClienteSchema.parse(req.body);
    const numeroEvaluacion = await generateNextClienteEvaluationNumber();

    const evaluacion = await prisma.evaluacionCliente.create({
      data: {
        ...data,
        numero_evaluacion: numeroEvaluacion,
        cliente_id: clienteId,
        created_by: req.user.id
      }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'evaluaciones_clientes',
      registroId: evaluacion.id,
      accion: 'CREATE',
      payloadAntes: null,
      payloadDespues: evaluacion,
      ip: req.ip
    });

    res.status(201).json(evaluacion);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }

    console.error('[createEvaluacionCliente]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEvaluacionClienteById = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluacion = await prisma.evaluacionCliente.findUnique({
      where: { id }
    });

    if (!evaluacion || evaluacion.deleted_at) {
      return res.status(404).json({ error: 'Evaluacion de cliente no encontrada' });
    }

    res.json(evaluacion);
  } catch (error) {
    console.error('[getEvaluacionClienteById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateEvaluacionCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const data = evaluacionClienteUpdateSchema.parse(req.body);

    const evaluacionAntes = await prisma.evaluacionCliente.findUnique({
      where: { id }
    });

    if (!evaluacionAntes || evaluacionAntes.deleted_at) {
      return res.status(404).json({ error: 'Evaluacion de cliente no encontrada' });
    }

    const evaluacionDespues = await prisma.evaluacionCliente.update({
      where: { id },
      data
    });

    await logAction({
      userId: req.user.id,
      tabla: 'evaluaciones_clientes',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: evaluacionAntes,
      payloadDespues: evaluacionDespues,
      ip: req.ip
    });

    res.json(evaluacionDespues);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }

    console.error('[updateEvaluacionCliente]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteEvaluacionCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluacionAntes = await prisma.evaluacionCliente.findUnique({
      where: { id }
    });

    if (!evaluacionAntes || evaluacionAntes.deleted_at) {
      return res.status(404).json({ error: 'Evaluacion de cliente no encontrada' });
    }

    const evaluacionDespues = await prisma.evaluacionCliente.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'evaluaciones_clientes',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: evaluacionAntes,
      payloadDespues: evaluacionDespues,
      ip: req.ip
    });

    res.json({ message: 'Evaluacion de cliente eliminada correctamente' });
  } catch (error) {
    console.error('[deleteEvaluacionCliente]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
