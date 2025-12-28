import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';
import './ArabicHandwritingPractice.css';

const arabicLetters = [
  { letter: 'أ', name: 'Alif' },
  { letter: 'ب', name: 'Baa' },
  { letter: 'ت', name: 'Taa' },
  { letter: 'ث', name: 'Thaa' },
  { letter: 'ج', name: 'Jeem' },
  { letter: 'ح', name: 'Haa' },
  { letter: 'خ', name: 'Khaa' },
  { letter: 'د', name: 'Dal' },
  { letter: 'ذ', name: 'Thal' },
  { letter: 'ر', name: 'Raa' },
  { letter: 'ز', name: 'Zay' },
  { letter: 'س', name: 'Seen' },
  { letter: 'ش', name: 'Sheen' },
  { letter: 'ص', name: 'Sad' },
  { letter: 'ض', name: 'Dad' },
  { letter: 'ط', name: 'Taa' },
  { letter: 'ظ', name: 'Dhaa' },
  { letter: 'ع', name: 'Ain' },
  { letter: 'غ', name: 'Ghain' },
  { letter: 'ف', name: 'Faa' },
  { letter: 'ق', name: 'Qaf' },
  { letter: 'ك', name: 'Kaf' },
  { letter: 'ل', name: 'Lam' },
  { letter: 'م', name: 'Meem' },
  { letter: 'ن', name: 'Noon' },
  { letter: 'ه', name: 'Haa' },
  { letter: 'و', name: 'Waw' },
  { letter: 'ي', name: 'Yaa' }
];

const ArabicHandwritingPractice = ({ onClose, language = 'en' }) => {
  const [level, setLevel] = useState(null); // 'beginner', 'intermediate', 'advanced'
  const [mode, setMode] = useState('trace'); // 'trace', 'free', 'timed'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [brushColor, setBrushColor] = useState('#8b5cf6');
  const [brushSize, setBrushSize] = useState(5);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [completedLetters, setCompletedLetters] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const selectedLetter = arabicLetters[currentIndex];

  const translations = {
    en: {
      title: 'Arabic Handwriting',
      selectLevel: 'Select Your Level',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      beginnerDesc: 'Learn basic letters with guides',
      intermediateDesc: 'Practice without strong guides',
      advancedDesc: 'Timed challenges and free drawing',
      selectMode: 'Select Practice Mode',
      traceMode: 'Trace Mode',
      freeMode: 'Free Draw',
      timedMode: 'Timed Challenge',
      traceModeDesc: 'Trace over guide letters',
      freeModeDesc: 'Draw letters freely',
      timedModeDesc: 'Race against time',
      instruction: 'Trace the letter with your finger or mouse',
      clear: 'Clear',
      previous: 'Previous',
      next: 'Next',
      done: 'Done!',
      letterProgress: 'Letter',
      of: 'of',
      score: 'Score:',
      time: 'Time:',
      brushColor: 'Color:',
      brushSize: 'Size:',
      close: 'Close',
      congratulations: 'Excellent!',
      completed: 'Letter Completed!'
    },
    ar: {
      title: 'ممارسة الكتابة',
      selectLevel: 'اختر مستواك',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم',
      beginnerDesc: 'تعلم الحروف الأساسية مع الأدلة',
      intermediateDesc: 'تمرن بدون أدلة قوية',
      advancedDesc: 'تحديات موقوتة ورسم حر',
      selectMode: 'اختر وضع التمرين',
      traceMode: 'وضع التتبع',
      freeMode: 'رسم حر',
      timedMode: 'تحدي الوقت',
      traceModeDesc: 'تتبع الحروف المرشدة',
      freeModeDesc: 'ارسم الحروف بحرية',
      timedModeDesc: 'سابق الزمن',
      instruction: 'ارسم الحرف بإصبعك أو الماوس',
      clear: 'مسح',
      previous: 'السابق',
      next: 'التالي',
      done: 'تم!',
      letterProgress: 'حرف',
      of: 'من',
      score: 'النقاط:',
      time: 'الوقت:',
      brushColor: 'اللون:',
      brushSize: 'الحجم:',
      close: 'إغلاق',
      congratulations: 'ممتاز!',
      completed: 'اكتمل الحرف!'
    }
  };

  const t = translations[language] || translations.en;

  // Level settings
  const levelSettings = {
    beginner: { guideOpacity: 0.3, showHints: true, timePerLetter: null },
    intermediate: { guideOpacity: 0.15, showHints: false, timePerLetter: null },
    advanced: { guideOpacity: 0, showHints: false, timePerLetter: 30 }
  };

  const currentSettings = level ? levelSettings[level] : levelSettings.beginner;

  const colors = [
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Pink', value: '#ec4899' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && level) {
      const context = canvas.getContext('2d');
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      setCtx(context);
      drawGuideLetter(context);

      // Initialize timer for timed mode
      if (mode === 'timed' && currentSettings.timePerLetter && timeLeft === null) {
        setTimeLeft(currentSettings.timePerLetter);
      }
    }
  }, [selectedLetter, brushColor, brushSize, level]);

  // Timer effect for advanced level in timed mode
  useEffect(() => {
    if (mode !== 'timed' || !level || timeLeft === null) return;

    if (timeLeft === 0) {
      handleNextLetter();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, mode, level]);

  const drawGuideLetter = (context) => {
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === 'trace' || mode === 'timed') {
      context.save();
      context.font = 'bold 350px Arial';
      context.fillStyle = `rgba(139, 92, 246, ${currentSettings.guideOpacity})`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(selectedLetter.letter, canvas.width / 2, canvas.height / 2);
      context.restore();
    }
  };

  const handleNextLetter = () => {
    playSuccessSound();
    if (!completedLetters.includes(currentIndex)) {
      setCompletedLetters([...completedLetters, currentIndex]);
      setScore(score + 10);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    goToNext();
  };

  const getCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    playClickSound();
    drawGuideLetter(ctx);
  };

  const goToPrevious = () => {
    playClickSound();
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    playClickSound();
    const nextIndex = Math.min(arabicLetters.length - 1, currentIndex + 1);
    setCurrentIndex(nextIndex);

    // Reset timer for timed mode
    if (mode === 'timed' && currentSettings.timePerLetter) {
      setTimeLeft(currentSettings.timePerLetter);
    }
  };

  // Level Selection Screen
  if (!level) {
    return (
      <motion.div
        className="handwriting-practice-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}
      >
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          ✍️ {t.selectLevel}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px', width: '100%', marginTop: '2rem' }}>
          {[
            { id: 'beginner', label: t.beginner, desc: t.beginnerDesc, emoji: '📝', color: '#10b981' },
            { id: 'intermediate', label: t.intermediate, desc: t.intermediateDesc, emoji: '✍️', color: '#f59e0b' },
            { id: 'advanced', label: t.advanced, desc: t.advancedDesc, emoji: '🏆', color: '#ef4444' }
          ].map((lvl, index) => (
            <motion.button
              key={lvl.id}
              onClick={() => {
                playClickSound();
                setLevel(lvl.id);
                if (lvl.id === 'advanced') setMode('timed');
                if (lvl.id === 'beginner') setMode('trace');
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '2rem',
                borderRadius: '20px',
                border: `3px solid ${lvl.color}`,
                background: `linear-gradient(135deg, ${lvl.color}20, ${lvl.color}40)`,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{lvl.emoji}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>{lvl.label}</div>
              <div style={{ fontSize: '1.1rem', opacity: 0.8 }}>{lvl.desc}</div>
            </motion.button>
          ))}
        </div>
        <motion.button
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: '3rem',
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            cursor: 'pointer',
            fontSize: '1.1rem'
          }}
        >
          ← {t.close}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="handwriting-practice-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="handwriting-practice-page"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="handwriting-practice-header">
          <div className="header-left">
            <button className="back-button" onClick={onClose}>
              ← {t.close}
            </button>
            <h2>✍️ {t.title}</h2>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">{t.score}</span>
              <span className="stat-value">{score}</span>
            </div>
            {mode === 'timed' && timeLeft !== null && (
              <div className="stat-item" style={{ color: timeLeft <= 5 ? '#ef4444' : 'inherit' }}>
                <span className="stat-label">{t.time}</span>
                <span className="stat-value">{timeLeft}s</span>
              </div>
            )}
          </div>
        </div>

        <div className="handwriting-practice-content">
          <div className="practice-main">
            {/* Letter Display */}
            <div className="letter-display">
              <div className="letter-showcase">
                <div className="letter-large">{selectedLetter.letter}</div>
                <div className="letter-name">{selectedLetter.name}</div>
              </div>
              <div className="progress-indicator">
                {t.letterProgress} {currentIndex + 1} {t.of} {arabicLetters.length}
              </div>
            </div>

            {/* Instruction */}
            <div className="practice-instruction">
              ✍️ {t.instruction}
            </div>

            {/* Canvas */}
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="drawing-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            {/* Color Palette */}
            <div className="color-controls" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: '600' }}>{t.brushColor}</span>
              {colors.map(color => (
                <button
                  key={color.value}
                  onClick={() => {
                    playClickSound();
                    setBrushColor(color.value);
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: color.value,
                    border: brushColor === color.value ? '4px solid white' : '2px solid rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    boxShadow: brushColor === color.value ? '0 4px 15px rgba(0,0,0,0.3)' : 'none',
                    transform: brushColor === color.value ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="practice-controls">
              <button
                className="control-btn nav-btn"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                ← {t.previous}
              </button>

              <button className="control-btn clear-btn-main" onClick={clearCanvas}>
                🗑️ {t.clear}
              </button>

              <button
                className="control-btn nav-btn"
                onClick={handleNextLetter}
                disabled={currentIndex === arabicLetters.length - 1}
              >
                {t.done} ✨
              </button>

              <button
                className="control-btn nav-btn"
                onClick={goToNext}
                disabled={currentIndex === arabicLetters.length - 1}
              >
                {t.next} →
              </button>
            </div>
          </div>
        </div>

        {/* Celebration Popup */}
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              padding: '2rem 3rem',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              zIndex: 1000,
              textAlign: 'center',
              color: 'white'
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{t.congratulations}</div>
            <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>+10 {t.score.replace(':', '')}</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ArabicHandwritingPractice;
