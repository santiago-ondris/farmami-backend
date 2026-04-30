import prisma from '../../lib/prisma.js';
import { logAction } from '../../services/auditLog.service.js';
import { findActiveProveedorById } from './proveedores.controller.js';
import {
  evaluacionProveedorSchema,
  evaluacionProveedorUpdateSchema
} from '../../validators/proveedores/evaluaciones-proveedores.validator.js';

function normalizeZodError(error) {
  return error?.issues || error?.errors || [{ message: 'Payload invalido' }];
}

function extractProveedorEvaluationSequence(numero) {
  const match = /^EP-(\d+)$/.exec(numero || '');
  return match ? Number(match[1]) : 0;
}

async function generateNextProveedorEvaluationNumber() {
  const lastEvaluacion = await prisma.evaluacionProveedor.findFirst({
    where: {
      numero_evaluacion: { startsWith: 'EP-' }
    },
    orderBy: { created_at: 'desc' },
    select: { numero_evaluacion: true }
  });

  const nextSequence = extractProveedorEvaluationSequence(lastEvaluacion?.numero_evaluacion) + 1;
  return `EP-${String(nextSequence).padStart(3, '0')}`;
}

export const getEvaluacionesProveedor = async (req, res) => {
  try {
    const { id: proveedorId } = req.params;

    const proveedor = await findActiveProveedorById(proveedorId);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const evaluaciones = await prisma.evaluacionProveedor.findMany({
      where: {
        proveedor_id: proveedorId,
        deleted_at: null
      },
      orderBy: { fecha: 'desc' }
    });

    res.json(evaluaciones);
  } catch (error) {
    console.error('[getEvaluacionesProveedor]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createEvaluacionProveedor = async (req, res) => {
  try {
    const { id: proveedorId } = req.params;

    const proveedor = await findActiveProveedorById(proveedorId);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const data = evaluacionProveedorSchema.parse(req.body);
    const numeroEvaluacion = await generateNextProveedorEvaluationNumber();

    const evaluacion = await prisma.evaluacionProveedor.create({
      data: {
        ...data,
        numero_evaluacion: numeroEvaluacion,
        proveedor_id: proveedorId,
        created_by: req.user.id
      }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'evaluaciones_proveedores',
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

    console.error('[createEvaluacionProveedor]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEvaluacionProveedorById = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluacion = await prisma.evaluacionProveedor.findUnique({
      where: { id }
    });

    if (!evaluacion || evaluacion.deleted_at) {
      return res.status(404).json({ error: 'Evaluacion de proveedor no encontrada' });
    }

    res.json(evaluacion);
  } catch (error) {
    console.error('[getEvaluacionProveedorById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateEvaluacionProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const data = evaluacionProveedorUpdateSchema.parse(req.body);

    const evaluacionAntes = await prisma.evaluacionProveedor.findUnique({
      where: { id }
    });

    if (!evaluacionAntes || evaluacionAntes.deleted_at) {
      return res.status(404).json({ error: 'Evaluacion de proveedor no encontrada' });
    }

    const evaluacionDespues = await prisma.evaluacionProveedor.update({
      where: { id },
      data
    });

    await logAction({
      userId: req.user.id,
      tabla: 'evaluaciones_proveedores',
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

    console.error('[updateEvaluacionProveedor]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteEvaluacionProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    const evaluacionAntes = await prisma.evaluacionProveedor.findUnique({
      where: { id }
    });

    if (!evaluacionAntes || evaluacionAntes.deleted_at) {
      return res.status(404).json({ error: 'Evaluacion de proveedor no encontrada' });
    }

    const evaluacionDespues = await prisma.evaluacionProveedor.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'evaluaciones_proveedores',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: evaluacionAntes,
      payloadDespues: evaluacionDespues,
      ip: req.ip
    });

    res.json({ message: 'Evaluacion de proveedor eliminada correctamente' });
  } catch (error) {
    console.error('[deleteEvaluacionProveedor]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
