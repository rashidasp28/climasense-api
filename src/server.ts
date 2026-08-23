import { timingSafeEqual } from 'node:crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, validateProductionConfig } from './config';
import './mqtt';
import { prisma } from './db';

const app = Fastify({ logger: true });

const keysMatch = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

const start = async () => {
  try {
    validateProductionConfig();

    await app.register(cors, {
      origin: (origin, callback) => {
        if (!origin || (!config.isProduction && config.corsOrigins.length === 0)) {
          callback(null, true);
          return;
        }

        callback(null, config.corsOrigins.includes(origin));
      },
    });

    app.get('/health', async () => {
      return {
        status: 'ok',
        service: 'climasense-api',
        timestamp: new Date().toISOString(),
      };
    });

    app.get('/', async () => {
      return {
        name: 'ClimaSense API',
        version: '0.1.0',
        description: 'Climate-health telemetry backend for ISIR Ghana',
      };
    });

    app.get('/api/readings', {
      preHandler: async (request, reply) => {
        if (!config.apiKey && !config.isProduction) {
          return;
        }

        const authorization = request.headers.authorization;
        const providedKey = authorization?.startsWith('Bearer ')
          ? authorization.slice('Bearer '.length)
          : '';

        if (!config.apiKey || !providedKey || !keysMatch(providedKey, config.apiKey)) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }
      },
    }, async () => {
      const readings = await prisma.climateReading.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      return readings;
    });

    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
