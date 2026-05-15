import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import './mqtt';
import { prisma } from './db';

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
