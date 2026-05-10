import prisma from '../lib/prisma.js';

export const calcularStockMasivo = async (productIds = null) => {
  const whereIncomes = { deleted_at: null };
  const whereOutcomes = { deleted_at: null, estado_remito: { not: 'Cancelado' } };
  
  if (productIds) {
    whereIncomes.product_id = { in: productIds };
    whereOutcomes.product_id = { in: productIds };
  }

  const ingresos = await prisma.ingreso.groupBy({
    by: ['product_id'],
    _sum: { cantidad: true },
    where: whereIncomes
  });

  const egresos = await prisma.egreso.groupBy({
    by: ['product_id'],
    _sum: { cantidad: true },
    where: whereOutcomes
  });

  const stockMap = {};
  
  ingresos.forEach(i => {
    stockMap[i.product_id] = i._sum.cantidad || 0;
  });
  
  egresos.forEach(e => {
    stockMap[e.product_id] = (stockMap[e.product_id] || 0) - (e._sum.cantidad || 0);
  });

  return stockMap;
};

export const calcularStock = async (productId) => {
  const map = await calcularStockMasivo([productId]);
  return map[productId] || 0;
};

export const calcularStockPorLote = async (productId) => {
  const [ingresos, egresos] = await Promise.all([
    prisma.ingreso.groupBy({
      by: ['lote'],
      _sum: { cantidad: true },
      where: {
        product_id: productId,
        deleted_at: null
      }
    }),
    prisma.egreso.groupBy({
      by: ['lote'],
      _sum: { cantidad: true },
      where: {
        product_id: productId,
        deleted_at: null,
        estado_remito: { not: 'Cancelado' }
      }
    })
  ]);

  const stockMap = {};

  ingresos.forEach((ingreso) => {
    stockMap[ingreso.lote] = ingreso._sum.cantidad || 0;
  });

  egresos.forEach((egreso) => {
    stockMap[egreso.lote] = (stockMap[egreso.lote] || 0) - (egreso._sum.cantidad || 0);
  });

  const lotesMeta = await prisma.ingreso.findMany({
    where: {
      product_id: productId,
      deleted_at: null,
      lote: { in: Object.keys(stockMap) }
    },
    select: {
      lote: true,
      vencimiento: true,
      fecha_ingreso: true,
      created_at: true
    },
    orderBy: [
      { lote: 'asc' },
      { fecha_ingreso: 'desc' },
      { created_at: 'desc' }
    ]
  });

  const metaMap = {};
  for (const item of lotesMeta) {
    if (!metaMap[item.lote]) {
      metaMap[item.lote] = item;
    }
  }

  return Object.entries(stockMap)
    .map(([lote, stock]) => ({
      lote,
      stock,
      vencimiento: metaMap[lote]?.vencimiento || null,
      fecha_ingreso: metaMap[lote]?.fecha_ingreso || null
    }))
    .filter((item) => item.stock > 0)
    .sort((a, b) => {
      if (a.vencimiento && b.vencimiento) {
        return new Date(a.vencimiento) - new Date(b.vencimiento);
      }
      if (a.vencimiento) return -1;
      if (b.vencimiento) return 1;
      return a.lote.localeCompare(b.lote);
    });
};
