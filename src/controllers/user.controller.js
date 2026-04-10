import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { createUserSchema } from '../validators/auth.validator.js';

export const createUser = async (req, res) => {
  try {
    const { email, password, role } = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role
      }
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('[createUser]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { deleted_at: null },
      select: { id: true, email: true, role: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
