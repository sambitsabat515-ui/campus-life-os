import React, { useState } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CreateAccountScreen({ onBack, onLoginClick }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState(3);
  const [hostel, setHostel] = useState('Aryabhatta Hall');
  const [room, setRoom] = useState('302');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register({
        name,
        email,
        password,
        role: 'STUDENT',
        roll_no: rollNo,
        branch,
        year: Number(year),
        hostel,
        room,
        phone
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 20px',
      maxWidth: '440px',
      margin: '0 auto'
    }}>
      {/* Back Chevron */}
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          alignSelf: 'flex-start',
          color: 'var(--color-ink)',
          marginBottom: '20px'
        }}
      >
        <ChevronLeft size={24} />
      </button>

      {/* Centered Colored Title (Section 3 Pattern) */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '6px' }}>
          Create Account
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
          Register your student credentials on Campus OS
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="underline-input-group">
          <input
            type="text"
            className={`underline-input ${error ? 'has-error' : ''}`}
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="underline-input-group">
          <input
            type="email"
            className={`underline-input ${error ? 'has-error' : ''}`}
            placeholder="University Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="underline-input-group">
          <input
            type="password"
            className={`underline-input ${error ? 'has-error' : ''}`}
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="underline-input-group">
            <input
              type="text"
              className="underline-input"
              placeholder="Roll No (e.g. 220101045)"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </div>
          <div className="underline-input-group">
            <input
              type="tel"
              className="underline-input"
              placeholder="Mobile Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="underline-input-group">
            <input
              type="text"
              className="underline-input"
              placeholder="Hostel (e.g. Aryabhatta)"
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
            />
          </div>
          <div className="underline-input-group">
            <input
              type="text"
              className="underline-input"
              placeholder="Room (e.g. 302)"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
        </div>

        {error && <span className="inline-error-text" style={{ marginBottom: '16px' }}>{error}</span>}

        {/* Filled Primary "Continue" Button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ marginTop: '16px', marginBottom: '20px' }}
        >
          {loading ? 'Creating...' : 'Continue'} <ArrowRight size={18} />
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-neutral-mid)' }}>
        Already registered?{' '}
        <button
          type="button"
          onClick={onLoginClick}
          style={{ background: 'transparent', color: 'var(--color-primary)', fontWeight: 700 }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
