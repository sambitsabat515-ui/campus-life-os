import React, { useState } from 'react';
import { ShieldCheck, Zap, WifiOff, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function OnboardingScreen({ onFinish }) {
  const { t } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: <Zap size={56} style={{ color: 'var(--color-primary)' }} />,
      headline: t('slide1Title'),
      subtext: t('slide1Sub')
    },
    {
      icon: <ShieldCheck size={56} style={{ color: 'var(--color-primary)' }} />,
      headline: t('slide2Title'),
      subtext: t('slide2Sub')
    },
    {
      icon: <WifiOff size={56} style={{ color: 'var(--color-primary)' }} />,
      headline: t('slide3Title'),
      subtext: t('slide3Sub')
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '32px 24px',
      maxWidth: '480px',
      margin: '0 auto'
    }}>
      {/* Top Segmented Progress Bar (Section 3 Pattern) */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
        {slides.map((_, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: idx <= currentSlide ? 'var(--color-primary)' : 'var(--color-neutral-light)',
              transition: 'background-color var(--transition-normal)'
            }}
          />
        ))}
      </div>

      {/* Centered Illustration & Content */}
      <div style={{ textAlign: 'center', padding: '40px 10px' }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px auto'
        }}>
          {slides[currentSlide].icon}
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--color-ink)',
          marginBottom: '14px',
          lineHeight: '1.25'
        }}>
          {slides[currentSlide].headline}
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'var(--color-neutral-mid)',
          lineHeight: '1.5',
          maxWidth: '320px',
          margin: '0 auto'
        }}>
          {slides[currentSlide].subtext}
        </p>
      </div>

      {/* Bottom Actions */}
      <div>
        <button
          onClick={handleNext}
          className="btn-primary"
          style={{ marginBottom: '16px' }}
        >
          {currentSlide === slides.length - 1 ? t('getStarted') : t('next')} <ArrowRight size={18} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onFinish}
            style={{
              background: 'transparent',
              color: 'var(--color-primary)',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {t('skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
