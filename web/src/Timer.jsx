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

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [solvedInput, setSolvedInput] = useState('');
  const [correctInput, setCorrectInput] = useState('');
  const [wrongInput, setWrongInput] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowStatsModal(true);
  };

  const handleSaveStats = () => {
    const solved = parseInt(solvedInput) || 0;
    const correct = parseInt(correctInput) || 0;
    const wrong = parseInt(wrongInput) || 0;

    if (solved < 0 || correct < 0 || wrong < 0) {
      setValidationError("Lütfen geçerli sayılar girin.");
      return;
    }

    if (correct + wrong > solved) {
      setValidationError("Doğru ve yanlış sayılarının toplamı çözülen soru sayısından fazla olamaz!");
      return;
    }

    setValidationError('');
    setShowStatsModal(false);

    if (onComplete) {
      onComplete({
        questions_solved: solved,
        questions_correct: correct,
        questions_wrong: wrong,
        actual_time: Math.round((initialSeconds - timeLeft) / 60)
      });
    }
  };

  const handleSkipStats = () => {
    setShowStatsModal(false);
    if (onComplete) {
      onComplete({
        questions_solved: 0,
        questions_correct: 0,
        questions_wrong: 0,
        actual_time: Math.round((initialSeconds - timeLeft) / 60)
      });
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B2A1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            background: `conic-gradient(#3498DB ${remainingPercentage}%, #EBF0EC ${remainingPercentage}%)`
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1B2A1C">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1B2A1C">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
              {isRunning ? "Durdur" : "Başlat"}
            </button>

            <button style={styles.secondaryButton} onClick={handleExtend}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1B2A1C">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              Uzat
            </button>
          </div>
        </div>

      </div>

      {showStatsModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Çalışma Özeti 📊</h3>
            <p style={styles.modalSubtitle}>Bu çalışma oturumunda çözdüğün soru sayılarını kaydedelim.</p>
            
            {validationError && (
              <div style={styles.errorText}>⚠️ {validationError}</div>
            )}

            <div style={styles.modalInputGroup}>
              <label style={styles.modalLabel}>Toplam Çözülen Soru</label>
              <input
                type="number"
                min="0"
                placeholder="Örn: 50"
                value={solvedInput}
                onChange={(e) => setSolvedInput(e.target.value)}
                style={styles.modalInput}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <div style={{ ...styles.modalInputGroup, flex: 1 }}>
                <label style={styles.modalLabel}>Doğru</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Örn: 40"
                  value={correctInput}
                  onChange={(e) => setCorrectInput(e.target.value)}
                  style={{ ...styles.modalInput, borderColor: '#2ECC71' }}
                />
              </div>
              <div style={{ ...styles.modalInputGroup, flex: 1 }}>
                <label style={styles.modalLabel}>Yanlış</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Örn: 10"
                  value={wrongInput}
                  onChange={(e) => setWrongInput(e.target.value)}
                  style={{ ...styles.modalInput, borderColor: '#FF9875' }}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={handleSkipStats} style={styles.modalCancelButton}>
                Atla
              </button>
              <button onClick={handleSaveStats} style={styles.modalConfirmButton}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: '#EBF0EC',
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
    color: '#1B2A1C',
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
    color: '#3498DB',
    margin: '0 0 8px 0',
    letterSpacing: '1px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#4A5D4C',
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
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: '72px',
    fontWeight: '800',
    color: '#1B2A1C',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-2px',
    lineHeight: 1,
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#3498DB',
    marginTop: '4px',
  },
  quoteBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #D5DDD6',
    borderRadius: '16px',
    padding: '16px 24px',
    width: '100%',
    maxWidth: '400px',
    marginBottom: 'auto',
    textAlign: 'center',
  },
  quoteText: {
    fontStyle: 'italic',
    color: '#4A5D4C',
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
    backgroundColor: '#005D32',
    borderRadius: '16px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 4px 8px rgba(0, 93, 50, 0.15)',
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
    border: '1px solid #D5DDD6',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#1B2A1C',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(27, 42, 28, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '340px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1B2A1C',
    margin: 0,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#6C7E6E',
    textAlign: 'center',
    margin: '0 0 4px 0',
    lineHeight: '1.4',
  },
  modalInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modalLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#4A5D4C',
  },
  modalInput: {
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #D5DDD6',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#F3F6F4',
    color: '#1B2A1C',
  },
  errorText: {
    color: '#EF4444',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #FEE2E2',
    textAlign: 'center',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  modalConfirmButton: {
    flex: 1.5,
    backgroundColor: '#005D32',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0, 93, 50, 0.15)',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#6C7E6E',
    border: '1px solid #D5DDD6',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default Timer;
