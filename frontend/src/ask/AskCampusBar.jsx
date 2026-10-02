import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle, CornerDownRight, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export default function AskCampusBar({ onActionTriggered }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showExplainability, setShowExplainability] = useState(false);

  const sampleIntents = [
    { label: "Gate Pass", text: "I need to go home to Cuttack tomorrow for my cousin's wedding" },
    { label: "Plumbing Complaint", text: "The tap in room 302 has been leaking for 9 days" },
    { label: "Certificate Request", text: "I need a Bonafide certificate for my passport application" },
    { label: "Daily Briefing", text: "Anything important for me today?" }
  ];

  const handleExecuteIntent = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    setLoading(true);
    setQuery(text);
    try {
      const res = await api.queryAskCampus(text);
      setResult(res);
      setShowExplainability(true);
      if (onActionTriggered) onActionTriggered(res);
    } catch (e) {
      setResult({
        intent: 'ERROR',
        confidence: 0,
        message: `Execution error: ${e.message}`,
        explainability: { error: e.message }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      boxShadow: 'var(--shadow-md)',
      border: '1.5px solid var(--color-primary-border)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)' }}>
              Ask Campus — Intent-First Front Door
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>
              Hand-built Python Intent & Policy Engine (Section 13)
            </p>
          </div>
        </div>
        <span className="status-pill blue" style={{ fontSize: '10px' }}>
          Zero-Hallucination Policy
        </span>
      </div>

      {/* Free-Text Input Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecuteIntent()}
          placeholder="Tell the campus what you need (e.g., 'Need leave tomorrow', 'Tap leaking in 302')..."
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--color-neutral-light)',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: 'var(--color-surface-bg)'
          }}
        />
        <button
          onClick={() => handleExecuteIntent()}
          disabled={loading || !query.trim()}
          className="btn-primary"
          style={{ width: 'auto', padding: '0 24px', opacity: loading || !query.trim() ? 0.6 : 1 }}
        >
          {loading ? 'Routing...' : 'Coordinate'}
        </button>
      </div>

      {/* Suggested Intent Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: result ? '16px' : '0' }}>
        {sampleIntents.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleExecuteIntent(chip.text)}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'var(--color-surface-bg)',
              border: '1px solid var(--color-neutral-light)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-ink)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ color: 'var(--color-primary)' }}>•</span> {chip.label}
          </button>
        ))}
      </div>

      {/* Results View */}
      {result && (
        <div style={{
          marginTop: '16px',
          borderTop: '1px solid var(--color-neutral-light)',
          paddingTop: '16px'
        }}>
          {/* Main Status & Message */}
          <div style={{
            backgroundColor: result.needs_clarification ? 'var(--color-semantic-amber-bg)' : 'var(--color-primary-light)',
            borderLeft: `4px solid ${result.needs_clarification ? 'var(--color-semantic-amber)' : 'var(--color-primary)'}`,
            padding: '14px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className={`status-pill ${result.needs_clarification ? 'amber' : 'green'}`}>
                INTENT: {result.intent} ({(result.confidence * 100).toFixed(0)}%)
              </span>
              {result.linked_id && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Record #{result.linked_id} Live in DB
                </span>
              )}
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', lineHeight: '1.4' }}>
              {result.message}
            </p>
          </div>

          {/* Workflow Checklist (GREEN = Auto Completed, AMBER = Blocked on Human Staff/Admin Approval) */}
          {result.workflow?.steps && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-neutral-mid)', marginBottom: '10px' }}>
                Enforced Institutional Workflow Chain:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.workflow.steps.map((step, sIdx) => {
                  const isGreen = step.state_color === 'GREEN' || step.status === 'COMPLETED';
                  const isAmber = step.state_color === 'AMBER' || step.status === 'PENDING' || step.status === 'ACTIVE';
                  return (
                    <div
                      key={sIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isGreen ? 'var(--color-semantic-green-bg)' : 'var(--color-semantic-amber-bg)',
                        border: `1px solid ${isGreen ? 'rgba(22, 163, 74, 0.25)' : 'rgba(217, 119, 6, 0.25)'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isGreen ? (
                          <CheckCircle2 size={18} style={{ color: 'var(--color-semantic-green)' }} />
                        ) : (
                          <Clock size={18} style={{ color: 'var(--color-semantic-amber)' }} />
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>
                            {step.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>
                            {step.description}
                          </div>
                        </div>
                      </div>
                      <span className={`status-pill ${isGreen ? 'green' : 'amber'}`}>
                        {isGreen ? 'Auto-Completed' : 'Human Blocked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Briefing items if intent is BRIEFING_REQUEST */}
          {result.workflow?.items && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {result.workflow.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-surface-bg)',
                    borderLeft: `4px solid ${item.tag === 'DEADLINE' ? 'var(--color-semantic-red)' : item.tag === 'ACTION' ? 'var(--color-semantic-amber)' : 'var(--color-semantic-blue)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className={`status-pill ${item.tag === 'DEADLINE' ? 'red' : item.tag === 'ACTION' ? 'amber' : 'blue'}`}>
                      {item.tag}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-neutral-mid)' }}>{item.source}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>{item.detail}</div>
                </div>
              ))}
            </div>
          )}

          {/* Workflow completed / pending message without explainability box */}
        </div>
      )}
    </div>
  );
}
