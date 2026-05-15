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

- Node.js
- TypeScript
- Fastify
- Prisma
- PostgreSQL
- MQTT.js
- Docker

## Data Flow

ClimaSense Firmware -> MQTT Broker -> ClimaSense API -> PostgreSQL -> Dashboard and Alert Engine

## Status

Initial MVP scaffold for UNICEF Venture Fund prototype development.

## License

MIT License.
