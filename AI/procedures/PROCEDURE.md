# Weather App Procedures

This document contains operational procedures for the Weather sample application.

## Contents

Additional procedure documents:

- (No additional procedure documents yet)

## Build Procedure

### Prerequisites

- C compiler (gcc/clang)
- OpenSSL development libraries
- Make

### Build Steps

```bash
# Full build (first time or after clean)
make

# Rebuild after code changes
make

# Release build
OPTIMIZE=release make

# Clean and rebuild
make clean && make
```

### Build Outputs

- `weather` - Executable binary
- `assets.zip` - Web UI theme assets
- `ioto/build/bin/libioto.a` - Ioto static library

## Running

### Local Development

```bash
# Run with default configuration
make run

# Run with verbose logging
./weather --verbose
./weather -v
```

### Configuration

Before first run, ensure:
1. `state/config/` contains configuration files
2. `state/certs/` contains TLS certificates
3. Device is provisioned with cloud account

## Updating Ioto

When a new Ioto release is available:

```bash
# Place new ioto-X.X.X.tgz in project root
make update
make
```

## Debugging

### Database Inspection

```bash
# Dump database contents
make dump
```

### Logging

Verbose mode shows:
- HTTP requests/responses
- Cloud connection status
- Weather data fetched
- Sync operations

### Common Issues

| Issue | Resolution |
|-------|------------|
| Cloud connection fails | Check `state/certs/` certificates |
| Weather data empty | Verify internet connectivity |
| City not changing | Check `rWatch` callback registration |

## Code Formatting

```bash
# Format all C source files
make format
```

Uses `.uncrustify` configuration for consistent style.
