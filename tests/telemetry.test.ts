import assert from 'node:assert/strict';
import test from 'node:test';

import { toClimateReadingData } from '../src/telemetry';
import { climateReadingSchema } from '../src/validation';

test('maps every firmware telemetry field to its database column', () => {
  const validated = climateReadingSchema.parse({
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
  });

  assert.deepEqual(toClimateReadingData(validated), {
    deviceId: 'sensor-001',
    schoolId: 'school-001',
    community: 'Tamale',
    temperatureC: 31.4,
    humidityPercent: 64,
    heatIndexC: 35.2,
    pm25: 18.7,
    pm10: 27.1,
    soilMoisturePercent: 42,
    rainfallMm: 3.5,
    batteryVoltage: 4.1,
    wifiRssi: -61,
    dhtHealthy: true,
  });
});

test('preserves absent optional measurements as undefined', () => {
  const validated = climateReadingSchema.parse({ device_id: 'sensor-002' });

  assert.deepEqual(toClimateReadingData(validated), {
    deviceId: 'sensor-002',
    schoolId: undefined,
    community: undefined,
    temperatureC: undefined,
    humidityPercent: undefined,
    heatIndexC: undefined,
    pm25: undefined,
    pm10: undefined,
    soilMoisturePercent: undefined,
    rainfallMm: undefined,
    batteryVoltage: undefined,
    wifiRssi: undefined,
    dhtHealthy: undefined,
  });
});
