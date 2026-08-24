const GMET_COLLECTION =
  'urn:wmo:md:gh-gmet:core.surface-based-observations.synop';

const DEFAULT_GMET_URL =
  `https://wis2.meteo.gov.gh/oapi/collections/${encodeURIComponent(GMET_COLLECTION)}/items?sortby=-reportTime&limit=2000&f=json`;

const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;

const NORTHERN_STATIONS: Record<string, string> = {
  '65401': 'Navrongo',
  '65404': 'Wa',
  '65418': 'Tamale',
  '65420': 'Yendi',
};

type GMetFeature = {
  properties?: {
    name?: string;
    reportId?: string;
    reportTime?: string;
    units?: string;
    value?: number;
    wigos_station_identifier?: string;
  };
};

type GMetFeatureCollection = {
  features?: GMetFeature[];
};

export type GMetObservation = {
  stationId: string;
  stationName: string;
  wigosStationIdentifier: string;
  observedAt: string;
  temperatureC: number | null;
  humidityPercent: number | null;
  rainfallMm: number | null;
  pressureHpa: number | null;
  windSpeedMs: number | null;
  windDirectionDegrees: number | null;
  freshness: 'current' | 'delayed' | 'stale';
};

type CacheEntry = {
  expiresAt: number;
  observations: GMetObservation[];
};

let cache: CacheEntry | null = null;

function stationCode(wigosIdentifier: string) {
  return wigosIdentifier.split('-').at(-1) ?? wigosIdentifier;
}

function freshnessFor(observedAt: string, now = Date.now()): GMetObservation['freshness'] {
  const ageHours = (now - new Date(observedAt).getTime()) / 3_600_000;

  if (ageHours <= 6) return 'current';
  if (ageHours <= 48) return 'delayed';
  return 'stale';
}

function measurement(
  features: GMetFeature[],
  name: string,
): number | null {
  const value = features.find((feature) => feature.properties?.name === name)
    ?.properties?.value;

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalize(features: GMetFeature[]): GMetObservation[] {
  const reports = new Map<string, GMetFeature[]>();

  for (const feature of features) {
    const properties = feature.properties;
    if (!properties?.reportId || !properties.wigos_station_identifier) continue;

    const code = stationCode(properties.wigos_station_identifier);
    if (!NORTHERN_STATIONS[code]) continue;

    const report = reports.get(properties.reportId) ?? [];
    report.push(feature);
    reports.set(properties.reportId, report);
  }

  const latestByStation = new Map<string, GMetObservation>();

  for (const report of reports.values()) {
    const properties = report[0]?.properties;
    if (!properties?.reportTime || !properties.wigos_station_identifier) continue;

    const code = stationCode(properties.wigos_station_identifier);
    const observation: GMetObservation = {
      stationId: code,
      stationName: NORTHERN_STATIONS[code],
      wigosStationIdentifier: properties.wigos_station_identifier,
      observedAt: properties.reportTime,
      temperatureC: measurement(report, 'air_temperature'),
      humidityPercent: measurement(report, 'relative_humidity'),
      rainfallMm: measurement(report, 'total_precipitation_or_total_water_equivalent'),
      pressureHpa: measurement(report, 'non_coordinate_pressure'),
      windSpeedMs: measurement(report, 'wind_speed'),
      windDirectionDegrees: measurement(report, 'wind_direction'),
      freshness: freshnessFor(properties.reportTime),
    };

    const previous = latestByStation.get(code);
    if (!previous || observation.observedAt > previous.observedAt) {
      latestByStation.set(code, observation);
    }
  }

  return [...latestByStation.values()].sort((a, b) =>
    a.stationName.localeCompare(b.stationName),
  );
}

export async function fetchGMetObservations(): Promise<GMetObservation[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.observations;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(process.env.GMET_OBSERVATIONS_URL || DEFAULT_GMET_URL, {
      headers: { accept: 'application/geo+json, application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GMet returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as GMetFeatureCollection;
    const observations = normalize(payload.features ?? []);

    cache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      observations,
    };

    return observations;
  } finally {
    clearTimeout(timeout);
  }
}

export const gmetSource = {
  name: 'Ghana Meteorological Agency (GMet)',
  dataset: 'Hourly synoptic observations from fixed-land stations',
  dataPolicy: 'WMO core',
  climateAtlasUrl: 'https://www.meteo.gov.gh/climate-atlas/climate-change/',
  observationsUrl: 'https://wis2.meteo.gov.gh/',
};
