import React, { useState, useEffect } from 'react';

const getDynamicQuestions = (answers) => {
  const targetOptions = {
    'Sayısal': ['Tıp Fakültesi', 'Mühendislik', 'Mimarlık', 'Diğer'],
    'Eşit Ağırlık': ['Hukuk', 'Psikoloji', 'İşletme ve İktisat', 'Diğer'],
    'Sözel': ['Öğretmenlik', 'Radyo ve Televizyon', 'Gastronomi', 'Diğer']
  };

  const selectedFocus = answers.focus || 'Sayısal';

  return [
    {
      id: 'focus',
      title: 'Hangi Alana Odaklanacaksın?',
      options: ['Sayısal', 'Eşit Ağırlık', 'Sözel']
    },
    {
      id: 'target',
      title: 'Hedefin Nedir?',
      options: targetOptions[selectedFocus] || targetOptions['Sayısal']
    },
    {
      id: 'hours',
      title: 'Haftalık Müsaitliğin?',
      options: ['10-20 Saat', '20-30 Saat', '30+ Saat']
    },
    {
      id: 'time',
      title: 'En Verimli Olduğun Vakit?',
      options: ['Sabah 🌅', 'Öğle ☀️', 'Akşam 🌙']
    }
  ];
};

export default function Register({ onBack, onRegisterSuccess }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [animatingStep, setAnimatingStep] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const [answers, setAnswers] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync actual step with animating step to trigger re-renders and animation classes
  useEffect(() => {
    setAnimatingStep(step);
  }, [step]);

  const questions = getDynamicQuestions(answers);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (formData.fullName && formData.email && formData.password) {
      nextStep();
    }
  };

  const nextStep = () => {
    setDirection('forward');
    // We update step directly. The UI uses animatingStep to determine active card
    setStep(prev => prev + 1);
  };

  const handleOptionClick = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));

    // If there are more questions, go to next question
    if (step < questions.length) {
      setTimeout(() => nextStep(), 150);
    } else {
      // If we just answered the last question, go to the profile pic step
      setTimeout(() => nextStep(), 150);
    }
  };

  const compressImage = (base64Str, maxWidth = 300, maxHeight = 300) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        compressImage(reader.result)
          .then((compressed) => {
            setProfilePic(compressed);
          })
          .catch((err) => {
            console.error("Görüntü sıkıştırılamadı:", err);
            setProfilePic(reader.result);
          });
      };
      reader.readAsDataURL(file);
    }
  };

  const finalizeRegistration = (skipped = false) => {
    setIsLoading(true);
    
    const finalPic = skipped ? null : profilePic;
    
    const payload = {
      email: formData.email,
      fullName: formData.fullName,
      password: formData.password,
      focus_area: answers.focus || 'Sayısal',
      target_goal: answers.target || 'İlk 5000',
      weekly_hours: answers.hours || '10-20 Saat',
      focus_time: answers.time || 'Sabah 🌅',
      profile_pic: finalPic
    };

    fetch('http://127.0.0.1:8000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Kayıt başarısız oldu.');
      }
      return data;
    })
    .then((data) => {
      setIsLoading(false);
      localStorage.setItem('token', data.access_token);
      onRegisterSuccess(finalPic, formData.fullName, answers);
    })
    .catch((err) => {
      setIsLoading(false);
      alert(err.message || 'Kayıt sırasında bir hata oluştu.');
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper function to get animation class
  const getCardClass = (cardStepIndex) => {
    if (animatingStep === cardStepIndex) return 'slide-card slide-active';
    if (animatingStep > cardStepIndex) return 'slide-card slide-out-left';
    return 'slide-card slide-in-right';
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h1 style={styles.title}>
          {animatingStep === 0 ? 'Hesap Oluştur' : 'Seni Tanıyalım'}
        </h1>
        <p style={styles.subtitle}>
          {animatingStep === 0
            ? 'Sınav yolculuğuna bugün başla'
            : animatingStep <= questions.length
              ? `Adım ${animatingStep} / ${questions.length}`
              : 'Son Dokunuş!'}
        </p>
      </div>

      <div className="glass-panel slide-card-container" style={styles.cardContainer}>

        {/* Step 0: Registration Form */}
        <div className={getCardClass(0)} style={{ position: animatingStep === 0 ? 'relative' : 'absolute', width: '100%' }}>
          <form onSubmit={handleRegisterSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Ad Soyad</label>
              <input
                type="text"
                name="fullName"
                placeholder="Örn: Mert Yılmaz"
                value={formData.fullName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

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

            <button type="submit" style={styles.registerButton}>
              Kayıt Ol ve İlerle
            </button>
          </form>
        </div>

        {/* Steps 1 to 4: Question Cards */}
        {questions.map((q, index) => {
          const cardStepIndex = index + 1;
          return (
            <div
              key={q.id}
              className={getCardClass(cardStepIndex)}
              style={{ position: animatingStep === cardStepIndex ? 'relative' : 'absolute' }}
            >
              <div style={styles.questionContainer}>
                <h2 style={styles.questionTitle}>{q.title}</h2>
                <div style={styles.optionsList}>
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="onboarding-option"
                      onClick={() => handleOptionClick(q.id, opt)}
                      disabled={isLoading}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {isLoading && cardStepIndex === questions.length && (
                  <p style={styles.loadingText}>Profilin hazırlanıyor...</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Step 5: Profile Picture Upload */}
        <div
          className={getCardClass(questions.length + 1)}
          style={{ position: animatingStep === questions.length + 1 ? 'relative' : 'absolute', width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <div style={styles.questionContainer}>
            <h2 style={styles.questionTitle}>Profil Fotoğrafın</h2>
            <p style={{ color: '#64748B', fontSize: '14px', textAlign: 'center' }}>Gülümse ve bir fotoğraf çek veya seç!</p>

            <div style={styles.uploadContainer}>
              {profilePic ? (
                <img src={profilePic} alt="Profile preview" style={styles.profilePreview} />
              ) : (
                <div style={styles.uploadPlaceholder}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleImageUpload}
                style={styles.fileInput}
                id="profileUpload"
              />
              <label htmlFor="profileUpload" style={styles.uploadButton}>
                {profilePic ? 'Fotoğrafı Değiştir' : 'Kamera / Fotoğraf Seç'}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
              <button
                type="button"
                style={{ ...styles.registerButton, backgroundColor: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0', marginTop: 0 }}
                onClick={() => finalizeRegistration(true)}
                disabled={isLoading}
              >
                Bu Adımı Atla
              </button>
              <button
                type="button"
                style={{
                  ...styles.registerButton,
                  marginTop: 0,
                  opacity: (!profilePic || isLoading) ? 0.5 : 1,
                  cursor: (!profilePic || isLoading) ? 'not-allowed' : 'pointer'
                }}
                onClick={() => finalizeRegistration(false)}
                disabled={!profilePic || isLoading}
              >
                {isLoading ? 'Hazırlanıyor...' : 'Uygulamaya Başla!'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {animatingStep === 0 && (
        <button onClick={onBack} style={styles.backButton}>
          Giriş Sayfasına Dön
        </button>
      )}
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
    background: 'transparent',
    overflowX: 'hidden',
  },
  headerContainer: {
    textAlign: 'center',
    marginBottom: '32px',
    height: '60px', // fixed height to prevent jumping
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#A7F3D0',
    fontWeight: '500',
  },
  cardContainer: {
    width: '100%',
    padding: '32px',
    minHeight: '350px', // keeps consistent height during transitions
    display: 'flex',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '12px',
    border: '1px solid #CBD5E1',
    padding: '12px 16px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
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
    transition: 'transform 0.1s',
    width: '100%',
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
  questionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '28px',
    width: '100%',
  },
  questionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FFFFFF',
    background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    textAlign: 'center',
    margin: 0,
    lineHeight: '1.4',
    padding: '16px 20px',
    borderRadius: '16px',
    width: '100%',
    boxShadow: '0 4px 10px rgba(30, 58, 138, 0.15)',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#3498DB',
    fontWeight: '600',
  },
  uploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
  },
  uploadPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    backgroundColor: '#F1F5F9',
    border: '2px dashed #CBD5E1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePreview: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    objectFit: 'cover',
    border: '4px solid #10B981',
    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    backgroundColor: '#E0F2FE',
    color: '#0284C7',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
};
