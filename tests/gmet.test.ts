import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GMetFeature,
  normalizeGMetFeatures,
} from '../src/gmet';

const NOW = Date.parse('2026-09-04T12:00:00.000Z');

const feature = ({
  reportId,
  reportTime,
  station = '0-20000-0-65418',
  name = 'air_temperature',
  value = 30,
}: {
  reportId: string;
  reportTime: string;
  station?: string;
  name?: string;
  value?: number;
}): GMetFeature => ({
  properties: {
    reportId,
    reportTime,
    wigos_station_identifier: station,
    name,
    value,
  },
});

test('groups measurements and returns the latest report for each northern station', () => {
  const features: GMetFeature[] = [
    feature({
      reportId: 'tamale-new',
      reportTime: '2026-09-04T10:00:00.000Z',
      name: 'air_temperature',
      value: 31.4,
    }),
    feature({
      reportId: 'tamale-new',
      reportTime: '2026-09-04T10:00:00.000Z',
      name: 'relative_humidity',
      value: 68,
    }),
    feature({
      reportId: 'tamale-new',
      reportTime: '2026-09-04T10:00:00.000Z',
      name: 'total_precipitation_or_total_water_equivalent',
      value: 2.5,
    }),
    feature({
      reportId: 'tamale-new',
      reportTime: '2026-09-04T10:00:00.000Z',
      name: 'non_coordinate_pressure',
      value: 1008.2,
    }),
    feature({
      reportId: 'tamale-new',
      reportTime: '2026-09-04T10:00:00.000Z',
      name: 'wind_speed',
      value: 3.2,
    }),
    feature({
      reportId: 'tamale-new',
      reportTime: '2026-09-04T10:00:00.000Z',
      name: 'wind_direction',
      value: 215,
    }),
    feature({
      reportId: 'tamale-old',
      reportTime: '2026-09-03T12:00:00.000Z',
      name: 'air_temperature',
      value: 27.1,
    }),
  ];

  assert.deepEqual(normalizeGMetFeatures(features, NOW), [
    {
      stationId: '65418',
      stationName: 'Tamale',
      wigosStationIdentifier: '0-20000-0-65418',
      observedAt: '2026-09-04T10:00:00.000Z',
      temperatureC: 31.4,
      humidityPercent: 68,
      rainfallMm: 2.5,
      pressureHpa: 1008.2,
      windSpeedMs: 3.2,
      windDirectionDegrees: 215,
      freshness: 'current',
    },
  ]);
});

test('filters unsupported stations and incomplete report metadata', () => {
  const features: GMetFeature[] = [
    feature({
      reportId: 'accra',
      reportTime: '2026-09-04T10:00:00.000Z',
      station: '0-20000-0-65472',
    }),
    {
      properties: {
        reportTime: '2026-09-04T10:00:00.000Z',
        wigos_station_identifier: '0-20000-0-65418',
        name: 'air_temperature',
        value: 31,
      },
    },
    {
      properties: {
        reportId: 'missing-station',
        reportTime: '2026-09-04T10:00:00.000Z',
        name: 'air_temperature',
        value: 31,
      },
    },
  ];

  assert.deepEqual(normalizeGMetFeatures(features, NOW), []);
});

test('maps non-finite and missing measurements to null', () => {
  const features: GMetFeature[] = [
    feature({
      reportId: 'tamale-invalid',
      reportTime: '2026-09-04T10:00:00.000Z',
      value: Number.POSITIVE_INFINITY,
    }),
  ];

  const [observation] = normalizeGMetFeatures(features, NOW);

  assert.equal(observation.temperatureC, null);
  assert.equal(observation.humidityPercent, null);
  assert.equal(observation.rainfallMm, null);
  assert.equal(observation.pressureHpa, null);
  assert.equal(observation.windSpeedMs, null);
  assert.equal(observation.windDirectionDegrees, null);
});

test('classifies current, delayed, and stale reports at documented boundaries', () => {
  const features: GMetFeature[] = [
    feature({
      reportId: 'navrongo-current',
      reportTime: '2026-09-04T06:00:00.000Z',
      station: '0-20000-0-65401',
    }),
    feature({
      reportId: 'tamale-delayed',
      reportTime: '2026-09-02T12:00:00.000Z',
      station: '0-20000-0-65418',
    }),
    feature({
      reportId: 'yendi-stale',
      reportTime: '2026-09-02T11:00:00.000Z',
      station: '0-20000-0-65420',
    }),
  ];

  const observations = normalizeGMetFeatures(features, NOW);

  assert.deepEqual(
    observations.map(({ stationName, freshness }) => ({ stationName, freshness })),
    [
      { stationName: 'Navrongo', freshness: 'current' },
      { stationName: 'Tamale', freshness: 'delayed' },
      { stationName: 'Yendi', freshness: 'stale' },
    ],
  );
});
