import React from 'react';
import { Home, FileText, Calendar, Building2, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Static route/icon config — labels are resolved via t() inside the component
const TABS = [
  { route: '/student/home',     key: 'navHome',     icon: Home },
  { route: '/student/requests', key: 'navRequests', icon: FileText },
  { route: '/student/schedule', key: 'navSchedule', icon: Calendar },
  { route: '/student/hostel',   key: 'navHostel',   icon: Building2 },
  { route: '/student/profile',  key: 'navProfile',  icon: User },
];

export default function BottomTabBar({ activeRoute, onNavigate }) {
  const { t } = useApp();
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '68px',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #F0EDF6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 900,
      boxShadow: '0 -4px 20px rgba(139,32,114,0.07)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {TABS.map(({ route, key, icon: Icon }) => {
        const isActive = activeRoute === route;
        const label = t(key);
        return (
          <button
            key={route}
            onClick={() => onNavigate(route)}
            style={{
              flex: 1,
              height: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: 0,
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Active pill background behind icon */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '8px',
                width: '44px',
                height: '28px',
                borderRadius: '14px',
                backgroundColor: 'rgba(139,32,114,0.10)',
              }} />
            )}

            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
              color={isActive ? '#8B2072' : '#9CA3AF'}
              style={{ position: 'relative', zIndex: 1, transition: 'all 0.2s ease' }}
            />
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#8B2072' : '#9CA3AF',
              letterSpacing: '0.02em',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
