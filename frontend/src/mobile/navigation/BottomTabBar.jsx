import React from 'react';
import { Home, FileText, Calendar, Building2, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BottomTabBar({ activeRoute, onNavigate }) {
  const { t } = useApp();

  const tabs = [
    { route: '/student/home', label: t('navHome'), icon: <Home size={22} /> },
    { route: '/student/requests', label: t('navRequests'), icon: <FileText size={22} /> },
    { route: '/student/schedule', label: t('navSchedule'), icon: <Calendar size={22} /> },
    { route: '/student/hostel', label: t('navHostel'), icon: <Building2 size={22} /> },
    { route: '/student/profile', label: t('navProfile'), icon: <User size={22} /> }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--color-neutral-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 900,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.04)'
    }}>
      {tabs.map((tab) => {
        const isActive = activeRoute === tab.route;
        return (
          <button
            key={tab.route}
            onClick={() => onNavigate(tab.route)}
            style={{
              flex: 1,
              height: '100%',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? 'var(--color-primary)' : 'var(--color-neutral-mid)',
              position: 'relative',
              transition: 'color var(--transition-fast)'
            }}
          >
            {tab.icon}
            <span style={{
              fontSize: '11px',
              fontWeight: isActive ? 700 : 500,
              marginTop: '4px'
            }}>
              {tab.label}
            </span>

            {/* Active tab thin underline indicator (Section 3) */}
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: '32px',
                height: '3px',
                borderRadius: '2px 2px 0 0',
                backgroundColor: 'var(--color-primary)'
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
