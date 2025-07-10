import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../lib/logger';
type AsyncHandler = (req: Request, res: Response, next?: NextFunction) => Promise<any> | any;

export const apiErrorHandler = (handler: AsyncHandler): AsyncHandler => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (err: any) {
            const isAxios = axios.isAxiosError(err) && err.response;

            const logContext = {
                path: req.path,
                method: req.method,
                query: req.query,
                body: req.body,
                err: isAxios ? err.response?.data : err,
            };

            if (isAxios) {
                logger.warn(logContext, '[Proxy Error] Forwarded from Manager');
                return res.status(err.response!.status).json(err.response!.data);
            }

            logger.error(logContext, '[Unhandled Error]');
            res.status(500).json({ error: err?.message ?? '[PROXY] Internal Server Error' });
        }
    };
}