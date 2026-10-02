import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function LoginScreen({ onRegisterClick }) {
  const { login } = useAuth();
  const { t } = useApp();

  const [identifier, setIdentifier] = useState('student@campus.edu');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please provide your university ID/email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (roleKey) => {
    const cred = DEMO_CREDENTIALS[roleKey];
    setIdentifier(cred.email);
    setPassword(cred.pass);
    setError('');
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '32px 24px',
      maxWidth: '440px',
      margin: '0 auto'
    }}>
      {/* Brand Mark & Title */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: 800,
          marginBottom: '20px',
          boxShadow: 'var(--shadow-md)'
        }}>
          OS
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
          {t('welcomeBack')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-neutral-mid)' }}>
          Sign in to access your unified campus services.
        </p>
      </div>

      {/* University SSO Button (Section 3 Pattern) */}
      <button
        onClick={() => fillQuickDemo('STUDENT')}
        className="btn-secondary"
        style={{ width: '100%', marginBottom: '24px', gap: '10px' }}
      >
        <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
        {t('ssoLogin')}
      </button>

      {/* Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        color: 'var(--color-neutral-mid)',
        fontSize: '12px',
        textTransform: 'uppercase'
      }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-neutral-light)' }} />
        <span>OR CREDENTIALS</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-neutral-light)' }} />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Underline Field 1: University ID / Roll */}
        <div className="underline-input-group">
          <input
            type="text"
            className={`underline-input ${error ? 'has-error' : ''}`}
            placeholder={t('universityId')}
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
          />
        </div>

        {/* Underline Field 2: Password with Eye Toggle */}
        <div className="underline-input-group">
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`underline-input ${error ? 'has-error' : ''}`}
              placeholder={t('password')}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              style={{ paddingRight: '36px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                color: 'var(--color-neutral-mid)'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <span className="inline-error-text">{error}</span>}
        </div>

        {/* Forgot Password Link */}
        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => alert("Password recovery: Contact Campus IT Helpdesk in Administrative Block.")}
            style={{ background: 'transparent', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600 }}
          >
            {t('forgotPassword')}
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ marginBottom: '24px' }}
        >
          {loading ? 'Authenticating...' : t('signIn')} <ArrowRight size={18} />
        </button>
      </form>

      {/* Demo Quick-Fill Selectors (For judging demonstration) */}
      <div style={{
        backgroundColor: 'var(--color-surface-bg)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-neutral-mid)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Hackathon Quick Role Switcher:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {Object.entries(DEMO_CREDENTIALS).map(([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => fillQuickDemo(key)}
              style={{
                fontSize: '11px',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-neutral-light)',
                backgroundColor: identifier === val.email ? 'var(--color-primary-light)' : '#FFF',
                color: identifier === val.email ? 'var(--color-primary)' : 'var(--color-ink)',
                fontWeight: 600,
                textAlign: 'left'
              }}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Account Link */}
      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
        {t('dontHaveAccount')}{' '}
        <button
          type="button"
          onClick={onRegisterClick}
          style={{ background: 'transparent', color: 'var(--color-primary)', fontWeight: 700 }}
        >
          {t('createAccount')}
        </button>
      </div>
    </div>
  );
}
