import React, { useState } from 'react';
import { API_BASE_URL } from './config';
import { supabase } from './supabaseClient';

export default function Login({ onLoginSuccess, onRegisterClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setIsLoading(true);

    supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }
      setIsLoading(false);
      localStorage.setItem('token', data.session.access_token);
      onLoginSuccess();
    })
    .catch((err) => {
      setIsLoading(false);
      setError(err.message || 'Hatalı e-posta veya şifre.');
    });
  };


  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <div style={styles.logoContainer}>
          <span style={styles.logoIcon}>🎓</span>
        </div>
        <h1 style={styles.title}>Sınav Yol Arkadaşım</h1>
        <p style={styles.subtitle}>Başarıya giden yolda ilk adımını at</p>
      </div>

      <div style={styles.formContainer}>
        {error && (
          <div style={styles.errorContainer}>
            <span style={styles.errorText}>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>E-posta</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>✉️</span>
              <input
                type="email"
                placeholder="ornek@ogrenci.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Şifre</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                style={styles.input}
              />
            </div>
            <div style={styles.forgotPasswordContainer}>
              <button type="button" style={styles.forgotPassword}>
                Şifremi Unuttum
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.loginButton,
              ...(isLoading ? styles.loginButtonDisabled : {})
            }}
          >
            {isLoading ? 'Giriş Yapılıyor...' : 'Hadi Başla!'}
          </button>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>veya</span>
            <div style={styles.dividerLine}></div>
          </div>

          <button type="button" style={styles.googleButton}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.png" alt="Google" style={styles.googleIcon} />
            Google ile Giriş Yap
          </button>
        </form>
      </div>

      <div style={styles.footerContainer}>
        <span style={styles.footerText}>Hesabın yok mu? </span>
        <button onClick={onRegisterClick} style={styles.registerButton}>Kayıt Ol</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    background: 'transparent',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '40px',
  },
  logoContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '24px',
    backgroundColor: '#FFFFFF', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    border: '2px solid #005D32',
    boxShadow: '0 8px 24px rgba(0, 93, 50, 0.08)',
  },
  logoIcon: {
    fontSize: '40px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#1B2A1C', 
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '15px',
    color: '#005D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    padding: '32px',
    backgroundColor: '#FFFFFF', 
    borderRadius: '28px',
    border: '1px solid #D5DDD6',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.03)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: '14px',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    color: '#4A5D4C',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    marginLeft: '4px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F3F6F4', 
    borderRadius: '16px',
    border: '1px solid #D5DDD6',
    padding: '0 16px',
    height: '56px',
    transition: 'border-color 0.2s',
  },
  inputIcon: {
    fontSize: '18px',
    marginRight: '12px',
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#1B2A1C',
    fontSize: '16px',
    height: '100%',
    outline: 'none',
  },
  forgotPasswordContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  registerLink: {
    background: 'transparent',
    border: 'none',
    color: '#005D32',
    fontSize: '13px',
    fontWeight: '600',
    padding: '4px 0',
    cursor: 'pointer',
  },
  forgotPassword: {
    background: 'transparent',
    border: 'none',
    color: '#3498DB',
    fontSize: '13px',
    fontWeight: '600',
    padding: '4px 0',
    cursor: 'pointer',
  },
  loginButton: {
    backgroundColor: '#005D32',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '700',
    height: '56px',
    borderRadius: '16px',
    border: 'none',
    marginTop: '8px',
    boxShadow: '0 4px 14px rgba(0, 93, 50, 0.15)',
  },
  loginButtonDisabled: {
    backgroundColor: '#CBE0D1',
    color: '#6C7E6E',
    boxShadow: 'none',
  },
  footerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '32px',
    gap: '8px',
  },
  footerText: {
    color: '#6C7E6E',
    fontSize: '14px',
  },
  registerButton: {
    background: 'transparent',
    border: 'none',
    color: '#3498DB',
    fontSize: '14px',
    fontWeight: '700',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#D5DDD6',
  },
  dividerText: {
    padding: '0 12px',
    color: '#6C7E6E',
    fontSize: '13px',
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    color: '#1B2A1C',
    fontSize: '15px',
    fontWeight: '600',
    height: '56px',
    borderRadius: '16px',
    border: '1px solid #D5DDD6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  googleIcon: {
    width: '20px',
    height: '20px',
  },
};
