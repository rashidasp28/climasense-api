import type { ClimateReadingPayload } from './validation';

export const toClimateReadingData = (reading: ClimateReadingPayload) => ({
  deviceId: reading.device_id,
  schoolId: reading.school_id,
  community: reading.community,

  temperatureC: reading.temperature_c,
  humidityPercent: reading.humidity_percent,
  heatIndexC: reading.heat_index_c,

  pm25: reading.pm25_ugm3,
  pm10: reading.pm10_ugm3,

  soilMoisturePercent: reading.soil_moisture_percent,
  rainfallMm: reading.rainfall_mm,

  batteryVoltage: reading.battery_voltage,
  wifiRssi: reading.wifi_rssi,

  dhtHealthy: reading.dht_healthy,
});
