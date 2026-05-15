import mqtt from 'mqtt';
import { prisma } from './db';
import { climateReadingSchema } from './validation';

const brokerUrl = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const topic = process.env.MQTT_TOPIC || 'climasense/ghana/northern/readings';

const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  client.subscribe(topic, (error) => {
    if (error) {
      console.error('MQTT subscribe error', error);
    } else {
      console.log(`Subscribed to ${topic}`);
    }
  });
});

client.on('message', async (_topic, payload) => {
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
