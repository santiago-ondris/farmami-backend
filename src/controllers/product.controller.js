import prisma from '../lib/prisma.js';
import { productSchema, productUpdateSchema } from '../validators/product.validator.js';
import { logAction } from '../services/auditLog.service.js';
import { calcularStockMasivo, calcularStock } from '../services/stock.service.js';

export const getProducts = async (req, res) => {
  try {
    const { search } = req.query;
    
    const where = { deleted_at: null };
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { laboratorio: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({ where, orderBy: { nombre: 'asc' } });
    
    const productIds = products.map(p => p.id);
    const stockMap = await calcularStockMasivo(productIds);

    const productsWithStock = products.map(p => ({
      ...p,
      stock: stockMap[p.id] || 0
    }));

    res.json(productsWithStock);
  } catch (error) {
    console.error('[getProducts]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { nombre, laboratorio } = productSchema.parse(req.body);

    const existingProduct = await prisma.product.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        laboratorio: { equals: laboratorio, mode: 'insensitive' },
        deleted_at: null
      }
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'El producto ya existe en este laboratorio' });
    }

    const product = await prisma.product.create({
      data: {
        nombre,
        laboratorio,
        created_by: req.user.id
      }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'products',
      registroId: product.id,
      accion: 'CREATE',
      payloadAntes: null,
      payloadDespues: product,
      ip: req.ip
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('[createProduct]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        ingresos: { where: { deleted_at: null }, orderBy: { fecha_ingreso: 'desc' } },
        egresos: { where: { deleted_at: null }, orderBy: { fecha_entrega: 'desc' } }
      }
    });

    if (!product || product.deleted_at) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const history = [];
    product.ingresos.forEach(i => history.push({
      id: i.id,
      tipo: 'INGRESO',
      fecha: i.fecha_ingreso,
      cantidad: i.cantidad,
      created_by: i.created_by
    }));
    
    product.egresos.forEach(e => history.push({
      id: e.id,
      tipo: 'EGRESO',
      fecha: e.fecha_entrega,
      cantidad: e.cantidad,
      estado_remito: e.estado_remito,
      created_by: e.created_by
    }));

    history.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const stock = await calcularStock(id);

    res.json({
      ...product,
      stock,
      history
    });
  } catch (error) {
    console.error('[getProductById]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = productUpdateSchema.parse(req.body);

    const productAntes = await prisma.product.findUnique({ where: { id } });
    if (!productAntes || productAntes.deleted_at) return res.status(404).json({ error: 'Producto no encontrado' });

    const productDespues = await prisma.product.update({
      where: { id },
      data: validatedData
    });

    await logAction({
      userId: req.user.id,
      tabla: 'products',
      registroId: id,
      accion: 'UPDATE',
      payloadAntes: productAntes,
      payloadDespues: productDespues,
      ip: req.ip
    });

    res.json(productDespues);
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors });
    console.error('[updateProduct]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const productAntes = await prisma.product.findUnique({ where: { id } });
    if (!productAntes || productAntes.deleted_at) return res.status(404).json({ error: 'Producto no encontrado' });

    const productDespues = await prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() }
    });

    await logAction({
      userId: req.user.id,
      tabla: 'products',
      registroId: id,
      accion: 'DELETE',
      payloadAntes: productAntes,
      payloadDespues: productDespues,
      ip: req.ip
    });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('[deleteProduct]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
