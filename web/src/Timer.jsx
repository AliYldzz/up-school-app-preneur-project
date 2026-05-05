import React, { useState, useEffect, useRef } from 'react';

const parseDurationToSeconds = (durationStr) => {
  if (!durationStr) return 0;
  const lowerStr = durationStr.toLowerCase();
  let minutes = 0;
  if (lowerStr.includes('sa')) {
    const hours = parseFloat(lowerStr.replace('sa', '').trim());
    if (!isNaN(hours)) minutes = hours * 60;
  } else if (lowerStr.includes('dk') || lowerStr.includes('dakika')) {
    const mins = parseFloat(lowerStr.replace('dk', '').replace('dakika', '').trim());
    if (!isNaN(mins)) minutes = mins;
  }
  return minutes * 60;
};

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function Timer({ task, onBack, onComplete }) {
  const initialSeconds = parseDurationToSeconds(task.timeRange || '25 Dk');
  
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (onComplete) {
      onComplete();
    } else {
      onBack();
    }
  };

  const handleExtend = () => {
    setTimeLeft(prev => prev + 300); // add 5 mins
  };

  const remainingPercentage = initialSeconds > 0 ? (timeLeft / initialSeconds) * 100 : 0;

  const handleBackFromTimer = () => {
    if (onBack) {
      onBack({ isPaused: !isRunning && timeLeft < initialSeconds });
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={handleBackFromTimer} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center', marginRight: '24px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#2ECC71">
            <path d="M19.48,13.03C19.48,13.03 19.48,13.03 19.48,13.03C19.48,17.15 16.13,20.5 12,20.5C7.87,20.5 4.52,17.15 4.52,13.03C4.52,10.05 6.07,7.24 8.61,5.65C8.95,5.44 9.38,5.63 9.49,6.01C9.8,7.11 10.37,8.08 11.13,8.84C11.52,9.23 12.16,9.08 12.35,8.56C12.8,7.3 12.87,5.92 12.56,4.64C12.45,4.19 12.83,3.78 13.29,3.87C16.92,4.61 19.48,8.55 19.48,13.03Z" />
          </svg>
          <h2 style={styles.headerTitle}>Odak Modu</h2>
        </div>
      </div>

      <div style={styles.content}>
        {/* Subject Card */}
        <div style={styles.subjectContainer}>
          <h1 style={styles.subjectTitle}>{task.subject?.toUpperCase()}</h1>
          <span style={styles.subtitle}>Derin odaklanma zamanı. Telefonunu uzaklaştır.</span>
        </div>

        {/* Timer Display */}
        <div style={styles.timerWrapper}>
          <div style={{
            ...styles.circleOuter,
            background: `conic-gradient(#3498DB ${remainingPercentage}%, #E2E8F0 ${remainingPercentage}%)`
          }}>
            <div style={styles.circleInner}>
              <span style={styles.timeText}>{formatTime(timeLeft)}</span>
              <span style={styles.statusText}>KALAN SÜRE</span>
            </div>
          </div>
        </div>

        {/* Quote Box */}
        <div style={styles.quoteBox}>
          <span style={styles.quoteText}>"Zorluklar, başarının değerini artıran süslerdir."</span>
        </div>

        <div style={styles.bottomControls}>
          {/* Primary Complete Button */}
          <button style={styles.completeButton} onClick={handleFinish}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Görevi Tamamla
          </button>

          {/* Secondary Controls */}
          <div style={styles.secondaryRow}>
            <button style={styles.secondaryButton} onClick={toggleTimer}>
              {isRunning ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1E293B">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1E293B">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
              {isRunning ? "Durdur" : "Başlat"}
            </button>

            <button style={styles.secondaryButton} onClick={handleExtend}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1E293B">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              Uzat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: '#F4F7F9',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 20px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1E293B',
    margin: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 24px',
  },
  subjectContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '10px',
    marginBottom: '40px',
  },
  subjectTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0284C7',
    margin: '0 0 8px 0',
    letterSpacing: '1px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#475569',
    textAlign: 'center',
  },
  timerWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  circleOuter: {
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: '256px',
    height: '256px',
    borderRadius: '50%',
    backgroundColor: '#F4F7F9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: '72px',
    fontWeight: '800',
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-2px',
    lineHeight: 1,
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: '4px',
  },
  quoteBox: {
    backgroundColor: '#FAFAFA',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '16px 24px',
    width: '100%',
    maxWidth: '400px',
    marginBottom: 'auto',
    textAlign: 'center',
  },
  quoteText: {
    fontStyle: 'italic',
    color: '#475569',
    fontSize: '14px',
    lineHeight: '20px',
  },
  bottomControls: {
    width: '100%',
    maxWidth: '400px',
    paddingBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  completeButton: {
    backgroundColor: '#2ECC71',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 4px 8px rgba(46, 204, 113, 0.3)',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  secondaryRow: {
    display: 'flex',
    gap: '16px',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#1E293B',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default Timer;
