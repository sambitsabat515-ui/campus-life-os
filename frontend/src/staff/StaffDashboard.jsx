import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench, CheckCircle2, UserCheck, Shield, Clock, X, Plus, Trash2,
  Edit2, Save, Calendar, Users, AlertTriangle, ChevronDown, ChevronUp,
  RotateCcw, BookOpen, BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COURSE_OPTIONS = [
  { id: 'CS301', name: 'CS301 - Database Management Systems' },
  { id: 'CS302', name: 'CS302 - Computer Networks' },
  { id: 'CS303', name: 'CS303 - Operating Systems' },
  { id: 'CS304', name: 'CS304 - Algorithm Design' },
  { id: 'CS305', name: 'CS305 - Software Engineering' },
  { id: 'ME301', name: 'ME301 - Thermodynamics' },
  { id: 'EC301', name: 'EC301 - Digital Electronics' },
];

// ─── P/A Toggle Switch ───────────────────────────────────────────────────────
function PATog({ isPresent, onChange }) {
  return (
    <button
      onClick={onChange}
      title={isPresent ? 'Mark Absent' : 'Mark Present'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 14px',
        borderRadius: '20px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: '13px',
        letterSpacing: '0.5px',
        backgroundColor: isPresent ? 'var(--color-semantic-green)' : '#e55',
        color: '#fff',
        transition: 'background 0.2s',
        minWidth: '60px',
        justifyContent: 'center'
      }}
    >
      {isPresent ? 'P' : 'A'}
    </button>
  );
}

// ─── Gate Pass Escalation Badge ──────────────────────────────────────────────
function EscalationBadge({ chain = [] }) {
  const active = chain.find(s => s.status === 'ACTIVE');
  if (!active) return null;
  const colors = { STAFF: 'blue', HOD: 'amber', ADMIN: 'red' };
  const cls = colors[active.role] || 'blue';
  return (
    <span className={`status-pill ${cls}`} style={{ fontSize: '10px' }}>
      ⬆ {active.role}
    </span>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets');

  // Tickets
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [resolutionNote, setResolutionNote] = useState('');

  // Gate passes
  const [gatePasses, setGatePasses] = useState([]);

  // Attendance
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('CS302');
  const [markedDate, setMarkedDate] = useState(new Date().toISOString().split('T')[0]);
  const [perStudentStatus, setPerStudentStatus] = useState({}); // {studentId: 'PRESENT'|'ABSENT'}
  const [attCommitted, setAttCommitted] = useState(false);
  const [attChecked, setAttChecked] = useState(false);
  const [attLoading, setAttLoading] = useState(false);
  const [attSaving, setAttSaving] = useState(false);

  // Timetable
  const [slots, setSlots] = useState([]);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({
    course_id: 'CS301',
    course_name: 'Database Management Systems',
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    room: 'LH-1',
    instructor_name: user?.name || '',
    batch: 'CSE-2023'
  });
  const [slotLoading, setSlotLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [tList, gpList, sList, slotList] = await Promise.all([
        api.getStaffTickets(),
        api.getStaffGatePassQueue(),
        api.getStaffStudents(),
        api.getTimetableSlots()
      ]);
      setTickets(tList);
      setGatePasses(gpList);
      setSlots(slotList);

      // Init per-student status: default all PRESENT
      const statusMap = {};
      (sList || []).forEach(s => { statusMap[s.id] = 'PRESENT'; });
      setStudents(sList || []);
      setPerStudentStatus(statusMap);
    } catch (e) {
      console.error('Staff load error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Attendance: check if already committed when course/date changes ──────────
  const checkAttendance = useCallback(async () => {
    if (!selectedCourse || !markedDate) return;
    setAttLoading(true);
    setAttChecked(false);
    try {
      const res = await api.checkAttendanceCommitted(selectedCourse, markedDate);
      setAttCommitted(res.committed);
      if (res.committed && res.records?.length > 0) {
        // Pre-fill toggle states from existing records
        const map = { ...perStudentStatus };
        res.records.forEach(r => { map[r.student_id] = r.status; });
        setPerStudentStatus(map);
      } else {
        // Reset all to PRESENT
        const map = {};
        students.forEach(s => { map[s.id] = 'PRESENT'; });
        setPerStudentStatus(map);
      }
    } catch {
      setAttCommitted(false);
    } finally {
      setAttLoading(false);
      setAttChecked(true);
    }
  }, [selectedCourse, markedDate, students]);

  useEffect(() => {
    if (students.length > 0) checkAttendance();
  }, [selectedCourse, markedDate, students.length]);

  const toggleStudentStatus = (sId) => {
    setPerStudentStatus(prev => ({
      ...prev,
      [sId]: prev[sId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const markAllPresent = () => {
    const map = {};
    students.forEach(s => { map[s.id] = 'PRESENT'; });
    setPerStudentStatus(map);
  };

  const markAllAbsent = () => {
    const map = {};
    students.forEach(s => { map[s.id] = 'ABSENT'; });
    setPerStudentStatus(map);
  };

  const handleMarkAttendance = async () => {
    setAttSaving(true);
    try {
      const attendance = students.map(s => ({
        student_id: s.id,
        status: perStudentStatus[s.id] || 'ABSENT'
      }));
      await api.markAttendanceBulk({
        course_id: selectedCourse,
        session_date: markedDate,
        attendance
      });
      setAttCommitted(true);
      const p = attendance.filter(a => a.status === 'PRESENT').length;
      alert(`✅ Attendance committed!\n${p} Present / ${attendance.length - p} Absent for ${selectedCourse} on ${markedDate}.`);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setAttSaving(false);
    }
  };

  // ── Tickets ────────────────────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    try {
      await api.updateTicketStatus(selectedTicket.id, newStatus, resolutionNote);
      setSelectedTicket(null);
      setResolutionNote('');
      loadStaffData();
    } catch (e) {
      alert(e.message);
    }
  };

  // ── Gate Pass ──────────────────────────────────────────────────────────────
  const handleGatePassAction = async (gpId, action) => {
    const note = prompt(`Note for ${action}:`, `Verified by ${user?.name}`);
    if (note === null) return;
    try {
      await api.actOnGatePass(gpId, action, note);
      loadStaffData();
    } catch (e) {
      alert(e.message);
    }
  };

  // ── Timetable CRUD ────────────────────────────────────────────────────────
  const openNewSlot = () => {
    setEditingSlot(null);
    setSlotForm({
      course_id: 'CS301',
      course_name: 'Database Management Systems',
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '10:00',
      room: 'LH-1',
      instructor_name: user?.name || '',
      batch: 'CSE-2023'
    });
    setShowSlotForm(true);
  };

  const openEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotForm({
      course_id: slot.course_id,
      course_name: slot.course_name,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      room: slot.room,
      instructor_name: slot.instructor_name,
      batch: slot.batch
    });
    setShowSlotForm(true);
  };

  const handleSaveSlot = async () => {
    setSlotLoading(true);
    try {
      if (editingSlot) {
        await api.updateTimetableSlot(editingSlot.id, slotForm);
      } else {
        await api.createTimetableSlot(slotForm);
      }
      setShowSlotForm(false);
      const updated = await api.getTimetableSlots();
      setSlots(updated);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSlotLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Delete this timetable slot?')) return;
    try {
      await api.deleteTimetableSlot(slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const presentCount = students.filter(s => perStudentStatus[s.id] === 'PRESENT').length;
  const absentCount = students.length - presentCount;

  const tabStyle = (name) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: 'var(--radius-sm)',
    fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer',
    backgroundColor: activeTab === name ? 'var(--color-primary)' : 'var(--color-surface-bg)',
    color: activeTab === name ? '#fff' : 'var(--color-ink)',
  });

  const slotsByDay = DAYS.map(day => ({
    day,
    slots: slots.filter(s => s.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }));

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-neutral-mid)' }}>
      Loading staff portal…
    </div>
  );

  return (
    <div style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 'var(--radius-lg)',
        padding: '20px 24px', boxShadow: 'var(--shadow-md)',
        marginBottom: '20px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <span className="status-pill blue" style={{ marginBottom: '6px' }}>STAFF & WARDEN PORTAL</span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', margin: 0 }}>
            Welcome, {user?.name}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--color-neutral-mid)', marginTop: '2px' }}>
            {user?.hostel ? `Warden of ${user.hostel}` : `Faculty Proctor • ${user?.branch}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'OPEN TICKETS', val: tickets.filter(t => t.status !== 'RESOLVED').length, cls: 'var(--color-primary)' },
            { label: 'PENDING PASSES', val: gatePasses.filter(g => g.status === 'PENDING').length, cls: 'var(--color-semantic-amber)' },
            { label: 'STUDENTS', val: students.length, cls: 'var(--color-semantic-green)' },
          ].map(stat => (
            <div key={stat.label} style={{ padding: '10px 16px', backgroundColor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: stat.cls }}>{stat.val}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-neutral-mid)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('tickets')} style={tabStyle('tickets')}>
          <Wrench size={15} /> Maintenance ({tickets.length})
        </button>
        <button onClick={() => setActiveTab('gatepass')} style={tabStyle('gatepass')}>
          <Shield size={15} /> Gate Pass ({gatePasses.filter(g => g.status === 'PENDING').length})
        </button>
        <button onClick={() => setActiveTab('attendance')} style={tabStyle('attendance')}>
          <UserCheck size={15} /> Attendance
        </button>
        <button onClick={() => setActiveTab('timetable')} style={tabStyle('timetable')}>
          <Calendar size={15} /> Timetable
        </button>
      </div>

      {/* ══ TAB: TICKETS ══════════════════════════════════════════════════════ */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tickets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-neutral-mid)' }}>
              <CheckCircle2 size={32} /> <br />No assigned tickets
            </div>
          )}
          {tickets.map(t => {
            const isResolved = t.status === 'RESOLVED';
            return (
              <div key={t.id} className="category-card cat-plumbing"
                style={{ borderLeftColor: isResolved ? 'var(--color-semantic-green)' : 'var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700 }}>
                      #{t.id} · {t.category} · Room {t.room} ({t.place})
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '2px 0' }}>{t.title}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {t.ageing_bucket !== 'normal' && (
                      <span className={`status-pill ${t.ageing_bucket === '>72h' ? 'red' : 'amber'}`}>{t.ageing_bucket}</span>
                    )}
                    <span className={`status-pill ${isResolved ? 'green' : 'amber'}`}>{t.status}</span>
                    {!isResolved && (
                      <button onClick={() => { setSelectedTicket(t); setNewStatus('IN_PROGRESS'); }}
                        className="btn-primary" style={{ padding: '5px 10px', fontSize: '12px', width: 'auto' }}>
                        Update
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)' }}>{t.description}</p>
                <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  <strong>Latest:</strong> {t.audit_trails?.[t.audit_trails.length - 1]?.note || 'Filed by student'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ TAB: GATE PASS ════════════════════════════════════════════════════ */}
      {activeTab === 'gatepass' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(139,32,114,0.07)',
            border: '1px solid var(--color-primary)', fontSize: '13px'
          }}>
            <strong>⏱ Escalation Queue:</strong> Unactioned passes auto-escalate →
            <strong> Staff (30 min)</strong> → <strong>HOD (60 min)</strong> → <strong>Admin/Principal (90 min)</strong>
          </div>

          {gatePasses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-neutral-mid)' }}>
              No gate passes in queue
            </div>
          )}

          {gatePasses.map(gp => {
            let chain = [];
            try { chain = Array.isArray(gp.approver_chain) ? gp.approver_chain : JSON.parse(gp.approver_chain || '[]'); } catch {}
            return (
              <div key={gp.id} className="category-card cat-it">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700 }}>PASS #{gp.id}</span>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '2px 0' }}>To: {gp.destination}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>Reason: {gp.reason}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <EscalationBadge chain={chain} />
                    <span className={`status-pill ${gp.status === 'APPROVED' ? 'green' : gp.status === 'REJECTED' ? 'red' : 'amber'}`}>
                      {gp.status}
                    </span>
                  </div>
                </div>

                {/* Escalation chain timeline */}
                {chain.length > 0 && (
                  <div style={{ fontSize: '11px', display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {chain.map((step, i) => (
                      <span key={i} style={{
                        padding: '2px 8px', borderRadius: '10px',
                        backgroundColor: step.status === 'APPROVED' ? 'var(--color-semantic-green-bg)'
                          : step.status === 'ESCALATED' ? '#fff3cd'
                          : step.status === 'ACTIVE' ? 'rgba(139,32,114,0.1)'
                          : 'var(--color-surface-bg)',
                        color: step.status === 'APPROVED' ? 'var(--color-semantic-green)'
                          : step.status === 'ESCALATED' ? '#856404'
                          : 'var(--color-ink)',
                        border: '1px solid var(--color-neutral-light)'
                      }}>
                        {step.role}: {step.status}
                      </span>
                    ))}
                  </div>
                )}

                {gp.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => handleGatePassAction(gp.id, 'APPROVE')}
                      className="btn-primary"
                      style={{ padding: '7px 14px', fontSize: '12px', width: 'auto', backgroundColor: 'var(--color-semantic-green)' }}>
                      ✓ Approve
                    </button>
                    <button onClick={() => handleGatePassAction(gp.id, 'REJECT')}
                      className="btn-secondary"
                      style={{ padding: '7px 14px', fontSize: '12px', width: 'auto', color: 'var(--color-semantic-red)' }}>
                      ✕ Reject
                    </button>
                    <button onClick={async () => {
                      try {
                        const res = await api.escalateGatePass(gp.id);
                        alert(`⚡ Gate pass redirected to ${res.escalated_to} approval queue!`);
                        loadStaffData();
                      } catch (err) { alert(err.message); }
                    }}
                      className="btn-secondary"
                      style={{ padding: '7px 14px', fontSize: '12px', width: 'auto', color: 'var(--color-semantic-amber)', border: '1px solid var(--color-semantic-amber)' }}>
                      ⚡ Escalate Queue
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ TAB: ATTENDANCE ═══════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>
            Mark Class Attendance — Per Student P/A Toggle
          </h3>

          {/* Course + Date selectors */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--color-neutral-mid)' }}>COURSE</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', fontSize: '13px' }}>
                {COURSE_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--color-neutral-mid)' }}>DATE</label>
              <input type="date" value={markedDate} onChange={e => setMarkedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', fontSize: '13px' }} />
            </div>
          </div>

          {/* Already committed warning */}
          {attChecked && attCommitted && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '14px',
              backgroundColor: 'rgba(255,170,0,0.1)', border: '1.5px solid var(--color-semantic-amber)',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px'
            }}>
              <RotateCcw size={16} color="var(--color-semantic-amber)" />
              <span>Attendance already committed for this session. You can <strong>edit and re-submit</strong> below.</span>
            </div>
          )}

          {/* Summary + Bulk controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>
              <span style={{ color: 'var(--color-semantic-green)' }}>● {presentCount} Present</span>
              &nbsp;&nbsp;
              <span style={{ color: '#e55' }}>● {absentCount} Absent</span>
              &nbsp;
              <span style={{ color: 'var(--color-neutral-mid)' }}>/ {students.length} Total</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={markAllPresent} className="btn-secondary"
                style={{ fontSize: '11px', padding: '5px 10px', width: 'auto', color: 'var(--color-semantic-green)' }}>
                All P
              </button>
              <button onClick={markAllAbsent} className="btn-secondary"
                style={{ fontSize: '11px', padding: '5px 10px', width: 'auto', color: '#e55' }}>
                All A
              </button>
            </div>
          </div>

          {/* Student roster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '20px', maxHeight: '360px', overflowY: 'auto' }}>
            {attLoading && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-neutral-mid)', fontSize: '13px' }}>
                Checking session status…
              </div>
            )}
            {!attLoading && students.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-neutral-mid)' }}>
                No students found. Upload student data from Admin portal.
              </div>
            )}
            {!attLoading && students.map(st => {
              const isPresent = (perStudentStatus[st.id] || 'ABSENT') === 'PRESENT';
              return (
                <div key={st.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  backgroundColor: isPresent ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.05)',
                  border: `1.5px solid ${isPresent ? 'var(--color-semantic-green)' : '#e55'}`,
                  transition: 'all 0.2s'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{st.name}
                      {st.roll_no && <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-neutral-mid)', marginLeft: '8px' }}>({st.roll_no})</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>
                      {st.branch} {st.year && `• Year ${st.year}`} {st.hostel && `• ${st.hostel}`} {st.room && `Rm ${st.room}`}
                    </div>
                  </div>
                  <PATog isPresent={isPresent} onChange={() => toggleStudentStatus(st.id)} />
                </div>
              );
            })}
          </div>

          <button onClick={handleMarkAttendance} disabled={attSaving || students.length === 0} className="btn-primary"
            style={{ width: 'auto', padding: '12px 28px', fontSize: '14px' }}>
            {attSaving ? 'Saving…' : attCommitted ? '↺ Update Attendance' : `Commit Attendance (${presentCount}P / ${absentCount}A)`}
          </button>
        </div>
      )}

      {/* ══ TAB: TIMETABLE ════════════════════════════════════════════════════ */}
      {activeTab === 'timetable' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Class Timetable Management</h3>
            <button onClick={openNewSlot} className="btn-primary" style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} /> Add Slot
            </button>
          </div>

          {/* Day-wise grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {slotsByDay.map(({ day, slots: daySlots }) => (
              <div key={day} style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '10px', letterSpacing: '0.5px' }}>
                  {day.toUpperCase()} ({daySlots.length} slots)
                </div>
                {daySlots.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', paddingLeft: '4px' }}>No classes scheduled</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {daySlots.map(slot => (
                    <div key={slot.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--color-surface-bg)',
                      border: '1px solid var(--color-neutral-light)'
                    }}>
                      <div style={{ minWidth: '80px', fontSize: '12px', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {slot.start_time}–{slot.end_time}
                      </div>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{slot.course_id} — {slot.course_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>
                          Room {slot.room} · {slot.instructor_name} · {slot.batch}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEditSlot(slot)}
                          style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', cursor: 'pointer', background: '#fff' }}>
                          <Edit2 size={13} color="var(--color-primary)" />
                        </button>
                        <button onClick={() => handleDeleteSlot(slot.id)}
                          style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid #ffd', cursor: 'pointer', background: '#fff5f5' }}>
                          <Trash2 size={13} color="var(--color-semantic-red)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ MODAL: Ticket Status Update ═══════════════════════════════════════ */}
      {selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 800 }}>Update Ticket #{selectedTicket.id}</h3>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', marginBottom: '12px', fontSize: '14px' }}>
              <option value="ASSIGNED">ASSIGNED (Technician allocated)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Work underway)</option>
              <option value="RESOLVED">RESOLVED (Repairs completed)</option>
            </select>
            <input type="text" placeholder="Resolution note…" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }} />
            <button onClick={handleUpdateStatus} className="btn-primary">Save & Update Audit Trail</button>
          </div>
        </div>
      )}

      {/* ══ MODAL: Add/Edit Timetable Slot ════════════════════════════════════ */}
      {showSlotForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontWeight: 800 }}>{editingSlot ? 'Edit' : 'Add'} Timetable Slot</h3>
              <button onClick={() => setShowSlotForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {[
              { label: 'Course ID', key: 'course_id' },
              { label: 'Course Name', key: 'course_name' },
              { label: 'Room', key: 'room' },
              { label: 'Instructor', key: 'instructor_name' },
              { label: 'Batch', key: 'batch' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--color-neutral-mid)' }}>{f.label.toUpperCase()}</label>
                <input type="text" value={slotForm[f.key]} onChange={e => setSlotForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--color-neutral-mid)' }}>DAY</label>
                <select value={slotForm.day_of_week} onChange={e => setSlotForm(p => ({ ...p, day_of_week: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', fontSize: '13px' }}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '100px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--color-neutral-mid)' }}>START</label>
                <input type="time" value={slotForm.start_time} onChange={e => setSlotForm(p => ({ ...p, start_time: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1, minWidth: '100px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--color-neutral-mid)' }}>END</label>
                <input type="time" value={slotForm.end_time} onChange={e => setSlotForm(p => ({ ...p, end_time: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button onClick={handleSaveSlot} disabled={slotLoading} className="btn-primary" style={{ marginTop: '4px' }}>
              {slotLoading ? 'Saving…' : editingSlot ? '✓ Update Slot' : '+ Create Slot'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
