# Campus Life OS — Backend Service (FastAPI & SQLite3)

## Requirements & Execution
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
3. Run tests:
   ```bash
   python -m pytest -v
   ```

## Agent Architecture
All agents in `app/agents/` are hand-built plain Python classes without LangChain or other agent frameworks:
- `complaint_routing_agent.py`: Keyword/rule-based SLA & department assignment.
- `pattern_memory_agent.py`: Deterministic SQL cluster & spike analysis.
- `faq_chatbot_agent.py`: Fixed rule-matched Q&A pairs for the 20 campus office questions.
- `voice_intent_agent.py`: Multilingual acoustic intent router for EN/HI/OR.
- `intent_agent.py`: Ask Campus intent classifier & entity extractor.
- `policy_agent.py`: Canonical non-hallucinated institutional approval chains.
