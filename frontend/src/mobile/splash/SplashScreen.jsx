import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 200);
          return 100;
        }
        return prev + 5;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'var(--color-primary)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '48px 24px 24px 24px',
      color: '#FFFFFF',
      zIndex: 9999
    }}>
      <div />

      {/* Centered Circular Logo Mark + App Name + Subtitle (Section 3) */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          fontWeight: 800,
          margin: '0 auto 24px auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
        }}>
          OS
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Campus Life OS
        </h1>
        <p style={{ fontSize: '14px', opacity: 0.9, fontWeight: 500 }}>
          BPUT Hackathon 2026 • Problem Statement 07
        </p>
      </div>

      {/* Footer & Thin Progress Bar (Section 3) */}
      <div style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', opacity: 0.7, marginBottom: '14px' }}>
          © 2026 BPUT Odisha • Unified Campus Automation
        </p>
        <div style={{
          width: '100%',
          height: '3px',
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#FFFFFF',
            transition: 'width 40ms linear'
          }} />
        </div>
      </div>
    </div>
  );
}
