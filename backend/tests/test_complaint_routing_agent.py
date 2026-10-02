import pytest
from app.agents.complaint_routing_agent import ComplaintRoutingAgent, ROUTING_CONFIG_TABLE

def test_routing_plumbing_leak():
    agent = ComplaintRoutingAgent()
    result = agent.run({
        "category_text": "",
        "free_text": "The washbasin tap in room 302 is leaking non-stop for 9 days"
    })
    out = result.output
    assert out["category"] == "Plumbing"
    assert out["department"] == ROUTING_CONFIG_TABLE["Plumbing"]["department"]
    assert out["owner_role"] == ROUTING_CONFIG_TABLE["Plumbing"]["owner_role"]
    assert out["suggested_priority"] in ["HIGH", "CRITICAL"]
    assert result.confidence > 0.7

def test_routing_electrical_spark():
    agent = ComplaintRoutingAgent()
    result = agent.run({
        "category_text": "Electrical",
        "free_text": "Spark coming from switchboard near bed"
    })
    out = result.output
    assert out["category"] == "Electrical"
    assert out["suggested_priority"] == "CRITICAL"
    assert out["department"] == ROUTING_CONFIG_TABLE["Electrical"]["department"]

def test_routing_fallback_other():
    agent = ComplaintRoutingAgent()
    result = agent.run({
        "category_text": "",
        "free_text": "Can someone help with my wooden study chair wheel?"
    })
    out = result.output
    assert out["category"] == "Other"
    assert out["department"] == ROUTING_CONFIG_TABLE["Other"]["department"]
