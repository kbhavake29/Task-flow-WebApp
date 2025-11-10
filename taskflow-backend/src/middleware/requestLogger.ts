import morgan from 'morgan';
import { logger } from '../utils/logger';

// Custom token for user ID
morgan.token('user-id', (req: any) => req.user?.userId || 'anonymous');

// Custom format
const morganFormat =
  ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

/**
 * Request logger middleware using Morgan
 */
export const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
  skip: (req: any) => {
    // Skip health checks
    return req.url === '/health';
  },
});
