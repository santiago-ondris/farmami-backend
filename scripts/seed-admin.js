import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@admin.com';
  const password = process.env.ADMIN_PASSWORD || 'admin12345'; // default solo parqa desarrollo

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Usuario admin ya existe:', email);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      password_hash: hash,
      role: 'admin'
    }
  });

  console.log('Usuario admin creado exitosamente:', email);
  process.exit(0);
}

seedAdmin().catch(e => {
  console.error(e);
  process.exit(1);
});
