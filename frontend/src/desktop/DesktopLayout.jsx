import React from 'react';
import { Home, FileText, Calendar, Building2, User, LogOut, Compass, Shield, Users, Utensils, Smartphone, Monitor } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function DesktopLayout({
  activeRoute,
  onNavigate,
  children
}) {
  const { user, logout, currentPortal, switchPortal, login } = useAuth();
  const { lowBandwidthMode, toggleLowBandwidth, language, setLanguage, setShowSmsSimulator, setShowVoiceModal } = useApp();

  const navItems = [
    { route: '/student/home', label: 'Home', icon: <Home size={18} /> },
    { route: '/student/requests', label: 'Requests', icon: <FileText size={18} /> },
    { route: '/student/schedule', label: 'Schedule & Attendance', icon: <Calendar size={18} /> },
    { route: '/student/hostel', label: 'Hostel & Mess', icon: <Building2 size={18} /> },
    { route: '/student/map', label: 'Campus Quest 3D', icon: <Compass size={18} /> },
    { route: '/student/profile', label: 'Profile', icon: <User size={18} /> }
  ];

  const handleQuickSwitch = async (roleKey) => {
    const cred = DEMO_CREDENTIALS[roleKey];
    try {
      await login(cred.email, cred.pass, roleKey);
      if (roleKey === 'STUDENT') onNavigate('/student/home');
    } catch (e) {
      console.error("Quick switch error:", e);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-surface-bg)' }}>
      {/* Desktop Sidebar (Section 2 Constraint 6) */}
      <aside style={{
        width: '260px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--color-neutral-light)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 800,
              boxShadow: 'var(--shadow-md)'
            }}>
              OS
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-ink)', lineHeight: '1.2' }}>
                Campus Life OS
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', fontWeight: 600 }}>
                BPUT Hackathon 2026
              </p>
            </div>
          </div>

          {/* Navigation Items (Student Portal) */}
          {user?.role === 'STUDENT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-mid)', textTransform: 'uppercase', marginBottom: '4px', paddingLeft: '8px' }}>
                STUDENT CONSOLE
              </div>
              {navItems.map((item) => {
                const isActive = activeRoute === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => onNavigate(item.route)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <span style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-neutral-mid)' }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Staff, Admin, or Mess Portals */}
          {user?.role !== 'STUDENT' && (
            <div style={{ padding: '12px', backgroundColor: 'var(--color-surface-bg)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                PORTAL: {user?.role}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)', marginTop: '2px' }}>
                Dedicated operational command suite
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel: Role switcher & User identity */}
        <div>
          {/* Judging Quick Switcher */}
          <div style={{
            backgroundColor: 'var(--color-surface-bg)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '16px',
            border: '1px solid var(--color-neutral-light)'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-neutral-mid)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Role Switch (Demo):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {['STUDENT', 'STAFF', 'ADMIN', 'MESS'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleQuickSwitch(role)}
                  style={{
                    fontSize: '10px',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: user?.role === role ? 'var(--color-primary)' : '#FFF',
                    color: user?.role === role ? '#FFF' : 'var(--color-ink)',
                    border: '1px solid var(--color-neutral-light)',
                    fontWeight: 700
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* User Card & Logout */}
          <div style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: 'var(--color-primary)', color: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, flexShrink: 0
              }}>
                {user?.name?.[0]}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-neutral-mid)' }}>
                  {user?.role}
                </div>
              </div>
            </div>

            <button onClick={logout} title="Log Out" style={{ background: 'transparent', color: 'var(--color-neutral-mid)' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Wide-Viewport Content Area */}
      <main style={{ flex: 1, minWidth: 0, paddingBottom: '60px' }}>
        {children}
      </main>
    </div>
  );
}
