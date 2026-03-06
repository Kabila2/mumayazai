import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';
import './OnboardingTutorial.css';

const FONTS = [
  { label: 'OpenDyslexic', value: "'OpenDyslexic', sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Cairo', value: "'Cairo', sans-serif" },
  { label: 'System Default', value: 'system-ui, sans-serif' },
];

const OnboardingTutorial = ({ language = 'en', onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedFont, setSelectedFont] = useState(
    localStorage.getItem('mumayaz_font') || "'OpenDyslexic', sans-serif"
  );
  const [textSize, setTextSize] = useState(
    parseInt(localStorage.getItem('mumayaz_text_size') || '100', 10)
  );

  const handleFontChange = (fontValue) => {
    setSelectedFont(fontValue);
    localStorage.setItem('mumayaz_font', fontValue);
    document.documentElement.style.setProperty('--font-sans', fontValue);
  };

  const handleTextSizeChange = (delta) => {
    setTextSize(prev => {
      const next = Math.min(150, Math.max(80, prev + delta));
      localStorage.setItem('mumayaz_text_size', String(next));
      document.documentElement.style.fontSize = next + '%';
      return next;
    });
  };

  const translations = {
    en: {
      skip: 'Skip Tutorial',
      next: 'Next',
      back: 'Back',
      finish: 'Get Started!',
      steps: [
        {
          title: 'Welcome to Mumayaz!',
          description: 'Choose your preferred font and text size to get started.',
          icon: '👋',
          highlight: null
        },
        {
          title: 'Home Dashboard',
          description: 'Access all learning modules from the home screen. Choose what you want to learn today!',
          icon: '🏠',
          highlight: '.home-section'
        },
        {
          title: 'Navigation Menu',
          description: 'Use the navigation bar to quickly jump between different sections of the platform.',
          icon: '🧭',
          highlight: '.platform-nav'
        },
        {
          title: 'Learning Modules',
          description: 'We have interactive lessons for letters, colors, words, and sentences. Start with what interests you!',
          icon: '📚',
          highlight: '.learning-sections'
        },
        {
          title: 'Track Your Progress',
          description: 'View your achievements, points, and learning streak in the Progress Dashboard.',
          icon: '📊',
          highlight: '.progress-card'
        },
        {
          title: 'Smart Assistant',
          description: 'Need help? Ask our AI assistant anything about Arabic language learning!',
          icon: '🤖',
          highlight: '.chat-card'
        },
        {
          title: 'Settings & Profile',
          description: 'Customize your experience, manage your profile, and export your data from the settings.',
          icon: '⚙️',
          highlight: '.profile-settings-btn-with-text'
        }
      ]
    },
    ar: {
      skip: 'تخطي الدليل',
      next: 'التالي',
      back: 'السابق',
      finish: 'ابدأ الآن!',
      steps: [
        {
          title: 'مرحباً بك في ممتاز!',
          description: 'اختر الخط وحجم النص المناسب لك للبدء.',
          icon: '👋',
          highlight: null
        },
        {
          title: 'الصفحة الرئيسية',
          description: 'الوصول إلى جميع وحدات التعلم من الشاشة الرئيسية. اختر ما تريد تعلمه اليوم!',
          icon: '🏠',
          highlight: '.home-section'
        },
        {
          title: 'قائمة التنقل',
          description: 'استخدم شريط التنقل للانتقال السريع بين الأقسام المختلفة للمنصة.',
          icon: '🧭',
          highlight: '.platform-nav'
        },
        {
          title: 'وحدات التعلم',
          description: 'لدينا دروس تفاعلية للحروف والألوان والكلمات والجمل. ابدأ بما يثير اهتمامك!',
          icon: '📚',
          highlight: '.learning-sections'
        },
        {
          title: 'تتبع تقدمك',
          description: 'شاهد إنجازاتك ونقاطك وسلسلة التعلم في لوحة التقدم.',
          icon: '📊',
          highlight: '.progress-card'
        },
        {
          title: 'المساعد الذكي',
          description: 'بحاجة إلى مساعدة؟ اسأل مساعدنا الذكي أي شيء عن تعلم اللغة العربية!',
          icon: '🤖',
          highlight: '.chat-card'
        },
        {
          title: 'الإعدادات والملف الشخصي',
          description: 'خصص تجربتك، أدر ملفك الشخصي، وصدر بياناتك من الإعدادات.',
          icon: '⚙️',
          highlight: '.profile-settings-btn-with-text'
        }
      ]
    }
  };

  const t = translations[language] || translations.en;
  const steps = t.steps;
  const totalSteps = steps.length;

  useEffect(() => {
    // Highlight the current element
    const highlightSelector = steps[currentStep]?.highlight;
    if (highlightSelector) {
      const element = document.querySelector(highlightSelector);
      if (element) {
        element.classList.add('onboarding-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      // Remove highlight from all elements
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
      });
    };
  }, [currentStep, steps]);

  const handleNext = () => {
    playClickSound();
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    playClickSound();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    playClickSound();
    handleComplete();
  };

  const handleComplete = () => {
    playSuccessSound();
    localStorage.setItem('mumayaz_onboarding_completed', 'true');
    setIsVisible(false);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="onboarding-overlay" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          className="onboarding-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button className="onboarding-skip" onClick={handleSkip}>
            {t.skip}
          </button>

          <div className={`onboarding-content${currentStep === 0 ? ' onboarding-content--appearance' : ''}`}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="onboarding-icon">{steps[currentStep].icon}</div>
              <h2 className="onboarding-title">{steps[currentStep].title}</h2>
              <p className="onboarding-description">{steps[currentStep].description}</p>

              {currentStep === 0 && (
                <div className="onboarding-appearance">
                  <div className="onboarding-appearance-label">
                    {language === 'ar' ? 'الخط' : 'Font'}
                  </div>
                  <div className="onboarding-font-grid">
                    {FONTS.map(font => (
                      <button
                        key={font.value}
                        className={`onboarding-font-btn${selectedFont === font.value ? ' active' : ''}`}
                        onClick={() => handleFontChange(font.value)}
                      >
                        <span className="onboarding-font-name">{font.label}</span>
                        <span className="onboarding-font-preview" style={{ fontFamily: font.value }}>
                          أَبْجَد · Aa
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="onboarding-appearance-label" style={{ marginTop: '20px' }}>
                    {language === 'ar' ? 'حجم النص' : 'Text Size'}
                  </div>
                  <div className="onboarding-size-control">
                    <button
                      className="onboarding-size-btn"
                      onClick={() => handleTextSizeChange(-5)}
                      disabled={textSize <= 80}
                    >A-</button>
                    <div className="onboarding-size-bar-wrap">
                      <span className="onboarding-size-value">{textSize}%</span>
                      <div className="onboarding-size-bar">
                        <div
                          className="onboarding-size-fill"
                          style={{ width: `${((textSize - 80) / 70) * 100}%` }}
                        />
                      </div>
                    </div>
                    <button
                      className="onboarding-size-btn onboarding-size-btn--large"
                      onClick={() => handleTextSizeChange(5)}
                      disabled={textSize >= 150}
                    >A+</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <div className="onboarding-progress">
            <div className="progress-dots">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                  onClick={() => {
                    playClickSound();
                    setCurrentStep(index);
                  }}
                />
              ))}
            </div>
            <div className="progress-text">
              {currentStep + 1} / {totalSteps}
            </div>
          </div>

          <div className="onboarding-actions">
            {currentStep > 0 && (
              <button className="onboarding-btn secondary" onClick={handleBack}>
                {t.back}
              </button>
            )}
            <button className="onboarding-btn primary" onClick={handleNext}>
              {currentStep === totalSteps - 1 ? t.finish : t.next}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingTutorial;
