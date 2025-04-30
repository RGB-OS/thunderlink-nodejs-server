import { Request, Response, NextFunction } from 'express';
/**
 * Placeholder verification middleware.
 * Always treats the request as verified.
 * Replace this with real signature/JWT/session logic.
 */
export const auth = (req: Request, res: Response, next: NextFunction) => {
    // This will later verify JWT, wallet signature, etc.
    // For now, assume user is verified
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) return res.status(401).json({ error: 'Unauthorized' });

    (req as any).user = { verified: true, userId: 'placeholder-user' }; // fake user info
    next();
  };