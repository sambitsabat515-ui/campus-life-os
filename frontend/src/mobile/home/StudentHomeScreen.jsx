import React, { useEffect, useState } from 'react';
import { Bell, Wrench, Shield, FileText, Compass, ChevronRight, AlertTriangle, Calendar } from 'lucide-react';
import AskCampusBar from '../../ask/AskCampusBar';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

export default function StudentHomeScreen({ onNavigate }) {
  const { user } = useAuth();
  const { t, lowBandwidthMode, toggleLowBandwidth, setShowSmsSimulator } = useApp();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getStudentDashboard();
      setDashboard(data);
    } catch (e) {
      console.error("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Top Bar with Title & Bell (Section 3 Pattern) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', fontWeight: 600 }}>
            {user?.hostel} • Room {user?.room}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-ink)' }}>
            Hello, {user?.name?.split(' ')[0]} 👋
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleLowBandwidth}
            title="Toggle Low-Bandwidth Mode (Section 10)"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: lowBandwidthMode ? 'var(--color-semantic-amber-bg)' : 'var(--color-surface-bg)',
              color: lowBandwidthMode ? 'var(--color-semantic-amber)' : 'var(--color-neutral-mid)',
              border: '1px solid var(--color-neutral-light)'
            }}
          >
            {lowBandwidthMode ? '⚡ 2G MODE' : 'NORMAL'}
          </button>
          <button
            onClick={() => onNavigate('/student/notices')}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: 'var(--color-surface-bg)',
              border: '1px solid var(--color-neutral-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bell size={18} color="var(--color-ink)" />
            {dashboard?.notices?.some(n => !n.is_read) && (
              <span style={{
                position: 'absolute', top: '8px', right: '8px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: 'var(--color-semantic-red)'
              }} />
            )}
          </button>
        </div>
      </div>

      {/* Attendance Shortage Alert Banner if < 75% (Problem Statement 07) */}
      {dashboard?.stats?.is_attendance_low && (
        <div style={{
          backgroundColor: 'var(--color-semantic-red-bg)',
          borderLeft: '4px solid var(--color-semantic-red)',
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <AlertTriangle size={20} color="var(--color-semantic-red)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: 'var(--color-semantic-red)' }}>
            <strong>Attendance Warning:</strong> Your overall attendance is {dashboard.stats.attendance_percentage}% (below 75% BPUT mandatory threshold). Review subject-wise shortages under Schedule.
          </div>
        </div>
      )}

      {/* Ask Campus Intent Box (Section 13) */}
      <AskCampusBar onActionTriggered={() => loadDashboard()} />

      {/* Quick Actions (Section 5.1 Pattern) */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '12px' }}>
          {t('quickActions')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <button
            onClick={() => onNavigate('/student/hostel')}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-neutral-light)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 8px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)' }}>Log Ticket</span>
          </button>

          <button
            onClick={() => onNavigate('/student/requests')}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-neutral-light)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 8px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-semantic-blue-bg)', color: 'var(--color-semantic-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)' }}>Gate Pass</span>
          </button>

          <button
            onClick={() => onNavigate('/student/requests')}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-neutral-light)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 8px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-semantic-green-bg)', color: 'var(--color-semantic-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-ink)' }}>Bonafide</span>
          </button>
        </div>
      </div>

      {/* 3D Campus Quest Banner */}
      <div
        onClick={() => onNavigate('/student/map')}
        style={{
          backgroundColor: '#1E1B4B',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={22} color="#38BDF8" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>3D Campus Quest Navigation</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Turn-by-turn route to Academic & Admin Block</div>
          </div>
        </div>
        <ChevronRight size={20} color="#38BDF8" />
      </div>

      {/* Today's Timetable Snippet (Section 5.1 Pattern) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>
            {t('todaysTimetable')}
          </h3>
          <button
            onClick={() => onNavigate('/student/schedule')}
            style={{ background: 'transparent', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700 }}
          >
            View All
          </button>
        </div>

        {dashboard?.timetable_today?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dashboard.timetable_today.map((slot) => (
              <div key={slot.id} className="category-card cat-it" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>
                    {slot.course_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>
                    {slot.instructor_name} • Room: {slot.room}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="status-pill blue">
                    {slot.start_time} - {slot.end_time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#FFF', borderRadius: 'var(--radius-md)', color: 'var(--color-neutral-mid)', fontSize: '13px' }}>
            No lectures scheduled for today.
          </div>
        )}
      </div>

      {/* Targeted Notices Feed (Section 5.1 Pattern) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>
            {t('targetedNotices')}
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>
            Filtered for Year {user?.year} • {user?.branch}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dashboard?.notices?.map((n) => (
            <div
              key={n.id}
              onClick={async () => {
                if (!n.is_read) {
                  await api.markNoticeRead(n.id);
                  loadDashboard();
                }
              }}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                border: '1px solid var(--color-neutral-light)',
                borderLeft: `4px solid ${n.priority === 'CRITICAL' ? 'var(--color-semantic-red)' : n.priority === 'URGENT' ? 'var(--color-semantic-amber)' : 'var(--color-primary)'}`,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className={`status-pill ${n.priority === 'CRITICAL' ? 'red' : n.priority === 'URGENT' ? 'amber' : 'blue'}`}>
                  {n.priority}
                </span>
                {!n.is_read && (
                  <span style={{ fontSize: '10px', color: 'var(--color-semantic-red)', fontWeight: 700 }}>
                    ● UNREAD
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '4px' }}>
                {n.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--color-neutral-mid)', lineHeight: '1.4' }}>
                {n.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
