# ADR 0003: Hybrid Offline Voice & SMS Command Fallback

## Context
Many students live in rural Odisha hostels or campus dead zones where cellular 4G/5G signal drops to 2G or zero connectivity. Emergency complaints and gate pass status checks cannot wait for high-speed Wi-Fi.

## Decision
We implemented a **multi-tiered fallback system**:
1. High Bandwidth: WebGL 3D Campus Quest, interactive voice audio, real-time push.
2. Low Bandwidth Mode: Plain text turn-by-turn checklist, static SVG maps (0KB 3D assets).
3. Zero Internet: Two-way SMS Command Gateway (`STATUS`, `COMPLAINT [text]`, `PASS`, `MENU`) simulating telecom GSM modems with instant automated responses.

## Alternatives Considered
- **Pure Web App**: Fails completely in hostel basements or during university internet switch failures.
- **USSD Menus**: Requires telecom carrier licensing; SMS gateway simulation provides immediate testability and practical fallback.

## Consequences
- **Positive**: 100% campus population inclusivity regardless of device tier or network strength.
- **Negative**: SMS commands require strict syntax parsing.
