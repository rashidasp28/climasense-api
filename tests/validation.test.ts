import assert from 'node:assert/strict';
import test from 'node:test';

import { climateReadingSchema } from '../src/validation';

test('accepts a complete telemetry payload', () => {
  const payload = {
    device_id: 'sensor-001',
    school_id: 'school-001',
    community: 'Tamale',
    temperature_c: 31.4,
    humidity_percent: 64,
    heat_index_c: 35.2,
    pm25_ugm3: 18.7,
    pm10_ugm3: 27.1,
    soil_moisture_percent: 42,
    rainfall_mm: 3.5,
    battery_voltage: 4.1,
    wifi_rssi: -61,
    dht_healthy: true,
  };

  assert.deepEqual(climateReadingSchema.parse(payload), payload);
});

test('accepts the minimum payload required from a device', () => {
  assert.deepEqual(
    climateReadingSchema.parse({ device_id: 'sensor-002' }),
    { device_id: 'sensor-002' },
  );
});

test('rejects telemetry without a device identifier', () => {
  const result = climateReadingSchema.safeParse({ temperature_c: 28.5 });

  assert.equal(result.success, false);
});

test('rejects incorrectly typed sensor readings', () => {
  const result = climateReadingSchema.safeParse({
    device_id: 'sensor-003',
    temperature_c: '28.5',
    dht_healthy: 'true',
  });

  assert.equal(result.success, false);
});
