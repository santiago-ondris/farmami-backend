import prisma from '../lib/prisma.js';
import { calcularStockMasivo, calcularStock } from '../services/stock.service.js';

export const getGlobalStock = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ where: { deleted_at: null } });
    const productIds = products.map(p => p.id);
    const stockMap = await calcularStockMasivo(productIds);

    const now = new Date();
    const in60days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const ingresosProntoVencer = await prisma.ingreso.findMany({
      where: {
        product_id: { in: productIds },
        deleted_at: null,
        vencimiento: { lte: in60days }
      },
      select: { product_id: true }
    });

    const prontoVencerSet = new Set(ingresosProntoVencer.map(i => i.product_id));

    const result = products.map(p => {
      const stock = stockMap[p.id] || 0;
      return {
        ...p,
        stock,
        stock_negativo: stock < 0,
        vence_pronto: prontoVencerSet.has(p.id)
      };
    });

    res.json(result);
  } catch (error) {
    console.error('[getGlobalStock]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product || product.deleted_at) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const stock = await calcularStock(productId);

    const now = new Date();
    const in60days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const prontoVencer = await prisma.ingreso.findFirst({
      where: {
        product_id: productId,
        deleted_at: null,
        vencimiento: { lte: in60days }
      }
    });

    res.json({
      ...product,
      stock,
      stock_negativo: stock < 0,
      vence_pronto: !!prontoVencer
    });
  } catch (error) {
    console.error('[getProductStock]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
