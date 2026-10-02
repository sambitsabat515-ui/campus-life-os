import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, UserCheck, Shield, Clock, FileCheck, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'attendance' | 'gatepass'
  const [tickets, setTickets] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Update Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [resolutionNote, setResolutionNote] = useState('');

  // Attendance marking state
  const [selectedCourse, setSelectedCourse] = useState('CS302');
  const [markedDate, setMarkedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [tList, gpList, sList] = await Promise.all([
        api.getStaffTickets(),
        api.getStaffGatePassQueue(),
        api.getStaffStudents()
      ]);
      setTickets(tList);
      setGatePasses(gpList);
      setStudents(sList);
      setSelectedStudentIds(sList.map(s => s.id));
    } catch (e) {
      console.error("Staff load error:", e);
    } finally {
      setLoading(false);
    }
  };

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

  const handleGatePassAction = async (gpId, action) => {
    const note = prompt(`Enter note for ${action}:`, `Verified by ${user?.name}`);
    if (note === null) return;
    try {
      await api.actOnGatePass(gpId, action, note);
      loadStaffData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      await api.markAttendance({
        course_id: selectedCourse,
        session_date: markedDate,
        student_ids: selectedStudentIds,
        status: "PRESENT"
      });
      alert(`Attendance logged for ${selectedStudentIds.length} students in ${selectedCourse}.`);
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleStudentAttendance = (sId) => {
    setSelectedStudentIds(prev => prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]);
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span className="status-pill blue" style={{ marginBottom: '6px' }}>STAFF & WARDEN PORTAL</span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink)' }}>
            Welcome, {user?.name}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
            {user?.hostel ? `Warden of ${user.hostel}` : `Faculty Proctor • Department of ${user?.branch}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {tickets.filter(t => t.status !== 'RESOLVED').length}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-mid)' }}>OPEN TICKETS</div>
          </div>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-semantic-amber)' }}>
              {gatePasses.filter(gp => gp.status === 'PENDING').length}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-mid)' }}>PENDING PASSES</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-neutral-light)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('tickets')}
          className="btn-secondary"
          style={{
            backgroundColor: activeTab === 'tickets' ? 'var(--color-primary)' : '#FFF',
            color: activeTab === 'tickets' ? '#FFF' : 'var(--color-ink)',
            borderColor: activeTab === 'tickets' ? 'var(--color-primary)' : 'var(--color-neutral-light)'
          }}
        >
          <Wrench size={16} /> Maintenance Queue ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('gatepass')}
          className="btn-secondary"
          style={{
            backgroundColor: activeTab === 'gatepass' ? 'var(--color-primary)' : '#FFF',
            color: activeTab === 'gatepass' ? '#FFF' : 'var(--color-ink)',
            borderColor: activeTab === 'gatepass' ? 'var(--color-primary)' : 'var(--color-neutral-light)'
          }}
        >
          <Shield size={16} /> Gate Pass Authorizations ({gatePasses.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className="btn-secondary"
          style={{
            backgroundColor: activeTab === 'attendance' ? 'var(--color-primary)' : '#FFF',
            color: activeTab === 'attendance' ? '#FFF' : 'var(--color-ink)',
            borderColor: activeTab === 'attendance' ? 'var(--color-primary)' : 'var(--color-neutral-light)'
          }}
        >
          <UserCheck size={16} /> Mark Class Attendance
        </button>
      </div>

      {/* TAB 1: TICKETS QUEUE */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tickets.map((t) => {
            const isResolved = t.status === 'RESOLVED';
            return (
              <div key={t.id} className="category-card cat-plumbing" style={{ borderLeftColor: isResolved ? 'var(--color-semantic-green)' : 'var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700 }}>
                      TICKET #{t.id} • {t.category.toUpperCase()} • Room {t.room} ({t.place})
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px' }}>{t.title}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {t.ageing_bucket !== 'normal' && (
                      <span className={`status-pill ${t.ageing_bucket === '>72h' ? 'red' : 'amber'}`}>
                        {t.ageing_bucket}
                      </span>
                    )}
                    <span className={`status-pill ${isResolved ? 'green' : 'amber'}`}>
                      {t.status}
                    </span>
                    {!isResolved && (
                      <button
                        onClick={() => { setSelectedTicket(t); setNewStatus('IN_PROGRESS'); }}
                        className="btn-primary"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                      >
                        Update Status
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', marginBottom: '12px' }}>
                  {t.description}
                </p>

                {/* Audit trail */}
                <div style={{ backgroundColor: 'var(--color-surface-bg)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  <strong>Latest Note:</strong> {t.audit_trails?.[t.audit_trails.length - 1]?.note || 'Ticket filed by student'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: GATE PASS AUTHORIZATIONS */}
      {activeTab === 'gatepass' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {gatePasses.map((gp) => (
            <div key={gp.id} className="category-card cat-it">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700 }}>PASS #{gp.id}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>To: {gp.destination}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>Reason: {gp.reason}</div>
                </div>
                <span className={`status-pill ${gp.status === 'APPROVED' ? 'green' : gp.status === 'REJECTED' ? 'red' : 'amber'}`}>
                  {gp.status}
                </span>
              </div>

              {gp.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleGatePassAction(gp.id, 'APPROVE')}
                    className="btn-primary"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', backgroundColor: 'var(--color-semantic-green)' }}
                  >
                    ✓ Endorse & Approve
                  </button>
                  <button
                    onClick={() => handleGatePassAction(gp.id, 'REJECT')}
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', color: 'var(--color-semantic-red)' }}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ATTENDANCE MARKING */}
      {activeTab === 'attendance' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '14px' }}>
            Mark Class Attendance Session (Feeds Student Live % Directly)
          </h3>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Course:</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)' }}
              >
                <option value="CS301">CS301 - Database Management Systems</option>
                <option value="CS302">CS302 - Computer Networks</option>
                <option value="CS303">CS303 - Operating Systems</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Date:</label>
              <input
                type="date"
                value={markedDate}
                onChange={(e) => setMarkedDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)' }}
              />
            </div>
          </div>

          {/* Student Roster Checkbox List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {students.map((st) => (
              <div
                key={st.id}
                onClick={() => toggleStudentAttendance(st.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: selectedStudentIds.includes(st.id) ? 'var(--color-semantic-green-bg)' : 'var(--color-surface-bg)',
                  border: `1.5px solid ${selectedStudentIds.includes(st.id) ? 'var(--color-semantic-green)' : 'var(--color-neutral-light)'}`,
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{st.name} ({st.roll_no})</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>{st.branch} • {st.hostel} {st.room}</div>
                </div>
                <span className={`status-pill ${selectedStudentIds.includes(st.id) ? 'green' : 'amber'}`}>
                  {selectedStudentIds.includes(st.id) ? 'PRESENT' : 'ABSENT'}
                </span>
              </div>
            ))}
          </div>

          <button onClick={handleMarkAttendance} className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
            Commit Session Attendance ({selectedStudentIds.length} Present)
          </button>
        </div>
      )}

      {/* Modal: Update Ticket Status */}
      {selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Update #{selectedTicket.id}</h3>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'transparent' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>New Status:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)' }}
              >
                <option value="ASSIGNED">ASSIGNED (Technician allocated)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Work underway)</option>
                <option value="RESOLVED">RESOLVED (Repairs completed)</option>
              </select>
            </div>

            <div className="underline-input-group">
              <input
                type="text"
                className="underline-input"
                placeholder="Resolution note / Work order ID..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </div>

            <button onClick={handleUpdateStatus} className="btn-primary">
              Save Status & Update Audit Trail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
