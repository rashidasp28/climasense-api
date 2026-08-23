import mqtt from 'mqtt';
import { config } from './config';
import { prisma } from './db';
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
      data: {
        deviceId: validated.device_id,
        schoolId: validated.school_id,
        community: validated.community,

        temperatureC: validated.temperature_c,
        humidityPercent: validated.humidity_percent,
        heatIndexC: validated.heat_index_c,

        pm25: validated.pm25_ugm3,
        pm10: validated.pm10_ugm3,

        soilMoisturePercent: validated.soil_moisture_percent,
        rainfallMm: validated.rainfall_mm,

        batteryVoltage: validated.battery_voltage,
        wifiRssi: validated.wifi_rssi,

        dhtHealthy: validated.dht_healthy,
      },
    });

    console.log('Stored climate reading:', stored.id);

  } catch (error) {
    console.error('Failed to process MQTT payload', error);
  }
});

export default client;
