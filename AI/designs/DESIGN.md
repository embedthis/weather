# Weather App Design

This document provides the architectural and design overview for the Ioto Weather sample application.

## Contents

This is the primary design document. Additional design documents may be added as needed:

- (No additional design documents yet)

## Overview

The Weather app is a demonstration Ioto device agent that simulates an IoT weather station. It fetches real weather data from external APIs and syncs it to the Embedthis IoT cloud, showcasing Ioto's cloud connectivity and data synchronization capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Weather Application                      │
│                        (weather.c)                           │
├─────────────────────────────────────────────────────────────┤
│                      Ioto Device Agent                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  HTTP   │ │  JSON   │ │Database │ │  MQTT   │           │
│  │ Client  │ │ Parser  │ │  Sync   │ │ Client  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│                    Safe Runtime (R)                          │
│            Fibers │ Memory │ I/O │ Events                    │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────┐                ┌─────────────────────────┐
│   Open-Meteo    │                │   Embedthis IoT Cloud   │
│  Weather APIs   │                │   (MQTT/DynamoDB)       │
└─────────────────┘                └─────────────────────────┘
```

## Components

### Application Layer (weather.c)

Single-source application implementing:

- **main()**: Initializes runtime, parses arguments, starts event loop
- **ioStart()**: Callback invoked by Ioto to start application logic
- **demo()**: Main loop that fetches and publishes weather data
- **getLatLon()**: Geocoding API client for city coordinates
- **getWeather()**: Weather API client for current conditions
- **changeCity()**: Event handler for UI-triggered city changes

### External APIs

| API | Endpoint | Purpose |
|-----|----------|---------|
| Geocoding | geocoding-api.open-meteo.com | Convert city name to lat/lon |
| Weather | api.open-meteo.com | Get current temperature and weather code |

### Data Flow

1. User selects city via cloud UI
2. City syncs down to device via MQTT/database sync
3. `changeCity()` watches for Store changes
4. `demo()` detects new city, fetches coordinates
5. Weather data fetched every 10 seconds
6. Outlook stored via `ioSet()` (syncs to cloud Store)
7. Temperature logged via `ioSetMetric()` (time-series data)

## Configuration

### ioto.json5

Key configuration sections:

| Section | Purpose |
|---------|---------|
| database | Embedded SQLite database settings |
| mqtt | Cloud connection parameters |
| services | Enable/disable Ioto services |
| tls | Certificate configuration |

### schema.json5

OneTable schema defining data models:

- **Store**: Key-value pairs synced between device and cloud
- **Device**: Device identity and state
- **Log**: Device log entries
- **Command**: Remote commands from cloud
- **Broadcast**: Broadcast messages

## Threading Model

Single-threaded with fiber-based concurrency:

- All I/O operations are fiber-aware (yield during blocking)
- Event loop processes MQTT messages, HTTP responses, timers
- `rWatch()` registers callbacks for database/sync events
- `rSleep()` yields to other fibers during delay

## State Management

```
state/
├── config/          # Active configuration (mutable)
├── db/              # Embedded database
│   └── device.db    # SQLite database file
└── certs/           # TLS certificates
```

Runtime state is separated from source configuration:
- `config/` contains templates (committed)
- `state/config/` contains active config (gitignored)
- First build copies templates to state
