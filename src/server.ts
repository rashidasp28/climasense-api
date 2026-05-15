import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

const app = Fastify({ logger: true });

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

const start = async () => {
  try {
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
