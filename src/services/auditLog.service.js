import prisma from '../lib/prisma.js';

/**
 * Registra una acción en el Audit Log para trazabilidad.
 */
export const logAction = async ({ userId, tabla, registroId, accion, payloadAntes, payloadDespues, ip }) => {
  return await prisma.auditLog.create({
    data: {
      user_id: userId,
      tabla,
      registro_id: registroId,
      accion,
      payload_antes: payloadAntes || null,
      payload_despues: payloadDespues || null,
      ip: ip || null
    }
  });
};
