import mqtt from 'mqtt';

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

    console.log('Received telemetry:', parsed);

    // TODO:
    // Validate payload
    // Store in PostgreSQL
    // Trigger alerts

  } catch (error) {
    console.error('Failed to process MQTT payload', error);
  }
});

export default client;
