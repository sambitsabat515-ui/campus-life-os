import React, { useEffect, useState } from 'react';
import { User, LogOut, Globe, WifiOff, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

export default function StudentProfileScreen() {
  const { user, logout } = useAuth();
  const { language, setLanguage, lowBandwidthMode, toggleLowBandwidth, setShowSmsSimulator, setShowVoiceModal } = useApp();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    api.getStudentDashboard().then(data => setDashboard(data)).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '20px 16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Profile Header */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 20px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 800, margin: '0 auto 12px auto'
        }}>
          {user?.name?.[0]}
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-ink)' }}>
          {user?.name}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
          Roll: {user?.roll_no} • {user?.branch} (Year {user?.year})
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-neutral-mid)', marginTop: '2px' }}>
          {user?.hostel} • Room {user?.room}
        </p>
      </div>

      {/* Operational Stats Grid (Section 5.1 Pattern: CGPA/credits swapped for operational stats!) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: dashboard?.stats?.is_attendance_low ? 'var(--color-semantic-red)' : 'var(--color-semantic-green)' }}>
            {dashboard?.stats?.attendance_percentage || '78'}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700, marginTop: '4px' }}>
            ATTENDANCE %
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>
            {dashboard?.stats?.open_complaints ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700, marginTop: '4px' }}>
            OPEN COMPLAINTS
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-semantic-blue)' }}>
            {dashboard?.stats?.pending_requests ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700, marginTop: '4px' }}>
            PENDING REQUESTS
          </div>
        </div>
      </div>

      {/* Settings & Accessibility List */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '8px 16px', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
        {/* Language Selection */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--color-neutral-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Regional Language (i18n)</span>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', fontSize: '13px' }}
          >
            <option value="en">English (IN)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="or">ଓଡ଼ିଆ (Odia)</option>
          </select>
        </div>

        {/* Low-Bandwidth Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--color-neutral-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <WifiOff size={18} color="var(--color-primary)" />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Low-Bandwidth Mode (2G/3G)</span>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>Disables 3D models and heavy animations</div>
            </div>
          </div>
          <button
            onClick={toggleLowBandwidth}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: lowBandwidthMode ? 'var(--color-semantic-green)' : 'var(--color-surface-bg)',
              color: lowBandwidthMode ? '#FFF' : 'var(--color-neutral-mid)',
              border: '1px solid var(--color-neutral-light)'
            }}
          >
            {lowBandwidthMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* SMS Fallback Simulator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--color-neutral-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={18} color="var(--color-primary)" />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>SMS Fallback & Kiosk Simulator</span>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>Section 10 accessibility testbed</div>
            </div>
          </div>
          <button
            onClick={() => setShowSmsSimulator(true)}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Open Simulator
          </button>
        </div>

        {/* Voice Agent Test */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Multilingual Voice Agent</span>
          </div>
          <button
            onClick={() => setShowVoiceModal(true)}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Launch Mic
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="btn-secondary"
        style={{ width: '100%', color: 'var(--color-semantic-red)', borderColor: 'var(--color-semantic-red)' }}
      >
        <LogOut size={16} /> Log Out of Campus OS
      </button>
    </div>
  );
}
