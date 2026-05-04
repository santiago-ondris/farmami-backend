import prisma from '../../lib/prisma.js';
import { logAction } from '../../services/auditLog.service.js';
import { ordenCompraSchema, ordenCompraUpdateSchema } from '../../validators/ordenes-compra/ordenes-compra.validator.js';
import { findActiveProveedorById } from '../proveedores/proveedores.controller.js';
import { buildOrdenCompraHtml } from '../../templates/orden-compra.template.js';

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

function extractOrdenCompraSequence(numero) {
  const match = /^OC-(\d+)$/.exec(numero || '');
  return match ? Number(match[1]) : 0;
}

async function generateNextOrdenCompraNumber(tx) {
  const lastOrdenCompra = await tx.ordenCompra.findFirst({
    orderBy: { created_at: 'desc' },
    select: { numero: true }
  });

  const nextSequence = extractOrdenCompraSequence(lastOrdenCompra?.numero) + 1;
  return `OC-${String(nextSequence).padStart(5, '0')}`;
}

function buildItemsData(items) {
  return items.map((item, index) => {
    const cantidadPedida = Number(item.cantidad_pedida);
    const precioUnitario = Number(item.precio_unitario);
    const importe = Number((cantidadPedida * precioUnitario).toFixed(2));

    return {
      numero_item: index + 1,
      producto: item.producto.trim(),
      cantidad_pedida: cantidadPedida,
      precio_unitario: precioUnitario,
      importe
    };
  });
}

function calculateImporteTotal(items) {
  return Number(items.reduce((total, item) => total + item.importe, 0).toFixed(2));
}

function normalizeOrdenCompra(ordenCompra) {
  if (!ordenCompra) return ordenCompra;

  return {
    ...ordenCompra,
    items_count: ordenCompra.items?.length ?? 0
  };
}

async function fetchOrdenCompraOrNull(id) {
  const ordenCompra = await prisma.ordenCompra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      items: {
        orderBy: { numero_item: 'asc' }
      }
    }
  });

  if (!ordenCompra || ordenCompra.deleted_at) {
    return null;
  }

  return ordenCompra;
}

export const getOrdenesCompra = async (req, res) => {
  try {
    const { search, proveedor_id, page = 1, limit = 50 } = req.query;
    const where = { deleted_at: null };

    if (proveedor_id) {
      where.proveedor_id = proveedor_id;
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { condicion_pago: { contains: search, mode: 'insensitive' } },
        { proveedor: { nombre: { contains: search, mode: 'insensitive' } } },
        { proveedor: { numero: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [ordenesCompra, total] = await Promise.all([
      prisma.ordenCompra.findMany({
        where,
        include: {
          proveedor: true,
          items: {
            orderBy: { numero_item: 'asc' }
          }
        },
        orderBy: [
          { fecha: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take
      }),
      prisma.ordenCompra.count({ where })
    ]);

    res.json({
      data: ordenesCompra.map(normalizeOrdenCompra),
      total,
      page: Number(page),
      limit: take
    });
  } catch (error) {
    console.error('[getOrdenesCompra]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createOrdenCompra = async (req, res) => {
  try {
    const data = ordenCompraSchema.parse(req.body);

    const proveedor = await findActiveProveedorById(data.proveedor_id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const items = buildItemsData(data.items);
    const importeTotal = calculateImporteTotal(items);

    const ordenCompra = await prisma.$transaction(async (tx) => {
      const numero = await generateNextOrdenCompraNumber(tx);

      const createdOrdenCompra = await tx.ordenCompra.create({
        data: {
          numero,
          fecha: data.fecha,
          proveedor_id: data.proveedor_id,
          condicion_pago: data.condicion_pago.trim(),
          fecha_entrega: data.fecha_entrega ?? null,
          importe_total: importeTotal,
          created_by: req.user.id,
          items: {
            create: items
          }
        },
        include: {
          proveedor: true,
          items: {
            orderBy: { numero_item: 'asc' }
          }
        }
      });

      await logAction({
        userId: req.user.id,
        tabla: 'ordenes_compra',
        registroId: createdOrdenCompra.id,
        accion: 'CREATE',
        payloadAntes: null,
        payloadDespues: createdOrdenCompra,
        ip: req.ip
      });

      return createdOrdenCompra;
    }, { isolationLevel: 'Serializable' });

    res.status(201).json(normalizeOrdenCompra(ordenCompra));
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }

    console.error('[createOrdenCompra]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getOrdenCompraById = async (req, res) => {
  try {
    const ordenCompra = await fetchOrdenCompraOrNull(req.params.id);
    if (!ordenCompra) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    res.json(normalizeOrdenCompra(ordenCompra));
  } catch (error) {
    console.error('[getOrdenCompraById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateOrdenCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const data = ordenCompraUpdateSchema.parse(req.body);

    const ordenCompraAntes = await fetchOrdenCompraOrNull(id);
    if (!ordenCompraAntes) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    const proveedor = await findActiveProveedorById(data.proveedor_id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const items = buildItemsData(data.items);
    const importeTotal = calculateImporteTotal(items);

    const ordenCompraDespues = await prisma.$transaction(async (tx) => {
      await tx.ordenCompraItem.deleteMany({
        where: { orden_compra_id: id }
      });

      const updatedOrdenCompra = await tx.ordenCompra.update({
        where: { id },
        data: {
          fecha: data.fecha,
          proveedor_id: data.proveedor_id,
          condicion_pago: data.condicion_pago.trim(),
          fecha_entrega: data.fecha_entrega ?? null,
          importe_total: importeTotal,
          items: {
            create: items
          }
        },
        include: {
          proveedor: true,
          items: {
            orderBy: { numero_item: 'asc' }
          }
        }
      });

      return updatedOrdenCompra;
    });

    await logAction({
      userId: req.user.id,
      tabla: 'ordenes_compra',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: ordenCompraAntes,
      payloadDespues: ordenCompraDespues,
      ip: req.ip
    });

    res.json(normalizeOrdenCompra(ordenCompraDespues));
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: normalizeZodError(error) });
    }

    console.error('[updateOrdenCompra]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteOrdenCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const ordenCompraAntes = await fetchOrdenCompraOrNull(id);

    if (!ordenCompraAntes) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    const ordenCompraDespues = await prisma.ordenCompra.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'ordenes_compra',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: ordenCompraAntes,
      payloadDespues: ordenCompraDespues,
      ip: req.ip
    });

    res.json({ message: 'Orden de compra eliminada correctamente' });
  } catch (error) {
    console.error('[deleteOrdenCompra]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getOrdenCompraPdf = async (req, res) => {
  try {
    const ordenCompra = await fetchOrdenCompraOrNull(req.params.id);
    if (!ordenCompra) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    const htmlTemplate = buildOrdenCompraHtml(ordenCompra);
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
      res.setHeader('Content-Disposition', `inline; filename="orden-compra-${ordenCompra.numero}.pdf"`);
      res.send(pdf);
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('[getOrdenCompraPdf]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
