import pino from 'pino';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';


if (isProduction && !fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}
// sProduction ? pino(
//     {
//         level: process.env.LOG_LEVEL || 'info',
//         timestamp: pino.stdTimeFunctions.isoTime,
//     },
//     pino.destination('./logs/app.log')
// ) :
export const logger =  pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
        },
    },
    level: process.env.LOG_LEVEL || 'info',
})