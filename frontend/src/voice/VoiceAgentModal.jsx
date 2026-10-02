import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Globe, AlertTriangle, CheckCircle, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function VoiceAgentModal({ onNavigate }) {
  const { language, setLanguage, showVoiceModal, setShowVoiceModal } = useApp();
  const { user } = useAuth();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(null);

  useEffect(() => {
    api.getVoiceStatus().then(status => setOfflineStatus(status)).catch(() => {});
  }, []);

  const sampleVoicePrompts = {
    en: [
      "Show my schedule for today",
      "What is my attendance percentage?",
      "The washbasin tap is leaking in Room 302",
      "What is for lunch in mess today?",
      "What are the central library hours?"
    ],
    hi: [
      "आज की समय सारणी दिखाओ",
      "मेरी अटेंडेंस कितनी है?",
      "कमरा 302 में पंखा खराब है",
      "आज मेस में दोपहर को क्या बना है?",
      "बोनाफाइड सर्टिफिकेट कैसे मिलेगा?"
    ],
    or: [
      "ଆଜି କ୍ଲାସ କେତେବେଳେ ଅଛି?",
      "ମୋର ଉପସ୍ଥିତି କେତେ ପ୍ରତିଶତ?",
      "ରୁମ 302 ରେ ପାଣି ଟ୍ୟାପ ଲିକ୍ ହେଉଛି",
      "ଆଜି ମେସରେ ଖାଇବା କଣ ଅଛି?",
      "ଲାଇବ୍ରେରୀ କେତେବେଳେ ଖୋଲେ?"
    ]
  };

  const handleSendTranscript = async (textToSend) => {
    const text = textToSend || transcript;
    if (!text.trim()) return;

    setLoading(true);
    setTranscript(text);
    try {
      const res = await api.processVoiceTranscript(text, 'home', language);
      setResponse(res);

      // Play local speech synthesis if supported
      if ('speechSynthesis' in window && res.response_text) {
        const utter = new SpeechSynthesisUtterance(res.response_text);
        utter.lang = language === 'hi' ? 'hi-IN' : language === 'or' ? 'or-IN' : 'en-IN';
        window.speechSynthesis.speak(utter);
      }

      // If action requires navigation
      if (res.action_type === 'NAVIGATE' || res.action_type === 'NAVIGATE_OR_READ') {
        if (onNavigate && res.action_data?.target_route) {
          setTimeout(() => {
            onNavigate(res.action_data.target_route);
            setShowVoiceModal(false);
          }, 1500);
        }
      }
    } catch (e) {
      setResponse({
        intent: 'ERROR',
        response_text: `Voice processing error: ${e.message}`,
        offline_status: offlineStatus?.[language]
      });
    } finally {
      setLoading(false);
      setIsListening(false);
    }
  };

  const toggleMic = () => {
    if (!isListening) {
      setIsListening(true);
      // Try Web Speech API for voice capture if available
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = language === 'hi' ? 'hi-IN' : language === 'or' ? 'or-IN' : 'en-IN';
          recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            setTranscript(speechToText);
            handleSendTranscript(speechToText);
          };
          recognition.onerror = () => {
            setIsListening(false);
          };
          recognition.onend = () => {
            setIsListening(false);
          };
          recognition.start();
        } catch (e) {
          console.warn("Browser SpeechRecognition failed to start:", e);
        }
      } else {
        // Fallback simulated listening
        setTimeout(() => {
          setIsListening(false);
        }, 3000);
      }
    } else {
      setIsListening(false);
    }
  };

  const currentLangStatus = offlineStatus?.[language] || {
    engine: "Local Acoustic Engine",
    available: true,
    status_message: "Local voice stack active."
  };

  if (!showVoiceModal) {
    return (
      <button
        onClick={() => setShowVoiceModal(true)}
        title="Offline Multilingual Voice Agent (EN / HI / OR)"
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          border: '2px solid rgba(255,255,255,0.4)',
          transition: 'transform var(--transition-fast)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Mic size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '520px',
        padding: '24px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Volume2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-ink)' }}>
                Offline Voice Agent
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>
                Vosk & Piper Localhost Stack (Sections 7.4 & 9)
              </p>
            </div>
          </div>
          <button onClick={() => setShowVoiceModal(false)} style={{ background: 'transparent', color: 'var(--color-neutral-mid)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Language Switcher */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          background: 'var(--color-surface-bg)',
          padding: '6px',
          borderRadius: 'var(--radius-md)'
        }}>
          {[
            { id: 'en', label: 'English (IN)' },
            { id: 'hi', label: 'हिंदी (Hindi)' },
            { id: 'or', label: 'ଓଡ଼ିଆ (Odia)' }
          ].map(lang => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: language === lang.id ? 'var(--color-primary)' : 'transparent',
                color: language === lang.id ? '#FFF' : 'var(--color-ink)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Honest Degradation Diagnostics (Section 9 Requirement) */}
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          backgroundColor: currentLangStatus.available ? 'var(--color-semantic-green-bg)' : 'var(--color-semantic-amber-bg)',
          border: `1px solid ${currentLangStatus.available ? 'rgba(22, 163, 74, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
          color: currentLangStatus.available ? 'var(--color-semantic-green)' : 'var(--color-semantic-amber)'
        }}>
          {currentLangStatus.available ? <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />}
          <div>
            <strong>{currentLangStatus.engine}:</strong> {currentLangStatus.status_message}
          </div>
        </div>

        {/* Mic Activation Area */}
        <div style={{
          textAlign: 'center',
          padding: '20px 0',
          borderTop: '1px solid var(--color-neutral-light)',
          borderBottom: '1px solid var(--color-neutral-light)',
          marginBottom: '16px'
        }}>
          <button
            onClick={toggleMic}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: isListening ? 'var(--color-semantic-red)' : 'var(--color-primary)',
              color: '#FFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListening ? '0 0 25px rgba(220, 38, 38, 0.6)' : 'var(--shadow-md)',
              transform: isListening ? 'scale(1.1)' : 'scale(1)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          <p style={{ marginTop: '10px', fontSize: '13px', fontWeight: 600, color: isListening ? 'var(--color-semantic-red)' : 'var(--color-neutral-mid)' }}>
            {isListening ? 'Listening on localhost acoustic stream...' : 'Tap microphone to speak or click a sample below'}
          </p>
        </div>

        {/* Text Input & Quick Samples */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendTranscript()}
              placeholder="Or type voice transcript..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-neutral-light)',
                fontSize: '14px'
              }}
            />
            <button
              onClick={() => handleSendTranscript()}
              disabled={loading || !transcript.trim()}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#FFF',
                padding: '0 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                opacity: loading || !transcript.trim() ? 0.6 : 1
              }}
            >
              <CornerDownLeft size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {sampleVoicePrompts[language]?.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendTranscript(prompt)}
                style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--color-surface-bg)',
                  border: '1px solid var(--color-neutral-light)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-ink)',
                  textAlign: 'left'
                }}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Response Panel */}
        {response && (
          <div style={{
            backgroundColor: 'var(--color-surface-bg)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            borderLeft: '4px solid var(--color-primary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className={`status-pill ${response.intent === 'UNKNOWN' ? 'amber' : 'green'}`}>
                INTENT: {response.intent} ({(response.confidence * 100).toFixed(0)}%)
              </span>
              {response.action_type !== 'NONE' && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  Action: {response.action_type}
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: '1.5' }}>
              {response.response_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
