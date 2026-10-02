# ADR 0002: Hand-Built Deterministic Agents vs LLM Frameworks

## Context
The problem brief specifies automated agents for complaint triage, recurring issue detection, policy verification, and multilingual voice intents. Traditional LLM frameworks (LangChain, CrewAI, AutoGen) introduce massive dependency bloat, high latency, non-deterministic outputs, and fatal failure when internet connectivity drops.

## Decision
We implemented all 5 operational agents as **hand-built, pure Python deterministic agents**:
1. `ComplaintRoutingAgent`: Keyword tokenization, department matrix, urgency scoring.
2. `PatternMemoryAgent`: Sliding window temporal clustering, recurring sector hotspot detection.
3. `PolicyAgent`: Deterministic rule chains (attendance thresholds, curfew hours, academic holds).
4. `VoiceIntentAgent`: Offline phoneme/keyword pattern matching with Hindi/Odia language mapping.
5. `AskCampusIntentAgent`: Action dispatcher mapping natural language to concrete system workflows.

## Alternatives Considered
- **LangChain / LlamaIndex**: Rejected due to 500MB+ dependencies, slow startup times, and breaking API changes.
- **External OpenAI / Anthropic APIs**: Rejected because campus networks frequently experience outages; critical safety workflows (gate pass, electrical fire hazard reporting) must never depend on external cloud uptime.

## Consequences
- **Positive**: Sub-millisecond execution, 100% offline capability, zero API costs, zero hallucination risk, testable via standard unit tests.
- **Negative**: Natural language understanding requires explicit keyword synonym expansion.
