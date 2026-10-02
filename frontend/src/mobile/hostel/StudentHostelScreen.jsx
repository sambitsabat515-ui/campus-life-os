import React, { useState, useEffect } from 'react';
import { Wrench, Utensils, Plus, Star, History, Clock, CheckCircle2, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function StudentHostelScreen() {
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'mess'
  const [complaints, setComplaints] = useState([]);
  const [messHalls, setMessHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Complaint Modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [cat, setCat] = useState('Plumbing');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [room, setRoom] = useState('302');
  const [floor, setFloor] = useState('3rd Floor');

  // Mess Feedback Modal
  const [ratingItem, setRatingItem] = useState(null);
  const [starCount, setStarCount] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, halls] = await Promise.all([
        api.getStudentComplaints(),
        api.getMessHalls()
      ]);
      setComplaints(comps);
      setMessHalls(halls);
    } catch (e) {
      console.error("Error loading hostel data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!title || !desc) return;
    try {
      await api.createComplaint({
        category: cat,
        title,
        description: desc,
        place: "Aryabhatta Hall",
        room,
        floor
      });
      setShowComplaintModal(false);
      setTitle('');
      setDesc('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendFeedback = async () => {
    if (!ratingItem) return;
    try {
      await api.submitMessFeedback({
        menu_item_id: ratingItem.id,
        rating: starCount,
        tags: selectedTags,
        comment
      });
      setRatingItem(null);
      setComment('');
      setSelectedTags([]);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const tagOptions = ["cold", "too_salty", "fresh", "delicious", "delayed", "small_portion"];

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)' }}>
            Hostel Life & Dining
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
            Maintenance ticketing & daily mess catering
          </p>
        </div>
        {activeTab === 'complaints' && (
          <button
            onClick={() => setShowComplaintModal(true)}
            className="btn-primary"
            style={{ width: 'auto', padding: '10px 16px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
          >
            <Plus size={16} /> Log Issue
          </button>
        )}
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
          onClick={() => setActiveTab('complaints')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'complaints' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'complaints' ? 'var(--color-primary)' : 'var(--color-neutral-mid)',
            boxShadow: activeTab === 'complaints' ? 'var(--shadow-sm)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Wrench size={16} /> Complaints & Maintenance ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('mess')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'mess' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'mess' ? 'var(--color-primary)' : 'var(--color-neutral-mid)',
            boxShadow: activeTab === 'mess' ? 'var(--shadow-sm)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Utensils size={16} /> Mess Menu & Ratings
        </button>
      </div>

      {/* COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {complaints.map((c) => {
            const isResolved = c.status === 'RESOLVED';
            const catClass = c.category === 'Plumbing' ? 'cat-plumbing' : c.category === 'Electrical' ? 'cat-electrical' : 'cat-other';
            return (
              <div key={c.id} className={`category-card ${catClass}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 700 }}>
                      #{c.id} • {c.category.toUpperCase()} • Room {c.room}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-ink)', marginTop: '2px' }}>
                      {c.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {c.ageing_bucket !== 'normal' && (
                      <span className={`status-pill ${c.ageing_bucket === '>72h' ? 'red' : 'amber'}`}>
                        {c.ageing_bucket}
                      </span>
                    )}
                    <span className={`status-pill ${isResolved ? 'green' : 'amber'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)', marginBottom: '14px', lineHeight: '1.4' }}>
                  {c.description}
                </p>

                {/* Audit Trail Section */}
                <div style={{
                  backgroundColor: 'var(--color-surface-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-mid)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Status Audit Trail:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {c.audit_trails?.map((trail) => (
                      <div key={trail.id} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                        <Clock size={14} color="var(--color-neutral-mid)" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <strong>{trail.new_status}:</strong> {trail.note || 'Status transitioned'}
                          <div style={{ fontSize: '10px', color: 'var(--color-neutral-mid)' }}>
                            {new Date(trail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MESS MENU & RATINGS TAB */}
      {activeTab === 'mess' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messHalls.map((hall) => (
            <div key={hall.id}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '12px' }}>
                {hall.name} ({hall.hostel_id})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {hall.today_menu?.map((item) => (
                  <div key={item.id} className="category-card cat-mess">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="status-pill green">{item.meal_type}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: item.flagged_low ? 'var(--color-semantic-red)' : 'var(--color-ink)' }}>
                        <Star size={14} fill={item.flagged_low ? '#DC2626' : '#EAB308'} color="transparent" />
                        {item.average_rating || '4.0'} ({item.ratings_count})
                      </div>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>
                      {item.name}
                    </h4>

                    {item.flagged_low && (
                      <div style={{ fontSize: '11px', color: 'var(--color-semantic-red)', fontWeight: 700, marginBottom: '8px' }}>
                        ⚠️ Flagged for Mess Committee Review
                      </div>
                    )}

                    <button
                      onClick={() => setRatingItem(item)}
                      className="btn-secondary"
                      style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                    >
                      Rate / Give Feedback
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Complaint */}
      {showComplaintModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Report Maintenance Issue</h3>
              <button onClick={() => setShowComplaintModal(false)} style={{ background: 'transparent' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateComplaint}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Category:</label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)' }}
                >
                  <option value="Plumbing">Plumbing (Tap leak, flush, basin)</option>
                  <option value="Electrical">Electrical (Fan, light, spark)</option>
                  <option value="Cleanliness">Cleanliness (Waste, corridor)</option>
                  <option value="IT">IT & Wi-Fi</option>
                  <option value="Other">Other Estate Repairs</option>
                </select>
              </div>
              <div className="underline-input-group">
                <input
                  type="text"
                  className="underline-input"
                  placeholder="Problem Headline (e.g. Washbasin tap leaking for 9 days)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="underline-input-group">
                <textarea
                  className="underline-input"
                  placeholder="Detailed description of the issue..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="underline-input"
                  placeholder="Room No (e.g. 302)"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
                <input
                  type="text"
                  className="underline-input"
                  placeholder="Floor (e.g. 3rd Floor)"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                Dispatch to Maintenance Supervisor <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rate Meal */}
      {ratingItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Rate Meal: {ratingItem.name}</h3>
              <button onClick={() => setRatingItem(null)} style={{ background: 'transparent' }}><X size={20} /></button>
            </div>
            
            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '20px 0' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStarCount(s)}
                  style={{ background: 'transparent' }}
                >
                  <Star size={32} fill={s <= starCount ? '#EAB308' : '#D9D9D9'} color="transparent" />
                </button>
              ))}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Quality Tags:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tagOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    style={{
                      fontSize: '11px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-neutral-light)',
                      backgroundColor: selectedTags.includes(t) ? 'var(--color-primary)' : 'var(--color-surface-bg)',
                      color: selectedTags.includes(t) ? '#FFF' : 'var(--color-ink)',
                      fontWeight: 600
                    }}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="underline-input-group">
              <input
                type="text"
                className="underline-input"
                placeholder="Optional review note..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button onClick={handleSendFeedback} className="btn-primary" style={{ marginTop: '10px' }}>
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
