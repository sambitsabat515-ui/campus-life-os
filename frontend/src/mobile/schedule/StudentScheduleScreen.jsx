import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { api } from '../../lib/api';

export default function StudentScheduleScreen() {
  const [activeDay, setActiveDay] = useState('Monday');
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    api.getSchedule().then(data => {
      setScheduleData(data);
    }).catch(err => console.error("Error loading schedule:", err))
    .finally(() => setLoading(false));
  }, []);

  const filteredSlots = scheduleData?.slots?.filter(s => s.day_of_week === activeDay) || [];

  return (
    <div style={{ padding: '20px 16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)' }}>
          Schedule & Attendance
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
          BPUT 75% Mandatory Policy & Academic Calendar
        </p>
      </div>

      {/* Attendance Summary Banner (Section 5.1 Pattern) */}
      {scheduleData?.attendance && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '24px',
          border: `1.5px solid ${scheduleData.attendance.is_overall_low ? 'var(--color-semantic-red)' : 'var(--color-neutral-light)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-neutral-mid)', textTransform: 'uppercase' }}>
                Overall Campus Attendance
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: scheduleData.attendance.is_overall_low ? 'var(--color-semantic-red)' : 'var(--color-semantic-green)' }}>
                {scheduleData.attendance.overall_percentage}%
              </div>
            </div>
            <span className={`status-pill ${scheduleData.attendance.is_overall_low ? 'red' : 'green'}`}>
              {scheduleData.attendance.is_overall_low ? 'SHORTAGE WARNING (<75%)' : 'ELIGIBLE'}
            </span>
          </div>

          {/* Subject-Wise Attendance Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scheduleData.attendance.subjects?.map((sub) => (
              <div key={sub.course_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface-bg)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    {sub.course_name} ({sub.course_id})
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>
                    Attended {sub.attended_classes} of {sub.total_classes} sessions
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-pill ${sub.is_low ? 'red' : 'green'}`} style={{ fontSize: '12px' }}>
                    {sub.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Strip Selector (Mon-Fri) */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        marginBottom: '20px',
        paddingBottom: '4px'
      }}>
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '13px',
              backgroundColor: activeDay === day ? 'var(--color-primary)' : '#FFFFFF',
              color: activeDay === day ? '#FFFFFF' : 'var(--color-ink)',
              border: '1px solid var(--color-neutral-light)',
              boxShadow: activeDay === day ? 'var(--shadow-sm)' : 'none',
              transition: 'all var(--transition-fast)'
            }}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Course / Time Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredSlots.length > 0 ? (
          filteredSlots.map((slot) => (
            <div
              key={slot.id}
              className="category-card cat-it"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700 }}>
                  {slot.course_id} • {slot.room}
                </span>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', marginTop: '2px' }}>
                  {slot.course_name}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--color-neutral-mid)', marginTop: '4px' }}>
                  Instructor: {slot.instructor_name}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="status-pill blue">
                  {slot.start_time} - {slot.end_time}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#FFF', borderRadius: 'var(--radius-md)', color: 'var(--color-neutral-mid)' }}>
            No lectures scheduled for {activeDay}.
          </div>
        )}
      </div>
    </div>
  );
}
