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
