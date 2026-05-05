import React, { useState } from 'react';

export default function Register({ onBack, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    dailyGoal: '',
    weeklyHours: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock register
    setTimeout(() => {
      setIsLoading(false);
      onRegisterSuccess();
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h1 style={styles.title}>Hesap Oluştur</h1>
        <p style={styles.subtitle}>Sınav yolculuğuna bugün başla</p>
      </div>

      <div className="glass-panel" style={styles.formContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-posta</label>
            <input
              type="email"
              name="email"
              placeholder="ornek@ogrenci.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifre</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Günlük Soru Hedefi</label>
            <input
              type="number"
              name="dailyGoal"
              placeholder="Örn: 50"
              value={formData.dailyGoal}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Haftalık Müsaitlik (Saat)</label>
            <input
              type="number"
              name="weeklyHours"
              placeholder="Örn: 20"
              value={formData.weeklyHours}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} style={styles.registerButton}>
            {isLoading ? 'Kaydediliyor...' : 'Hesabımı Oluştur'}
          </button>
        </form>
      </div>

      <button onClick={onBack} style={styles.backButton}>
        Giriş Sayfasına Dön
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    backgroundColor: '#F0F4F8',
  },
  headerContainer: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#243B55',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#3498DB',
  },
  formContainer: {
    width: '100%',
    padding: '32px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#243B55',
  },
  input: {
    backgroundColor: '#F0F4F8',
    borderRadius: '12px',
    border: '1px solid #CBD5E1',
    padding: '12px 16px',
    fontSize: '16px',
    outline: 'none',
  },
  registerButton: {
    backgroundColor: '#2ECC71',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '700',
    padding: '16px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '12px',
    boxShadow: '0 4px 14px rgba(46, 204, 113, 0.4)',
  },
  backButton: {
    marginTop: '24px',
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
