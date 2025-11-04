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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  const selectedLetter = arabicLetters[currentIndex];

  const translations = {
    en: {
      title: 'Arabic Handwriting',
      instruction: 'Trace the letter with your finger or mouse',
      clear: 'Clear',
      previous: 'Previous',
      next: 'Next',
      letterProgress: 'Letter',
      of: 'of',
      close: 'Close'
    },
    ar: {
      title: 'ممارسة الكتابة',
      instruction: 'ارسم الحرف بإصبعك أو الماوس',
      clear: 'مسح',
      previous: 'السابق',
      next: 'التالي',
      letterProgress: 'حرف',
      of: 'من',
      close: 'إغلاق'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context.strokeStyle = '#8b5cf6';
      context.lineWidth = 5;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      setCtx(context);
      drawGuideLetter(context);
    }
  }, [selectedLetter]);

  const drawGuideLetter = (context) => {
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.font = 'bold 350px Arial';
    context.fillStyle = 'rgba(139, 92, 246, 0.15)';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(selectedLetter.letter, canvas.width / 2, canvas.height / 2);
    context.restore();
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
    setCurrentIndex((prev) => Math.min(arabicLetters.length - 1, prev + 1));
  };

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
                onClick={goToNext}
                disabled={currentIndex === arabicLetters.length - 1}
              >
                {t.next} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArabicHandwritingPractice;
