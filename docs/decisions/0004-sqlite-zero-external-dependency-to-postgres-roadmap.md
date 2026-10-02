# ADR 0004: SQLite Zero-External-Dependency to PostgreSQL Production Roadmap

## Context
Evaluation environments, hackathon judging, and air-gapped demo laptops often lack active PostgreSQL server instances or Docker permissions. However, production university deployments with 5,000+ students require concurrent writes and connection pooling.

## Decision
We implemented a **Postgres-compatible SQLAlchemy schema with SQLite as the default zero-configuration database**:
- Local Development & Hackathon Evaluation: SQLite (`sqlite:///./campus_life.db`) requires zero setup, zero services to start, and runs out of the box.
- Production Deployment: Set `DATABASE_URL=postgresql://user:pass@host:5432/campus_life` in `.env`. The schema uses standard ANSI SQL types (`Integer`, `String`, `DateTime`, `ForeignKey`) fully portable to Postgres.

## Alternatives Considered
- **Postgres Only**: Fails on machines without a running Postgres daemon or Docker daemon.
- **MongoDB**: Schema validation and ACID transactions for financial mess cards and gate pass approval audits require relational consistency.

## Consequences
- **Positive**: Works everywhere immediately with zero installation friction while maintaining a clean production migration path.
- **Negative**: SQLite has limited write concurrency, requiring queue-based serialization for high-volume bursts.
