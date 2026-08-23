# ClimaSense API

Backend ingestion and data API for the ClimaSense climate-health monitoring platform.

This service receives MQTT telemetry from ClimaSense ESP32 sensor nodes, validates climate-health readings, stores them in PostgreSQL, and exposes REST endpoints for dashboards, alert engines, and public-interest reporting.

## Core Responsibilities

- MQTT telemetry ingestion
- Climate reading validation
- PostgreSQL data storage with Prisma
- REST API for readings, devices, schools, and communities
- Health checks and deployment readiness
- OpenAPI-ready backend architecture

## Stack

- Node.js 20
- TypeScript
- Fastify
- Prisma
- PostgreSQL
- MQTT.js
- Docker

## Data Flow

ClimaSense Firmware -> MQTT Broker -> ClimaSense API -> PostgreSQL -> Dashboard and Alert Engine

## Local Development

### Prerequisites

- Node.js 20 and npm
- Docker with Docker Compose
- `curl`
- An MQTT publisher, such as `mosquitto_pub`, for the optional ingestion test

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

Wait until PostgreSQL is ready:

```bash
docker compose exec postgres pg_isready -U postgres -d climasense
```

### 2. Install dependencies and configure the local database

```bash
npm install
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/climasense
export PORT=3000
export MQTT_BROKER=mqtt://broker.hivemq.com:1883
export MQTT_TOPIC=climasense/ghana/northern/readings
npm run prisma:generate
npx prisma db push
```

The example credentials above are for the local Docker database only.

### 3. Build and start the API

Verify the TypeScript build:

```bash
npm run build
```

Start the development server:

```bash
npm run dev
```

### 4. Check the API

In another terminal:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/readings
```

The health endpoint should return `"status":"ok"`. The readings endpoint returns the latest 100 records, newest first.

### 5. Simulate telemetry ingestion

Publish a test message to the topic configured above:

```bash
mosquitto_pub \
  -h broker.hivemq.com \
  -p 1883 \
  -t climasense/ghana/northern/readings \
  -m '{"device_id":"simulator-001","school_id":"school-demo","community":"community-demo","temperature_c":31.4,"humidity_percent":68.2,"heat_index_c":36.1,"pm25_ugm3":14.2,"pm10_ugm3":21.5,"soil_moisture_percent":42.0,"rainfall_mm":0,"battery_voltage":3.9,"wifi_rssi":-58,"dht_healthy":true}'
```

Check the API again:

```bash
curl http://localhost:3000/api/readings
```

A successful ingestion adds a record with `deviceId` set to `simulator-001`.

### Stop local services

Stop PostgreSQL while keeping its data:

```bash
docker compose down
```

Remove the local database volume only when you intentionally want a clean database:

```bash
docker compose down -v
```

## Status

Initial MVP scaffold for UNICEF Venture Fund prototype development.

## License

MIT License.
