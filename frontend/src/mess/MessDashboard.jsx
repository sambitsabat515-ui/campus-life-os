import React, { useState, useEffect } from 'react';
import { Utensils, Star, AlertTriangle, Plus, Users, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function MessDashboard() {
  const { user } = useAuth();
  const [halls, setHalls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Menu Item form
  const [selectedHallId, setSelectedHallId] = useState(1);
  const [mealType, setMealType] = useState('BREAKFAST');
  const [itemName, setItemName] = useState('');
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMessData();
  }, []);

  const loadMessData = async () => {
    setLoading(true);
    try {
      const [hList, aData] = await Promise.all([
        api.getMessHalls(),
        api.getMessAnalytics()
      ]);
      setHalls(hList);
      setAnalytics(aData);
    } catch (e) {
      console.error("Mess data error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!itemName) return;
    try {
      await api.addMenuItem({
        mess_hall_id: Number(selectedHallId),
        date: menuDate,
        meal_type: mealType,
        name: itemName
      });
      setItemName('');
      alert("Meal item published to student hostel portals!");
      loadMessData();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
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
          <span className="status-pill green" style={{ marginBottom: '6px' }}>MESS & DINING PORTAL</span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink)' }}>
            Mess Catering & Quality Operations
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
            Section 5.4 • Menu Publishing, Student Quality Ratings & Quantity Planning
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {analytics?.planned_attendance_forecast?.lunch || 425}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-mid)' }}>TODAY'S LUNCH HEADCOUNT</div>
          </div>
          <div style={{ padding: '12px 18px', backgroundColor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-semantic-red)' }}>
              {analytics?.flagged_low_rated_items?.length || 0}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-mid)' }}>FLAGGED LOW-RATED</div>
          </div>
        </div>
      </div>

      {/* Flagged Quality Alerts (Section 5.4) */}
      {analytics?.flagged_low_rated_items?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-semantic-red)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Low-Rated Quality Alerts (&lt; 3.0 Stars)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics.flagged_low_rated_items.map((item) => (
              <div key={item.id} style={{ backgroundColor: 'var(--color-semantic-red-bg)', border: '1px solid var(--color-semantic-red)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="status-pill red">{item.meal_type}</span>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>{item.name}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--color-neutral-mid)' }}>
                    Student Comments: {item.comments?.join(' • ') || 'Quality inspection triggered'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-semantic-red)' }}>
                    ★ {item.average_rating}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>{item.total_ratings} student reviews</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Menu Publisher Form & Today's Menu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Publish Menu Item */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px' }}>
            Publish Daily / Weekly Menu
          </h3>
          <form onSubmit={handleAddMenuItem}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Mess Hall:</label>
              <select
                value={selectedHallId}
                onChange={(e) => setSelectedHallId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)' }}
              >
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} ({h.hostel_id})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Meal Slot:</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)' }}
                >
                  <option value="BREAKFAST">BREAKFAST (07:30 - 09:30)</option>
                  <option value="LUNCH">LUNCH (12:30 - 14:30)</option>
                  <option value="SNACKS">SNACKS (17:00 - 18:30)</option>
                  <option value="DINNER">DINNER (20:00 - 22:00)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Serving Date:</label>
                <input
                  type="date"
                  value={menuDate}
                  onChange={(e) => setMenuDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-light)' }}
                />
              </div>
            </div>

            <div className="underline-input-group">
              <input
                type="text"
                className="underline-input"
                placeholder="Dish description (e.g. Rice, Dalma, Paneer Curry, Salad & Papad)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
              <Plus size={16} /> Add to Mess Menu Schedule
            </button>
          </form>
        </div>

        {/* Current Hall Menu Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800 }}>
            Published Today's Menu Breakdown
          </h3>
          {halls.map((h) => (
            <div key={h.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>
                {h.name}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {h.today_menu?.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <span className="status-pill green" style={{ fontSize: '10px' }}>{m.meal_type}</span>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{m.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>★ {m.average_rating || '4.0'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
