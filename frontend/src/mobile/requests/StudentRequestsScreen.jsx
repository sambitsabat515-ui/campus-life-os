import React, { useState, useEffect } from 'react';
import { Shield, FileText, Plus, CheckCircle2, Clock, AlertCircle, X, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function StudentRequestsScreen() {
  const [activeTab, setActiveTab] = useState('gatepass'); // 'gatepass' | 'certificates'
  const [gatePasses, setGatePasses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Request Modals
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // Form states
  const [gpDestination, setGpDestination] = useState('');
  const [gpReason, setGpReason] = useState('');
  const [gpDeparture, setGpDeparture] = useState('');
  const [gpReturn, setGpReturn] = useState('');

  const [certType, setCertType] = useState('BONAFIDE');
  const [certPurpose, setCertPurpose] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [gps, certs] = await Promise.all([
        api.getGatePasses(),
        api.getCertificates()
      ]);
      setGatePasses(gps);
      setCertificates(certs);
    } catch (e) {
      console.error("Error loading requests:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGatePass = async (e) => {
    e.preventDefault();
    if (!gpDestination || !gpReason) return;
    try {
      const now = new Date();
      const depDate = gpDeparture ? new Date(gpDeparture) : new Date(now.getTime() + 24*3600*1000);
      const retDate = gpReturn ? new Date(gpReturn) : new Date(now.getTime() + 72*3600*1000);

      await api.createGatePass({
        destination: gpDestination,
        reason: gpReason,
        departure_time: depDate.toISOString(),
        expected_return: retDate.toISOString()
      });
      setShowGatePassModal(false);
      setGpDestination('');
      setGpReason('');
      loadRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCert = async (e) => {
    e.preventDefault();
    if (!certPurpose) return;
    try {
      await api.createCertificate({
        type: certType,
        purpose: certPurpose
      });
      setShowCertModal(false);
      setCertPurpose('');
      loadRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)' }}>
            Requests & Authorizations
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
            Multi-stage verified campus permission workflows
          </p>
        </div>
        <button
          onClick={() => activeTab === 'gatepass' ? setShowGatePassModal(true) : setShowCertModal(true)}
          className="btn-primary"
          style={{ width: 'auto', padding: '10px 16px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
        >
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--color-surface-bg)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('gatepass')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'gatepass' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'gatepass' ? 'var(--color-primary)' : 'var(--color-neutral-mid)',
            boxShadow: activeTab === 'gatepass' ? 'var(--shadow-sm)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Shield size={16} /> Gate Passes ({gatePasses.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'certificates' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'certificates' ? 'var(--color-primary)' : 'var(--color-neutral-mid)',
            boxShadow: activeTab === 'certificates' ? 'var(--shadow-sm)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <FileText size={16} /> Certificates ({certificates.length})
        </button>
      </div>

      {/* GATE PASS LIST WITH LIVE STEP TRACKER (requested -> approved -> ready) */}
      {activeTab === 'gatepass' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {gatePasses.map((gp) => {
            const isApproved = gp.status === 'APPROVED';
            const isOut = gp.status === 'OUT';
            const isRejected = gp.status === 'REJECTED';
            return (
              <div
                key={gp.id}
                className="category-card cat-plumbing"
                style={{
                  borderLeftColor: isRejected ? 'var(--color-semantic-red)' : isApproved || isOut ? 'var(--color-semantic-green)' : 'var(--color-primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700 }}>GATE PASS #{gp.id}</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-ink)' }}>
                      To: {gp.destination}
                    </h3>
                  </div>
                  <span className={`status-pill ${isApproved || isOut ? 'green' : isRejected ? 'red' : 'amber'}`}>
                    {gp.status}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', marginBottom: '14px' }}>
                  <strong>Reason:</strong> {gp.reason}
                </p>

                {/* Visible Step Tracker (requested -> approved -> ready) */}
                <div style={{
                  backgroundColor: 'var(--color-surface-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-mid)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Approval Chain Progress:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {gp.approver_chain?.map((step, sIdx) => {
                      const done = step.status === 'APPROVED' || step.status === 'COMPLETED';
                      const pending = step.status === 'PENDING' || step.status === 'ACTIVE';
                      return (
                        <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: done ? 'var(--color-semantic-green)' : pending ? 'var(--color-semantic-amber)' : 'var(--color-neutral-light)',
                            color: '#FFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '4px'
                          }}>
                            {done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)' }}>
                            {step.name || step.role?.toUpperCase()}
                          </div>
                          <div style={{ fontSize: '10px', color: done ? 'var(--color-semantic-green)' : 'var(--color-neutral-mid)' }}>
                            {step.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', textAlign: 'right' }}>
                  Departure: {new Date(gp.departure_time).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CERTIFICATES LIST */}
      {activeTab === 'certificates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {certificates.map((cert) => {
            const isReady = cert.status === 'READY';
            const isCollected = cert.status === 'COLLECTED';
            return (
              <div
                key={cert.id}
                className="category-card cat-it"
                style={{
                  borderLeftColor: isReady || isCollected ? 'var(--color-semantic-green)' : 'var(--color-primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700 }}>DOC #{cert.id}</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-ink)' }}>
                      {cert.type} Certificate
                    </h3>
                  </div>
                  <span className={`status-pill ${isReady || isCollected ? 'green' : 'amber'}`}>
                    {cert.status}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', marginBottom: '14px' }}>
                  <strong>Purpose:</strong> {cert.purpose}
                </p>

                {/* Step Tracker for Certificate */}
                <div style={{
                  backgroundColor: 'var(--color-surface-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-semantic-green)' }}>✓ Requested</span>
                    <span style={{ color: cert.status !== 'PENDING' ? 'var(--color-semantic-green)' : 'var(--color-neutral-mid)' }}>
                      {cert.status !== 'PENDING' ? '✓ Processing' : '○ Processing'}
                    </span>
                    <span style={{ color: isReady || isCollected ? 'var(--color-semantic-green)' : 'var(--color-neutral-mid)' }}>
                      {isReady || isCollected ? '✓ Ready Counter #2' : '○ Ready'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Gate Pass */}
      {showGatePassModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Apply for Gate Pass</h3>
              <button onClick={() => setShowGatePassModal(false)} style={{ background: 'transparent' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateGatePass}>
              <div className="underline-input-group">
                <input
                  type="text"
                  className="underline-input"
                  placeholder="Destination (e.g. Cuttack, Bhubaneswar, Home)"
                  value={gpDestination}
                  onChange={(e) => setGpDestination(e.target.value)}
                  required
                />
              </div>
              <div className="underline-input-group">
                <input
                  type="text"
                  className="underline-input"
                  placeholder="Reason for travel"
                  value={gpReason}
                  onChange={(e) => setGpReason(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                Submit to Faculty & Warden <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Certificate */}
      {showCertModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Request Official Certificate</h3>
              <button onClick={() => setShowCertModal(false)} style={{ background: 'transparent' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCert}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Certificate Type:</label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)' }}
                >
                  <option value="BONAFIDE">Bonafide Certificate</option>
                  <option value="TRANSCRIPT">Official Transcript</option>
                  <option value="MIGRATION">Migration Certificate</option>
                </select>
              </div>
              <div className="underline-input-group">
                <input
                  type="text"
                  className="underline-input"
                  placeholder="Purpose (e.g. Passport, Education Loan, Internship)"
                  value={certPurpose}
                  onChange={(e) => setCertPurpose(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                Submit for Academic Verification <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
