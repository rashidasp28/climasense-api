import mqtt from 'mqtt';
import { config } from './config';
import { prisma } from './db';
import { toClimateReadingData } from './telemetry';
import { climateReadingSchema } from './validation';

const { broker, topic, username, password, allowInsecure } = config.mqtt;

if (!broker || !topic) {
  console.warn('MQTT ingestion disabled: MQTT_BROKER and MQTT_TOPIC are not configured');
}

if ((username && !password) || (!username && password)) {
  throw new Error('MQTT_USERNAME and MQTT_PASSWORD must be configured together');
}

if (broker && new URL(broker).protocol !== 'mqtts:' && !allowInsecure) {
  throw new Error('Insecure MQTT requires the explicit MQTT_ALLOW_INSECURE=true opt-in');
}

const client = broker && topic
  ? mqtt.connect(broker, {
      username,
      password,
      rejectUnauthorized: true,
    })
  : null;

client?.on('connect', () => {
  console.log('Connected to MQTT broker');

  client.subscribe(topic!, (error) => {
    if (error) {
      console.error('MQTT subscribe error', error);
    } else {
      console.log(`Subscribed to ${topic}`);
    }
  });
});

client?.on('message', async (_topic, payload) => {
  try {
    const parsed = JSON.parse(payload.toString());

    const validated = climateReadingSchema.parse(parsed);

    const stored = await prisma.climateReading.create({
      data: toClimateReadingData(validated),
    });

    console.log('Stored climate reading:', stored.id);

  } catch (error) {
    console.error('Failed to process MQTT payload', error);
  }
});

export default client;
