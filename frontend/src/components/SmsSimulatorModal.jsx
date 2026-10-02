import React, { useState } from 'react';
import { Smartphone, Send, Monitor, X, Check, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export default function SmsSimulatorModal() {
  const { showSmsSimulator, setShowSmsSimulator } = useApp();
  const [activeTab, setActiveTab] = useState('sms'); // 'sms' | 'kiosk'
  const [phone, setPhone] = useState('+919876543210');
  const [message, setMessage] = useState('COMPLAINT Leaking tap in room 302 since 9 days');
  const [smsHistory, setSmsHistory] = useState([
    {
      direction: 'inbound',
      sender: '+919876543210',
      text: 'MENU TODAY',
      time: '12:00 PM'
    },
    {
      direction: 'outbound',
      sender: 'BPUT-OS',
      text: 'BPUT-OS Today\'s Mess: Lunch: Steamed Rice, Dalma, Paneer Curry | Dinner: Tawa Roti, Matar Paneer',
      time: '12:00 PM'
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Kiosk mode state
  const [kioskRoll, setKioskRoll] = useState('220101045');
  const [kioskStatusResult, setKioskStatusResult] = useState(null);

  if (!showSmsSimulator) return null;

  const handleSendSms = async (msgToSend) => {
    const text = msgToSend || message;
    if (!text.trim()) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      direction: 'inbound',
      sender: phone,
      text: text,
      time: nowStr
    };
    setSmsHistory(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.sendSmsWebhook(phone, text);
      const botMsg = {
        direction: 'outbound',
        sender: 'BPUT-OS',
        text: res.reply_message,
        time: nowStr,
        command: res.command_detected
      };
      setSmsHistory(prev => [...prev, botMsg]);
    } catch (e) {
      setSmsHistory(prev => [...prev, {
        direction: 'outbound',
        sender: 'BPUT-OS',
        text: `Error processing SMS: ${e.message}`,
        time: nowStr
      }]);
    } finally {
      setLoading(false);
      if (!msgToSend) setMessage('');
    }
  };

  const handleKioskCheck = async () => {
    setLoading(true);
    try {
      // Simulate kiosk calling the same SMS pipeline
      const res = await api.sendSmsWebhook(phone, 'ATTENDANCE');
      const menuRes = await api.sendSmsWebhook(phone, 'MENU TODAY');
      setKioskStatusResult({
        attendance: res.reply_message,
        menu: menuRes.reply_message
      });
    } catch (e) {
      setKioskStatusResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
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
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-neutral-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-ink)' }}>
              Accessibility Fallback Console (Section 10)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>
              No-Smartphone SMS Commands & Shared Common Kiosk
            </p>
          </div>
          <button onClick={() => setShowSmsSimulator(false)} style={{ background: 'transparent' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-neutral-light)' }}>
          <button
            onClick={() => setActiveTab('sms')}
            style={{
              flex: 1,
              padding: '12px',
              fontWeight: 600,
              fontSize: '14px',
              borderBottom: activeTab === 'sms' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'sms' ? 'var(--color-primary)' : 'var(--color-neutral-mid)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Smartphone size={16} /> 2G/3G SMS Webhook Simulator
          </button>
          <button
            onClick={() => setActiveTab('kiosk')}
            style={{
              flex: 1,
              padding: '12px',
              fontWeight: 600,
              fontSize: '14px',
              borderBottom: activeTab === 'kiosk' ? '3px solid var(--color-primary)' : 'none',
              color: activeTab === 'kiosk' ? 'var(--color-primary)' : 'var(--color-neutral-mid)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Monitor size={16} /> Common Area Tablet Kiosk
          </button>
        </div>

        {activeTab === 'sms' ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Quick format buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button
                onClick={() => handleSendSms('COMPLAINT Leaking tap in room 302 since 9 days')}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                COMPLAINT &lt;text&gt;
              </button>
              <button
                onClick={() => handleSendSms('ATTENDANCE')}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                ATTENDANCE
              </button>
              <button
                onClick={() => handleSendSms('MENU TODAY')}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                MENU TODAY
              </button>
              <button
                onClick={() => handleSendSms('STATUS 1')}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 10px' }}
              >
                STATUS &lt;id&gt;
              </button>
            </div>

            {/* Simulated Phone Screen */}
            <div style={{
              flex: 1,
              backgroundColor: '#1E293B',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '260px'
            }}>
              <div style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
                SMS Gateway Connected: /api/sms-webhook
              </div>
              {smsHistory.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: item.direction === 'inbound' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: item.direction === 'inbound' ? 'var(--color-primary)' : '#334155',
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}
                >
                  <div>{item.text}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, textAlign: 'right', marginTop: '4px' }}>
                    {item.time}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', color: '#94A3B8', fontSize: '12px' }}>
                  Processing SMS command over backend engine...
                </div>
              )}
            </div>

            {/* Input box */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendSms()}
                placeholder="Type SMS command (e.g. COMPLAINT, ATTENDANCE, MENU, STATUS)"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-neutral-light)',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={() => handleSendSms()}
                disabled={loading || !message.trim()}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFF',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', overflowY: 'auto' }}>
            <div style={{
              backgroundColor: 'var(--color-surface-bg)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              border: '2px dashed var(--color-neutral-mid)',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                Shared Common Area Kiosk Terminal (Hostel Lounge / Canteen)
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', marginBottom: '14px' }}>
                For residential students without smartphones, this touchscreen terminal uses biometric RFID or Roll Number verification to display attendance and submit tickets.
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={kioskRoll}
                  onChange={(e) => setKioskRoll(e.target.value)}
                  placeholder="Enter Student Roll No"
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-neutral-light)',
                    fontSize: '14px',
                    flex: 1
                  }}
                />
                <button
                  onClick={handleKioskCheck}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '10px 20px' }}
                >
                  Quick Scan
                </button>
              </div>
            </div>

            {kioskStatusResult && (
              <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-neutral-light)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                  Kiosk Summary Output
                </h5>
                <p style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <strong>Attendance:</strong> {kioskStatusResult.attendance}
                </p>
                <p style={{ fontSize: '13px' }}>
                  <strong>Dining:</strong> {kioskStatusResult.menu}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
