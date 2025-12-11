# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sample Ioto IoT weather station app that demonstrates the Ioto device agent. Fetches weather data from open-meteo.com APIs and syncs to the Embedthis IoT cloud via MQTT.

## Build Commands

```bash
make                    # Build everything (configures, builds ioto library, compiles weather.c)
make run                # Run the weather app
make clean              # Clean all build artifacts
make format             # Format code with uncrustify
make dump               # Dump database contents

OPTIMIZE=release make   # Release build
SHOW=1 make             # Show build commands
```

## Architecture

```
weather.c              # Main application (single source file)
ioto/                  # Ioto device agent library (dependency)
config/                # Configuration templates
  ioto.json5           # Main Ioto configuration
  schema.json5         # Database schema (OneTable format)
  device.json5         # Device identity
  display.json5        # UI display configuration
state/                 # Runtime state (gitignored)
  config/              # Active configuration (copied from config/)
  db/                  # Embedded database
  certs/               # TLS certificates
theme/                 # Web UI assets (zipped to assets.zip)
```

## Application Flow

1. `ioStartRuntime()` initializes Ioto runtime
2. `ioRun()` starts the event loop
3. `ioStart()` (callback) registers `demo()` to run when cloud connects
4. `demo()` loops every 10 seconds:
   - Fetches lat/lon from geocoding-api.open-meteo.com
   - Fetches weather from api.open-meteo.com
   - Syncs outlook to cloud via `ioSet()`
   - Logs temperature metric via `ioSetMetric()`
5. `changeCity()` watches for UI-triggered city changes via `rWatch()`

## Key Ioto APIs Used

```c
ioStartRuntime(0)              // Initialize runtime
ioRun(NULL)                    // Start event loop
ioOnConnect(callback, ...)     // Register cloud connect handler
ioConnected()                  // Check cloud connection status
ioGet("key")                   // Get value from cloud Store
ioSet("key", value)            // Set value in cloud Store
ioSetMetric(path, value, ...)  // Log metric to cloud
rWatch("db:sync:Store", ...)   // Watch for database sync events
urlGetJson(url, NULL)          // HTTP GET returning JSON
jsonGet/jsonGetDouble/...      // JSON parsing
rSleep(duration)               // Fiber-aware sleep
rInfo("source", "message")     // Logging
```

## Configuration

The app uses `config/ioto.json5` as template. Key services enabled:
- `database: true` - Embedded database
- `mqtt: true` - Cloud sync via MQTT
- `sync: true` - Database synchronization
- `provision: true` - Device provisioning
- `register: true` - Device registration

## Code Conventions

- Use Ioto's safe runtime functions (`slen`, `scopy`, `scmp`, `sfmt`, `sclone`)
- Use `rFree` for Ioto-allocated memory
- Use fiber-aware I/O (blocking calls yield to other fibers)
- Single-threaded execution model
