import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@farmami.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';

  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    return user;
  }

  const password_hash = await bcrypt.hash(password, 12);
  user = await prisma.user.create({
    data: { email, password_hash, role: 'admin' }
  });

  console.log(`Admin de desarrollo creado: ${user.email}`);
  return user;
}

async function ensureProduct({ nombre, laboratorio, userId }) {
  const existing = await prisma.product.findFirst({
    where: {
      nombre,
      laboratorio,
      deleted_at: null
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.product.create({
    data: {
      nombre,
      laboratorio,
      created_by: userId
    }
  });
}

async function ensureLegacyIngreso({ productId, userId, fechaIngreso, lote, vencimiento, proveedor, cantidad }) {
  const existing = await prisma.ingreso.findFirst({
    where: {
      product_id: productId,
      lote,
      proveedor,
      deleted_at: null
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.ingreso.create({
    data: {
      product_id: productId,
      fecha_ingreso: fechaIngreso,
      lote,
      vencimiento,
      proveedor,
      cadena_frio: false,
      cantidad,
      observaciones: 'Dato legacy para validar migracion de proveedores',
      created_by: userId
    }
  });
}

async function main() {
  const admin = await ensureAdmin();

  const legacyProducts = await Promise.all([
    ensureProduct({ nombre: 'Paracetamol 500mg', laboratorio: 'Laboratorio Norte', userId: admin.id }),
    ensureProduct({ nombre: 'Ibuprofeno 400mg', laboratorio: 'Farmasur', userId: admin.id }),
    ensureProduct({ nombre: 'Amoxicilina 500mg', laboratorio: 'Delta Pharma', userId: admin.id })
  ]);

  const legacyIngresos = [
    {
      productId: legacyProducts[0].id,
      fechaIngreso: new Date('2026-04-01T09:00:00.000Z'),
      lote: 'PARA-001',
      vencimiento: new Date('2028-04-30T00:00:00.000Z'),
      proveedor: 'Drogueria Central',
      cantidad: 120
    },
    {
      productId: legacyProducts[1].id,
      fechaIngreso: new Date('2026-04-02T09:00:00.000Z'),
      lote: 'IBU-001',
      vencimiento: new Date('2028-05-31T00:00:00.000Z'),
      proveedor: 'Laboratorio Austral',
      cantidad: 75
    },
    {
      productId: legacyProducts[2].id,
      fechaIngreso: new Date('2026-04-03T09:00:00.000Z'),
      lote: 'AMOX-001',
      vencimiento: new Date('2028-06-30T00:00:00.000Z'),
      proveedor: 'Drogueria Central',
      cantidad: 200
    }
  ];

  let createdCount = 0;
  for (const ingreso of legacyIngresos) {
    const existing = await prisma.ingreso.findFirst({
      where: {
        product_id: ingreso.productId,
        lote: ingreso.lote,
        proveedor: ingreso.proveedor,
        deleted_at: null
      }
    });

    if (!existing) {
      await ensureLegacyIngreso({ ...ingreso, userId: admin.id });
      createdCount += 1;
    }
  }

  console.log(`Ingresos legacy sembrados: ${createdCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
