import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { loginSchema } from '../validators/auth.validator.js';

export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.deleted_at) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshTokenPayload = { id: user.id };
    const refreshToken = signRefreshToken(refreshTokenPayload);

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    console.error('[login]', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Sin token de refresh' });

  try {
    const payload = verifyRefreshToken(refreshToken);

    const dbTokens = await prisma.refreshToken.findMany({
      where: {
        user_id: payload.id,
        revoked_at: null,
        expires_at: { gt: new Date() }
      }
    });

    let matchedToken = null;
    for (const dbToken of dbTokens) {
      const isMatch = await bcrypt.compare(refreshToken, dbToken.token_hash);
      if (isMatch) {
        matchedToken = dbToken;
        break;
      }
    }

    if (!matchedToken) {
      return res.status(401).json({ error: 'Token de refresh invalido o revocado' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.deleted_at) return res.status(401).json({ error: 'Usuario no activo' });

    const newAccessToken = signAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });
    const newTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revoked_at: new Date() }
      }),
      prisma.refreshToken.create({
        data: {
          user_id: user.id,
          token_hash: newTokenHash,
          expires_at: expiresAt
        }
      })
    ]);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('[refresh]', error);
    res.status(401).json({ error: 'Token invalido o expirado' });
  }
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(200).json({ message: 'Logged out' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const dbTokens = await prisma.refreshToken.findMany({
      where: { user_id: payload.id, revoked_at: null }
    });

    for (const dbToken of dbTokens) {
      const isMatch = await bcrypt.compare(refreshToken, dbToken.token_hash);
      if (isMatch) {
        await prisma.refreshToken.update({
          where: { id: dbToken.id },
          data: { revoked_at: new Date() }
        });
        break;
      }
    }
  } catch (error) {
    console.error('[logout] Error al revocar refresh token:', error);
  }

  res.json({ message: 'Logged out ok' });
};
