import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function nextMigrationNumber(index) {
  return `MIGRADO-${String(index).padStart(3, '0')}`;
}

async function getMigrationActorId() {
  const admin = await prisma.user.findFirst({
    where: {
      role: 'admin',
      deleted_at: null
    },
    orderBy: { created_at: 'asc' }
  });

  if (!admin) {
    throw new Error('No existe un usuario admin activo para atribuir los proveedores migrados.');
  }

  return admin.id;
}

async function main() {
  const migrationActorId = await getMigrationActorId();

  const legacyIngresos = await prisma.ingreso.findMany({
    where: {
      deleted_at: null,
      proveedor: { not: null },
      proveedor_id: null
    },
    select: {
      id: true,
      proveedor: true
    },
    orderBy: { created_at: 'asc' }
  });

  if (legacyIngresos.length === 0) {
    console.log('No hay ingresos legacy pendientes de migracion.');
    return;
  }

  const uniqueProviderNames = [...new Set(
    legacyIngresos
      .map((ingreso) => ingreso.proveedor?.trim())
      .filter(Boolean)
  )];

  const existingProviders = await prisma.proveedor.findMany({
    where: {
      nombre: {
        in: uniqueProviderNames
      }
    },
    select: {
      id: true,
      nombre: true,
      numero: true
    }
  });

  const providerByName = new Map(
    existingProviders.map((provider) => [provider.nombre.trim().toLowerCase(), provider])
  );

  let createdProviders = 0;

  for (let i = 0; i < uniqueProviderNames.length; i += 1) {
    const providerName = uniqueProviderNames[i];
    const lookupKey = providerName.trim().toLowerCase();

    if (providerByName.has(lookupKey)) {
      continue;
    }

    let numero = nextMigrationNumber(i + 1);
    while (await prisma.proveedor.findUnique({ where: { numero } })) {
      numero = nextMigrationNumber(i + 2 + createdProviders);
    }

    const created = await prisma.proveedor.create({
      data: {
        numero,
        nombre: providerName,
        tipo: 'LABORATORIO',
        created_by: migrationActorId,
        observaciones: 'Proveedor migrado automaticamente desde Ingreso.proveedor'
      }
    });

    providerByName.set(lookupKey, created);
    createdProviders += 1;
  }

  let updatedIngresos = 0;

  for (const ingreso of legacyIngresos) {
    const providerName = ingreso.proveedor?.trim();
    if (!providerName) {
      continue;
    }

    const provider = providerByName.get(providerName.toLowerCase());
    if (!provider) {
      throw new Error(`No se pudo resolver un proveedor migrado para el ingreso ${ingreso.id}.`);
    }

    await prisma.ingreso.update({
      where: { id: ingreso.id },
      data: { proveedor_id: provider.id }
    });

    updatedIngresos += 1;
  }

  const remainingWithoutProviderId = await prisma.ingreso.count({
    where: {
      deleted_at: null,
      proveedor: { not: null },
      proveedor_id: null
    }
  });

  console.log(`Proveedores creados: ${createdProviders}`);
  console.log(`Ingresos actualizados: ${updatedIngresos}`);
  console.log(`Ingresos pendientes sin proveedor_id: ${remainingWithoutProviderId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
