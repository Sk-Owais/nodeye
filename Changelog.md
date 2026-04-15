# Changelog

All notable changes to nodeye-js are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]
### Fixed
- Ongoing bug fixes and performance improvements

---

## [0.1.8] - 2026-04-15
### Fixed
- Improved patch stability for auto-instrumentation
- Fixed edge cases in async operation tracking

---

## [0.1.0 - 0.1.7] - 2026-04-01
### Added
- `init()` and `getInstance()` core
- Auto-patching for mongoose, axios, and ioredis
- `wrap()` for manual timing of async/sync functions
- `consoleReporter` (colored output)
- `jsonReporter` (NDJSON logging)
- Custom reporter support (single or multiple)
- `subscribe()` event system with unsubscribe support
- Full configuration system (thresholds, sampling, etc.)
- ESM + CJS dual build via tsup
- Initial npm release (`nodeye-js`)

### Notes
- Rapid early development phase; changes grouped for clarity