import { z } from 'zod';

export const climateReadingSchema = z.object({
  device_id: z.string(),
  school_id: z.string().optional(),
  community: z.string().optional(),

  temperature_c: z.number().optional(),
  humidity_percent: z.number().optional(),
  heat_index_c: z.number().optional(),

  pm25_ugm3: z.number().optional(),
  pm10_ugm3: z.number().optional(),

  soil_moisture_percent: z.number().optional(),
  rainfall_mm: z.number().optional(),

  battery_voltage: z.number().optional(),
  wifi_rssi: z.number().optional(),

  dht_healthy: z.boolean().optional(),
});

export type ClimateReadingPayload = z.infer<typeof climateReadingSchema>;
