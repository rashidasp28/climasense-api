import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const splitCsv = (value: string | undefined): string[] =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export const config = {
  isProduction,
  port: Number(process.env.PORT || 3000),
  apiKey: process.env.API_KEY,
  corsOrigins: splitCsv(process.env.CORS_ORIGINS),
  mqtt: {
    broker: process.env.MQTT_BROKER,
    topic: process.env.MQTT_TOPIC,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    allowInsecure: process.env.MQTT_ALLOW_INSECURE === 'true',
  },
};

export const validateProductionConfig = (): void => {
  if (!isProduction) {
    return;
  }

  if (!config.apiKey) {
    throw new Error('API_KEY is required in production');
  }

  if (config.corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS is required in production');
  }

  if (!config.mqtt.broker || !config.mqtt.topic) {
    throw new Error('MQTT_BROKER and MQTT_TOPIC are required in production');
  }

  const broker = new URL(config.mqtt.broker);
  if (broker.protocol !== 'mqtts:') {
    throw new Error('MQTT_BROKER must use mqtts:// in production');
  }

  if (!config.mqtt.username || !config.mqtt.password) {
    throw new Error('MQTT_USERNAME and MQTT_PASSWORD are required in production');
  }
};
