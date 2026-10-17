import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestId } from './middleware/requestId.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './docs/swagger.js';

export const app = express();

// Trust proxy for Render/Cloudflare (essential for secure cookies over HTTPS)
app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(requestId);
app.use(pinoHttp({ logger, genReqId: (req) => req.requestId }));
app.use(helmet());

// Dynamic CORS allowing Vercel, localhost, and custom client URLs
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin (like server-to-server or mobile apps)
      // and reflect the caller's origin for browser requests (supporting Vercel + localhost)
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token']
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());
app.use(hpp());
app.use(generalLimiter);

// Root & Health check endpoints
app.all('/', (_req, res) =>
  res.json({
    success: true,
    message: '🌾 Kisan Setu Backend API is running successfully!',
    version: '1.0.1',
    environment: env.NODE_ENV,
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      api: '/api/v1'
    }
  })
);

app.get('/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', service: 'kisan-setu-backend' } })
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
