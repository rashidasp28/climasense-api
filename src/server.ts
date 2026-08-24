import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import './mqtt';
import { prisma } from './db';
import { fetchGMetObservations, gmetSource } from './gmet';

dotenv.config();

const app = Fastify({ logger: true });

const start = async () => {
  try {
    await app.register(cors, {
      origin: true,
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

    app.get('/api/readings', async () => {
      const readings = await prisma.climateReading.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      return readings;
    });

    app.get('/api/official-observations', async (_request, reply) => {
      try {
        const observations = await fetchGMetObservations();

        return {
          source: gmetSource,
          fetchedAt: new Date().toISOString(),
          observations,
          notice:
            'Regional GMet station observations are not measurements from a ClimaSense sensor node. Check freshness before use.',
        };
      } catch (error) {
        app.log.error(error, 'Unable to fetch GMet observations');

        return reply.code(502).send({
          error: 'Official observations are temporarily unavailable',
          source: gmetSource.name,
        });
      }
    });

    await app.listen({
      port: Number(process.env.PORT || 3000),
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
