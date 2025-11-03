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
  const [selectedLetter, setSelectedLetter] = useState(arabicLetters[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  const translations = {
    en: {
      title: 'Arabic Handwriting Practice',
      selectLetter: 'Select Letter',
      clear: 'Clear',
      save: 'Save',
      showGuide: 'Show Guide',
      hideGuide: 'Hide Guide',
      practice: 'Practice writing',
      close: 'Close'
    },
    ar: {
      title: 'ممارسة الكتابة العربية',
      selectLetter: 'اختر الحرف',
      clear: 'مسح',
      save: 'حفظ',
      showGuide: 'إظهار الدليل',
      hideGuide: 'إخفاء الدليل',
      practice: 'تدرب على الكتابة',
      close: 'إغلاق'
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context.strokeStyle = '#1f2937';
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      setCtx(context);

      // Draw guide letter
      if (showGuide) {
        drawGuideLetter(context);
      }
    }
  }, [selectedLetter, showGuide]);

  const drawGuideLetter = (context) => {
    context.save();
    context.font = 'bold 200px Arial';
    context.fillStyle = '#e5e7eb';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(selectedLetter.letter, 300, 225);
    context.restore();
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    playClickSound();
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (showGuide) {
      drawGuideLetter(ctx);
    }
  };

  const saveDrawing = () => {
    playSuccessSound();
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();

    // Save to localStorage
    const savedDrawings = JSON.parse(localStorage.getItem('mumayaz_handwriting') || '[]');
    savedDrawings.push({
      letter: selectedLetter.letter,
      drawing: dataURL,
      timestamp: Date.now()
    });
    localStorage.setItem('mumayaz_handwriting', JSON.stringify(savedDrawings));

    alert('Drawing saved!');
  };

  return (
    <motion.div
      className="handwriting-practice-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="handwriting-practice-modal"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="handwriting-practice-header">
          <h2>✍️ {t.title}</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="handwriting-practice-content">
          <div className="letter-selector">
            <h3>{t.selectLetter}</h3>
            <div className="letters-grid">
              {arabicLetters.map((item) => (
                <button
                  key={item.letter}
                  className={`letter-btn ${selectedLetter.letter === item.letter ? 'active' : ''}`}
                  onClick={() => {
                    playClickSound();
                    setSelectedLetter(item);
                    clearCanvas();
                  }}
                >
                  {item.letter}
                </button>
              ))}
            </div>
          </div>

          <div className="canvas-container">
            <div className="canvas-header">
              <h3>{selectedLetter.letter} - {selectedLetter.name}</h3>
              <button
                className="guide-toggle-btn"
                onClick={() => {
                  playClickSound();
                  setShowGuide(!showGuide);
                  clearCanvas();
                }}
              >
                {showGuide ? t.hideGuide : t.showGuide}
              </button>
            </div>

            <canvas
              ref={canvasRef}
              width={600}
              height={450}
              className="drawing-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />

            <div className="canvas-actions">
              <button className="clear-btn" onClick={clearCanvas}>
                🗑️ {t.clear}
              </button>
              <button className="save-btn" onClick={saveDrawing}>
                💾 {t.save}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ArabicHandwritingPractice;
