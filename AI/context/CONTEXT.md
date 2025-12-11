# Weather App Context

Saved context for in-progress work and session continuity.

## Project State

**Status**: Stable demonstration application
**Last Updated**: 2024-12-11
**Ioto Version**: 3.x

## Current Focus

No active development. Application serves as Ioto demonstration.

## Recent Session Activity

### 2024-12-11

- Created CLAUDE.md for Claude Code guidance
- Established AI documentation structure
- Documented architecture, procedures, and references

## Known Issues

None currently tracked.

## Environment Notes

- macOS development environment
- OpenSSL from Homebrew (`/opt/homebrew/lib`)
- Ioto source extracted from `ioto-src.tgz`

## Quick Reference

### Key Files
- `weather.c` - Main application source
- `config/ioto.json5` - Ioto configuration template
- `config/schema.json5` - Database schema
- `state/` - Runtime state directory

### Build
```bash
make          # Build
make run      # Run
make clean    # Clean
```

### Debug
```bash
./weather -v  # Verbose logging
make dump     # Database dump
```
