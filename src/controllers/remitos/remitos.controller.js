import prisma from '../../lib/prisma.js';
import { logAction } from '../../services/auditLog.service.js';
import { calcularStockMasivo } from '../../services/stock.service.js';
import { remitoSchema, remitoUpdateSchema } from '../../validators/remitos/remitos.validator.js';
import { buildRemitoHtml } from '../../templates/remito.template.js';
import { getDateRangeEnd, getDateRangeStart } from '../../utils/dateOnly.js';

let puppeteerModulePromise = null;

function normalizeZodError(error) {
  return error?.issues || error?.errors || [{ message: 'Payload invalido' }];
}

async function getPuppeteer() {
  if (!puppeteerModulePromise) {
    puppeteerModulePromise = import('puppeteer');
  }

  const module = await puppeteerModulePromise;
  return module.default || module;
}

function extractRemitoSequence(numero) {
  const match = /^(\d{4})-(\d{8})\/(\d{2})$/.exec(numero || '');
  return match ? Number(match[2]) : 0;
}

async function generateNextRemitoNumber(tx) {
  const lastRemito = await tx.remito.findFirst({
    where: {
      numero: { startsWith: '0001-' }
    },
    orderBy: { created_at: 'desc' },
    select: { numero: true }
  });

  const nextSequence = extractRemitoSequence(lastRemito?.numero) + 1;
  return `0001-${String(nextSequence).padStart(8, '0')}/01`;
}

async function getActiveCliente(clienteId) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId }
  });

  if (!cliente || cliente.deleted_at) {
    return null;
  }

  return cliente;
}

async function validateRemitoItems(items) {
  const productIds = [...new Set(items.map((item) => item.product_id))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      deleted_at: null
    },
    select: { id: true, nombre: true, laboratorio: true }
  });

  if (products.length !== productIds.length) {
    return { error: { status: 404, message: 'Uno o más productos no existen o están eliminados' } };
  }

  return {
    productMap: new Map(products.map((product) => [product.id, product]))
  };
}

async function buildStockWarnings(items) {
  const requestedByProduct = new Map();
  for (const item of items) {
    requestedByProduct.set(
      item.product_id,
      (requestedByProduct.get(item.product_id) || 0) + item.cantidad
    );
  }

  const stockMap = await calcularStockMasivo([...requestedByProduct.keys()]);
  const products = await prisma.product.findMany({
    where: { id: { in: [...requestedByProduct.keys()] } },
    select: { id: true, nombre: true, laboratorio: true }
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  const warnings = [];

  for (const [productId, requestedQuantity] of requestedByProduct.entries()) {
    const currentStock = stockMap[productId] || 0;
    const resultingStock = currentStock - requestedQuantity;
    if (resultingStock < 0) {
      const product = productMap.get(productId);
      warnings.push({
        product_id: productId,
        producto: product?.nombre || productId,
        laboratorio: product?.laboratorio || null,
        stock_actual: currentStock,
        cantidad_solicitada: requestedQuantity,
        stock_resultante: resultingStock
      });
    }
  }

  return warnings;
}

async function fetchRemitoOrNull(id) {
  const remito = await prisma.remito.findUnique({
    where: { id },
    include: {
      cliente: true,
      items: {
        include: {
          product: true,
          egresos: {
            where: { deleted_at: null }
          }
        }
      }
    }
  });

  if (!remito || remito.deleted_at) {
    return null;
  }

  return remito;
}

export const getRemitos = async (req, res) => {
  try {
    const { search, estado, cliente_id, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
    const where = { deleted_at: null };

    if (estado) {
      where.estado = estado;
    }

    if (cliente_id) {
      where.cliente_id = cliente_id;
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { establecimiento: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha.gte = getDateRangeStart(fecha_desde);
      if (fecha_hasta) where.fecha.lte = getDateRangeEnd(fecha_hasta);
    }

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [remitos, total] = await Promise.all([
      prisma.remito.findMany({
        where,
        include: {
          cliente: true,
          items: {
            select: {
              id: true,
              egresos: {
                where: { deleted_at: null },
                select: { id: true }
              }
            }
          }
        },
        orderBy: [
          { fecha: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take
      }),
      prisma.remito.count({ where })
    ]);

    const normalized = remitos.map((remito) => ({
      ...remito,
      items_count: remito.items.length,
      egresos_count: remito.items.reduce((count, item) => count + item.egresos.length, 0),
      primary_egreso_id: remito.items.length === 1 && remito.items[0].egresos.length === 1
        ? remito.items[0].egresos[0].id
        : null
    }));

    res.json({ data: normalized, total, page: Number(page), limit: take });
  } catch (error) {
    console.error('[getRemitos]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createRemito = async (req, res) => {
  try {
    const data = remitoSchema.parse(req.body);

    const cliente = await getActiveCliente(data.cliente_id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const itemsValidation = await validateRemitoItems(data.items);
    if (itemsValidation.error) {
      return res.status(itemsValidation.error.status).json({ error: itemsValidation.error.message });
    }

    const stockWarnings = await buildStockWarnings(data.items);
    if (stockWarnings.length > 0 && !data.force) {
      return res.status(400).json({
        warning: 'stock_negativo',
        stock_warnings: stockWarnings,
        message: 'Uno o más items dejarían el stock en negativo.'
      });
    }

    const remito = await prisma.$transaction(async (tx) => {
      const numero = await generateNextRemitoNumber(tx);

      const createdRemito = await tx.remito.create({
        data: {
          numero,
          fecha: data.fecha,
          hora: data.hora,
          cliente_id: data.cliente_id,
          estado: data.estado,
          created_by: req.user.id
        }
      });

      const createdItems = [];
      for (const item of data.items) {
        const remitoItem = await tx.remitoItem.create({
          data: {
            remito_id: createdRemito.id,
            product_id: item.product_id,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            lote: item.lote,
            vencimiento: item.vencimiento
          }
        });

        createdItems.push(remitoItem);

        await tx.egreso.create({
          data: {
            product_id: item.product_id,
            fecha_entrega: data.fecha,
            cantidad: item.cantidad,
            empresa_solicitante: cliente.nombre,
            lote: item.lote,
            vencimiento: item.vencimiento,
            estado_remito: data.estado,
            remito_item_id: remitoItem.id,
            created_by: req.user.id
          }
        });
      }

      const fullRemito = await tx.remito.findUnique({
        where: { id: createdRemito.id },
        include: {
          cliente: true,
          items: {
            include: {
              product: true,
              egresos: true
            }
          }
        }
      });

      await logAction({
        userId: req.user.id,
        tabla: 'remitos',
        registroId: createdRemito.id,
        accion: 'CREATE',
        payloadAntes: null,
        payloadDespues: fullRemito,
        ip: req.ip
      });

      return fullRemito;
    }, { isolationLevel: 'Serializable' });

    res.status(201).json({
      ...remito,
      stock_warnings: stockWarnings
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }
    console.error('[createRemito]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getRemitoById = async (req, res) => {
  try {
    const remito = await fetchRemitoOrNull(req.params.id);
    if (!remito) {
      return res.status(404).json({ error: 'Remito no encontrado' });
    }

    res.json(remito);
  } catch (error) {
    console.error('[getRemitoById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateRemito = async (req, res) => {
  try {
    const { id } = req.params;
    const data = remitoUpdateSchema.parse(req.body);

    const remitoAntes = await fetchRemitoOrNull(id);
    if (!remitoAntes) {
      return res.status(404).json({ error: 'Remito no encontrado' });
    }

    if (data.cliente_id) {
      const cliente = await getActiveCliente(data.cliente_id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
    }

    const remitoDespues = await prisma.$transaction(async (tx) => {
      const updatedRemito = await tx.remito.update({
        where: { id },
        data
      });

      if (data.estado) {
        const relatedItemIds = remitoAntes.items.map((item) => item.id);
        if (relatedItemIds.length > 0) {
          await tx.egreso.updateMany({
            where: {
              remito_item_id: { in: relatedItemIds },
              deleted_at: null
            },
            data: {
              estado_remito: data.estado,
              ...(data.fecha ? { fecha_entrega: data.fecha } : {})
            }
          });
        }
      } else if (data.fecha) {
        const relatedItemIds = remitoAntes.items.map((item) => item.id);
        if (relatedItemIds.length > 0) {
          await tx.egreso.updateMany({
            where: {
              remito_item_id: { in: relatedItemIds },
              deleted_at: null
            },
            data: {
              fecha_entrega: data.fecha
            }
          });
        }
      }

      if (data.cliente_id) {
        const cliente = await tx.cliente.findUnique({ where: { id: data.cliente_id } });
        const relatedItemIds = remitoAntes.items.map((item) => item.id);
        if (relatedItemIds.length > 0) {
          await tx.egreso.updateMany({
            where: {
              remito_item_id: { in: relatedItemIds },
              deleted_at: null
            },
            data: {
              empresa_solicitante: cliente.nombre
            }
          });
        }
      }

      return tx.remito.findUnique({
        where: { id: updatedRemito.id },
        include: {
          cliente: true,
          items: {
            include: {
              product: true,
              egresos: {
                where: { deleted_at: null }
              }
            }
          }
        }
      });
    });

    await logAction({
      userId: req.user.id,
      tabla: 'remitos',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: remitoAntes,
      payloadDespues: remitoDespues,
      ip: req.ip
    });

    res.json(remitoDespues);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }
    console.error('[updateRemito]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteRemito = async (req, res) => {
  try {
    const { id } = req.params;
    const remitoAntes = await fetchRemitoOrNull(id);

    if (!remitoAntes) {
      return res.status(404).json({ error: 'Remito no encontrado' });
    }

    const relatedItemIds = remitoAntes.items.map((item) => item.id);

    const remitoDespues = await prisma.$transaction(async (tx) => {
      const deletedRemito = await tx.remito.update({
        where: { id },
        data: { deleted_at: new Date() }
      });

      const affectedEgresos = relatedItemIds.length > 0
        ? await tx.egreso.findMany({
            where: {
              remito_item_id: { in: relatedItemIds },
              deleted_at: null
            }
          })
        : [];

      if (affectedEgresos.length > 0) {
        await tx.egreso.updateMany({
          where: {
            id: { in: affectedEgresos.map((egreso) => egreso.id) }
          },
          data: {
            deleted_at: new Date()
          }
        });

        for (const egreso of affectedEgresos) {
          await logAction({
            userId: req.user.id,
            tabla: 'egresos',
            registroId: egreso.id,
            accion: 'DELETE',
            payloadAntes: egreso,
            payloadDespues: { ...egreso, deleted_at: new Date() },
            ip: req.ip
          });
        }
      }

      return deletedRemito;
    });

    await logAction({
      userId: req.user.id,
      tabla: 'remitos',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: remitoAntes,
      payloadDespues: remitoDespues,
      ip: req.ip
    });

    res.json({ message: 'Remito eliminado correctamente' });
  } catch (error) {
    console.error('[deleteRemito]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getRemitoPdf = async (req, res) => {
  try {
    const remito = await fetchRemitoOrNull(req.params.id);
    if (!remito) {
      return res.status(404).json({ error: 'Remito no encontrado' });
    }

    const htmlTemplate = buildRemitoHtml(remito);
    const puppeteer = await getPuppeteer();
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="remito-${remito.numero}.pdf"`);
      res.send(pdf);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('[getRemitoPdf]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
