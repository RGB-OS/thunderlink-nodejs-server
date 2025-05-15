import { Request, Response, NextFunction } from 'express';

export const verifyWebhook = (req: Request, res: Response, next: NextFunction) => {
   //  const receivedSecret = req.header('x-webhook-secret');
   //  const expectedSecret = process.env.WEBHOOK_SECRET;
  
   //  if (!expectedSecret) {
   //    console.warn('[Webhook] No WEBHOOK_SECRET set');
   //     res.status(500).json({ error: 'Server misconfigured' });
   //  }
  
   //  if (receivedSecret !== expectedSecret) {
   //     res.status(403).json({ error: 'Forbidden: Invalid webhook secret' });
   //  }
  
    next();
  };