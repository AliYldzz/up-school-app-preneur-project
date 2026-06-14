import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import { supabase } from './supabaseClient';

const getDynamicQuestions = () => {
  return [
    {
      id: 'focus',
      title: 'Hangi Alana Odaklanacaksın?',
      subtitle: 'Yapay zeka planını buna göre şekillendirecek.',
      options: [
        { id: 'Sayısal', icon: '🧮', desc: 'Matematik & Fen ağırlıklı' },
        { id: 'Eşit Ağırlık', icon: '⚖️', desc: 'Matematik & Türkçe ağırlıklı' },
        { id: 'Sözel', icon: '📚', desc: 'Türkçe & Sosyal ağırlıklı' },
        { id: 'Dil', icon: '🌍', desc: 'Yabancı Dil ağırlıklı' }
      ]
    },
    {
      id: 'hours',
      title: 'Haftada kaç saat ayırabilirsin?',
      subtitle: 'Gerçekçi ol, planı ona göre bölelim.',
      options: [
        { id: '10', title: 'Sakin Tempo', icon: '🚶‍♂️', desc: 'Haftada ~10 Saat' },
        { id: '20', title: 'Dengeli Tempo', icon: '🏃‍♂️', desc: 'Haftada ~20 Saat' },
        { id: '35', title: 'Sınav Canavarı', icon: '🚀', desc: 'Haftada 35+ Saat' }
      ]
    },
    {
      id: 'weak_subject',
      title: 'Sana en çok çelme takan ders hangisi?',
      subtitle: "AI koçun programın %60'ını buraya odaklayacak.",
      options: [
        { id: 'Matematik', icon: '📐' },
        { id: 'Fizik', icon: '⚡' },
        { id: 'Kimya', icon: '🧪' },
        { id: 'Biyoloji', icon: '🧬' },
        { id: 'Türkçe', icon: '📖' },
        { id: 'Tarih', icon: '🏛️' }
      ]
    }
  ];
};

export default function Register({ onBack, onRegisterSuccess }) {
  const [step, setStep] = useState(0); // 0, 1, 2 = Questions, 3 = Profile Pic, 4 = Form, 5 = AI
  const [animatingStep, setAnimatingStep] = useState(0);
  const [isAILoading, setIsAILoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const [answers, setAnswers] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAnimatingStep(step);
  }, [step]);

  const questions = getDynamicQuestions();

  const handleOptionClick = (questionId, optionId) => {
    if (questionId === 'weak_subject') {
      setAnswers(prev => {
        const current = prev.weak_subjects || [];
        if (current.includes(optionId)) {
          return { ...prev, weak_subjects: current.filter(id => id !== optionId) };
        }
        return { ...prev, weak_subjects: [...current, optionId] };
      });
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: optionId }));
      setTimeout(() => setStep(prev => prev + 1), 200);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const finalizeRegistration = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) return;

    setIsLoading(true);
    
    const payload = {
      email: formData.email,
      fullName: formData.fullName,
      password: formData.password,
      focus_area: answers.focus || 'Sayısal',
      target_goal: `Zayıf Dersler: ${(answers.weak_subjects || []).join(', ')}`,
      weekly_hours: `${answers.hours || '20'} Saat`,
      focus_time: 'Sabah 🌅',
      daily_goal_hours: parseInt(answers.hours || '20') / 7.0 || 4.0,
      profile_pic: profilePic
    };

    supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          fullName: formData.fullName,
        }
      }
    })
    .then(({ data: sbData, error: sbError }) => {
      if (sbError) throw sbError;
      
      const userId = sbData.user.id;
      const profileData = {
        id: userId,
        email: formData.email,
        fullName: formData.fullName,
        focus_area: answers.focus || 'Sayısal',
        target_goal: `Zayıf Dersler: ${(answers.weak_subjects || []).join(', ')}`,
        weekly_hours: `${answers.hours || '20'} Saat`,
        focus_time: 'Sabah 🌅',
        daily_goal_hours: parseInt(answers.hours || '20') / 7.0 || 4.0,
        profile_pic: profilePic
      };
      
      return supabase
        .from('users')
        .upsert(profileData)
        .then(({ error: upsertError }) => {
          if (upsertError) throw new Error(upsertError.message);
          return { sbData, userId };
        });
    })
    .then(({ sbData, userId }) => {
      const token = sbData.session?.access_token;
      if (token) {
        localStorage.setItem('token', token);
      }
      setIsAILoading(true);
      setStep(5); // AI Step
      
      const initialTasks = [
        { 
          user_id: userId,
          subject_name: 'MATEMATİK', 
          title: 'Türev - Limit İlişkisi Soru Çözümü',
          estimated_time: 90,
          status: 'completed'
        },
        { 
          user_id: userId,
          subject_name: 'FİZİK', 
          title: 'Modern Fizik: Fotoelektrik Olayı',
          estimated_time: 90,
          status: 'active'
        },
        { 
          user_id: userId,
          subject_name: 'TÜRKÇE', 
          title: 'Paragraf Anlam Bilgisi Denemesi',
          estimated_time: 60,
          status: 'pending'
        },
        { 
          user_id: userId,
          subject_name: 'BİYOLOJİ', 
          title: 'Hücresel Solunum Tekrar',
          estimated_time: 60,
          status: 'pending'
        }
      ];
      return supabase
        .from('tasks')
        .insert(initialTasks)
        .then(({ error: tasksError }) => {
          if (tasksError) throw new Error(tasksError.message);
        });
    })
    .then(() => {
      setTimeout(() => {
        setIsLoading(false);
        setIsAILoading(false);
        onRegisterSuccess(profilePic, formData.fullName, answers);
      }, 1500);
    })
    .catch((err) => {
      setIsLoading(false);
      setIsAILoading(false);
      alert(err.message || 'Kayıt sırasında bir hata oluştu.');
    });
  };


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getCardClass = (cardStepIndex) => {
    if (animatingStep === cardStepIndex) return 'slide-card slide-active';
    if (animatingStep > cardStepIndex) return 'slide-card slide-out-left';
    return 'slide-card slide-in-right';
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        {step < 5 && step > 0 && (
          <button onClick={() => setStep(step - 1)} style={styles.topBackButton}>
            ← Geri
          </button>
        )}
        {step === 0 && (
          <button onClick={() => onBack()} style={styles.topBackButton}>
            ← İptal
          </button>
        )}
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${(step / 5) * 100}%` }}></div>
        </div>
      </div>

      <div className="slide-card-container" style={styles.cardContainer}>
        
        {/* Step 0: Initial Form */}
        <div className={getCardClass(0)} style={{ position: animatingStep === 0 ? 'relative' : 'absolute', width: '100%' }}>
          <div style={styles.questionContainer}>
            <h2 style={styles.questionTitle}>Yolculuğa Başlıyoruz!</h2>
            <p style={styles.questionSubtitle}>Seni tanımak için temel bilgilerini gir.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (formData.fullName && formData.email && formData.password) {
                setStep(1);
              }
            }} style={styles.form}>
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
                Devam Et →
              </button>
            </form>
          </div>
        </div>

        {/* Steps 1 to 3: Question Cards */}
        {questions.map((q, index) => {
          const actualStep = index + 1; // 1, 2, 3
          return (
            <div
              key={q.id}
              className={getCardClass(actualStep)}
              style={{ position: animatingStep === actualStep ? 'relative' : 'absolute', width: '100%' }}
            >
              <div style={styles.questionContainer}>
                <h2 style={styles.questionTitle}>{q.title}</h2>
                <p style={styles.questionSubtitle}>{q.subtitle}</p>
                
                <div style={q.id === 'weak_subject' ? styles.gridList : styles.optionsList}>
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="onboarding-option"
                      onClick={() => handleOptionClick(q.id, opt.id)}
                      style={{
                        ...(q.id === 'weak_subject' 
                            ? ((answers.weak_subjects || []).includes(opt.id) ? styles.selectedOption : {})
                            : (answers[q.id] === opt.id ? styles.selectedOption : {})),
                        ...(q.id === 'weak_subject' ? styles.gridCard : {})
                      }}
                    >
                      <span style={styles.optionIcon}>{opt.icon}</span>
                      <div style={styles.optionTextContainer}>
                        <span style={styles.optionTitle}>{opt.title || opt.id}</span>
                        {opt.desc && <span style={styles.optionDesc}>{opt.desc}</span>}
                      </div>
                    </button>
                  ))}
                </div>
                {q.id === 'weak_subject' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      if ((answers.weak_subjects || []).length > 0) {
                        setStep(prev => prev + 1);
                      } else {
                        alert("Lütfen en az bir zayıf ders seçin.");
                      }
                    }} 
                    style={styles.registerButton}
                  >
                    Devam Et →
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Step 4: Profile Picture Upload and Finish */}
        <div
          className={getCardClass(4)}
          style={{ position: animatingStep === 4 ? 'relative' : 'absolute', width: '100%' }}
        >
          <div style={styles.questionContainer}>
            <h2 style={styles.questionTitle}>Profil Fotoğrafın</h2>
            <p style={styles.questionSubtitle}>Son adım! Bir fotoğraf seç ve planını oluşturalım.</p>

            <div style={styles.uploadContainer}>
              {profilePic ? (
                <img src={profilePic} alt="Profile preview" style={styles.profilePreview} />
              ) : (
                <div style={styles.uploadPlaceholder}>📸</div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="profileUpload"
              />
              <label htmlFor="profileUpload" style={styles.uploadButton}>
                {profilePic ? 'Fotoğrafı Değiştir' : 'Kamera / Fotoğraf Seç'}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
              <button
                type="button"
                style={styles.registerButton}
                onClick={finalizeRegistration}
                disabled={isLoading}
              >
                {isLoading ? 'Kaydediliyor...' : 'Planımı Oluştur ✨'}
              </button>
            </div>
          </div>
        </div>

        {/* Step 5: AI Magic Loading */}
        <div
          className={getCardClass(5)}
          style={{ position: animatingStep === 5 ? 'relative' : 'absolute', width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <div style={styles.questionContainer}>
            <div style={{ position: 'relative', margin: '20px 0' }}>
              <div className="pulse-indicator" style={{ width: '80px', height: '80px', backgroundColor: 'transparent', position: 'absolute', top: -10, left: -10, zIndex: 0 }}></div>
              <div style={{ width: '60px', height: '60px', borderRadius: '30px', backgroundColor: '#2ECC71', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative', boxShadow: '0 10px 25px rgba(46, 204, 113, 0.4)' }}>
                 <span style={{ fontSize: '30px' }}>✨</span>
              </div>
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#005D32', textAlign: 'center', margin: 0 }}>
              Senin İçin Harika Bir Plan Kuruyorum...
            </h2>
            <p style={{ color: '#4A5D4C', fontSize: '16px', textAlign: 'center', fontWeight: '500', maxWidth: '90%', lineHeight: '1.5' }}>
              Zayıf olduğun {(answers.weak_subjects || []).join(', ')} derslerini analiz edip sana özel o ilk programı çıkarıyorum. Lütfen bekle.
            </p>
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
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '24px',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    overflowX: 'hidden',
  },
  headerContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    marginTop: '24px'
  },
  topBackButton: {
    background: 'none',
    border: 'none',
    color: '#4A5D4C',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '0'
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#EBF0EC',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    transition: 'width 0.3s ease'
  },
  cardContainer: {
    width: '100%',
    padding: '32px 24px',
    display: 'flex',
    minHeight: '400px',
    backgroundColor: '#FFFFFF', 
    borderRadius: '28px',
    border: '1px solid #D5DDD6',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.03)',
  },
  questionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  questionTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1B2A1C',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  questionSubtitle: {
    fontSize: '14px',
    color: '#005D32',
    textAlign: 'center',
    margin: '0 0 32px 0',
    fontWeight: '600',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  gridList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    justifyContent: 'space-between',
    width: '100%'
  },
  gridCard: {
    width: '47%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '24px 12px'
  },
  selectedOption: {
    borderColor: '#2ECC71',
    backgroundColor: '#EBF5EC',
  },
  optionIcon: {
    fontSize: '28px',
    marginRight: '16px'
  },
  optionTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left'
  },
  optionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1B2A1C',
  },
  optionDesc: {
    fontSize: '12px',
    color: '#6C7E6E',
    marginTop: '4px'
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
    color: '#4A5D4C',
  },
  input: {
    backgroundColor: '#F3F6F4',
    borderRadius: '16px',
    border: '1px solid #D5DDD6',
    padding: '16px',
    fontSize: '16px',
    outline: 'none',
    width: '100%',
    color: '#1B2A1C',
  },
  registerButton: {
    backgroundColor: '#005D32',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '800',
    padding: '16px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '12px',
    boxShadow: '0 4px 14px rgba(0, 93, 50, 0.15)',
    width: '100%',
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
    backgroundColor: '#F3F6F4',
    border: '2px dashed #D5DDD6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px'
  },
  profilePreview: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    objectFit: 'cover',
    border: '4px solid #2ECC71',
  },
  uploadButton: {
    backgroundColor: '#EBF5FB',
    color: '#3498DB',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  }
};
