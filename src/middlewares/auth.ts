import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const ENABLE_JWT_AUTH = process.env.ENABLE_JWT_AUTH
const AUTH_VERIFY_URL = process.env.AUTH_VERIFY_URL!
/**
 * Placeholder verification middleware.
 * Always treats the request as verified.
 * Replace this with real signature/JWT/session logic.
 */

export const auth = (req: Request, res: Response, next: NextFunction): void => {

  if (!ENABLE_JWT_AUTH) {
    (req as any).user = { verified: true, userId: 'dev-user' };
    return next();
  }

  const tokenHeader = req.headers.authorization || req.headers.Authorization;

  if (!tokenHeader || typeof tokenHeader !== 'string' || !tokenHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed' });
    return;
  }

  const token = tokenHeader.replace(/^Bearer\s/, '');

  axios
    .get(AUTH_VERIFY_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => {
      (req as any).user = response.data;
      next();
    })
    .catch((err) => {
      console.error('Auth middleware error:', err?.response?.data || err.message);
      res.status(403).json({ error: 'Invalid or expired token' });
    });
};