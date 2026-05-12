import prisma from '../../lib/prisma.js';
import { logAction } from '../../services/auditLog.service.js';
import { rechazoSchema, rechazoUpdateSchema } from '../../validators/rechazos/rechazos.validator.js';
import { getDateRangeEnd, getDateRangeStart } from '../../utils/dateOnly.js';
import { buildRechazoHtml } from '../../templates/rechazo.template.js';

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

async function fetchRechazoOrNull(id) {
  const rechazo = await prisma.rechazo.findUnique({
    where: { id },
    include: {
      proveedor: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!rechazo || rechazo.deleted_at) {
    return null;
  }

  return rechazo;
}

async function validateRechazoRelations({ items, proveedorId }) {
  const [proveedor] = await Promise.all([
    proveedorId ? prisma.proveedor.findUnique({ where: { id: proveedorId } }) : Promise.resolve(null)
  ]);

  if (proveedorId && (!proveedor || proveedor.deleted_at)) {
    return { error: { status: 404, message: 'Proveedor no encontrado' } };
  }

  if (items && items.length > 0) {
    const productIds = items.map(i => i.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deleted_at: null }
    });
    
    if (products.length !== productIds.length) {
       return { error: { status: 404, message: 'Uno o más productos no fueron encontrados' } };
    }
  }

  return { proveedor };
}

export const getRechazos = async (req, res) => {
  try {
    const { search, fecha_desde, fecha_hasta, product_id, proveedor_id, page = 1, limit = 50 } = req.query;

    const where = { deleted_at: null };

    if (search) {
      where.OR = [
        { proveedor: { nombre: { contains: search, mode: 'insensitive' } } },
        { proveedor: { numero: { contains: search, mode: 'insensitive' } } },
        {
          items: {
            some: {
              OR: [
                { lote: { contains: search, mode: 'insensitive' } },
                { motivo_rechazo: { contains: search, mode: 'insensitive' } },
                { product: { nombre: { contains: search, mode: 'insensitive' } } }
              ]
            }
          }
        }
      ];
    }

    if (product_id) {
      where.items = { some: { product_id } };
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
          proveedor: true,
          items: {
            include: {
              product: true
            }
          }
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
      items: data.items,
      proveedorId: data.proveedor_id
    });

    if (validation.error) {
      return res.status(validation.error.status).json({ error: validation.error.message });
    }

    const rechazo = await prisma.rechazo.create({
      data: {
        fecha: data.fecha,
        remito: data.remito,
        proveedor_id: data.proveedor_id,
        created_by: req.user.id,
        items: {
          create: data.items
        }
      },
      include: {
        proveedor: true,
        items: {
          include: {
            product: true
          }
        }
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
    const rechazo = await fetchRechazoOrNull(req.params.id);
    if (!rechazo) {
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
      items: data.items,
      proveedorId: data.proveedor_id
    });

    if (validation.error) {
      return res.status(validation.error.status).json({ error: validation.error.message });
    }

    const rechazoDespues = await prisma.rechazo.update({
      where: { id },
      data: {
        fecha: data.fecha,
        remito: data.remito,
        proveedor_id: data.proveedor_id,
        items: {
          deleteMany: {},
          create: data.items
        }
      },
      include: {
        proveedor: true,
        items: {
          include: {
            product: true
          }
        }
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

export const getRechazoPdf = async (req, res) => {
  try {
    const rechazo = await fetchRechazoOrNull(req.params.id);
    if (!rechazo) {
      return res.status(404).json({ error: 'Rechazo no encontrado' });
    }

    const htmlTemplate = buildRechazoHtml(rechazo);
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
      res.setHeader('Content-Disposition', `inline; filename="rechazo-${rechazo.id}.pdf"`);
      res.send(pdf);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('[getRechazoPdf]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
