# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.
This project follows Semantic Versioning.

## [Unreleased]

### Added
- Governance documents and phased implementation plans.
- SQLite-based local memory engine for persistent L1/L2 memory across restarts.
- Severity state machine with session-level escalation and TTL-based de-escalation.
- Runtime tests covering fallback, persona regeneration, memory persistence, and severity transitions.
- Structured route metadata and multi-level fallback chain (retry -> secondary -> minimal-safe).
- Lightweight telemetry component for per-turn stage logs and runtime counters.
- Snapshot backup and restore scripts with manifest checksum verification.
- Provider adapter layer for DeepSeek/Gemini/Anthropic with configurable model refs.
- Acceptance tests for provider parsing, registry behavior, and router fallback with injected providers.
- macOS startup env loader scripts and environment template for model provider config.
- Background daemon and interactive CLI mode for persistent local chat sessions.
