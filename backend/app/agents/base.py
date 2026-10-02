from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional, Dict

@dataclass
class AgentResult:
    agent_name: str
    output: Dict[str, Any]
    confidence: Optional[float] = None
    reasoning: Optional[str] = None

class Agent(ABC):
    name: str

    @abstractmethod
    def run(self, input_data: dict) -> AgentResult:
        pass
