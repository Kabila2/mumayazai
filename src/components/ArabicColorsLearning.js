import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './ArabicColorsLearning.css';
import { useVoiceOver } from '../hooks/useVoiceOver';
import CelebrationPopup from './CelebrationPopup';

const arabicColors = [
  {
    arabic: 'أحمر',
    english: 'Red',
    pronunciation: 'ahmar',
    hex: '#FF0000',
    objects: ['تفاحة', 'وردة', 'فراولة'],
    objectsEnglish: ['apple', 'rose', 'strawberry'],
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop'
  },
  {
    arabic: 'أزرق',
    english: 'Blue',
    pronunciation: 'azraq',
    hex: '#0000FF',
    objects: ['سماء', 'بحر', 'طائر'],
    objectsEnglish: ['sky', 'sea', 'bird'],
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=400&fit=crop'
  },
  {
    arabic: 'أخضر',
    english: 'Green',
    pronunciation: 'akhdar',
    hex: '#008000',
    objects: ['شجرة', 'عشب', 'خضار'],
    objectsEnglish: ['tree', 'grass', 'vegetables'],
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=400&fit=crop'
  },
  {
    arabic: 'أصفر',
    english: 'Yellow',
    pronunciation: 'asfar',
    hex: '#FFD700',
    objects: ['شمس', 'ليمون', 'موز'],
    objectsEnglish: ['sun', 'lemon', 'banana'],
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&h=400&fit=crop'
  },
  {
    arabic: 'بنفسجي',
    english: 'Purple',
    pronunciation: 'banafsaji',
    hex: '#800080',
    objects: ['عنب', 'زهرة', 'فراشة'],
    objectsEnglish: ['grapes', 'flower', 'butterfly'],
    image: 'https://images.unsplash.com/photo-1599819177073-49388c33375b?w=400&h=400&fit=crop'
  },
  {
    arabic: 'وردي',
    english: 'Pink',
    pronunciation: 'wardi',
    hex: '#FF69B4',
    objects: ['وردة', 'فستان', 'حلوى'],
    objectsEnglish: ['rose', 'dress', 'candy'],
    image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?w=400&h=400&fit=crop'
  },
  {
    arabic: 'برتقالي',
    english: 'Orange',
    pronunciation: 'burtuqali',
    hex: '#FF8C00',
    objects: ['برتقال', 'جزر', 'قرع'],
    objectsEnglish: ['orange', 'carrot', 'pumpkin'],
    image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=400&h=400&fit=crop'
  },
  {
    arabic: 'بني',
    english: 'Brown',
    pronunciation: 'bunni',
    hex: '#8B4513',
    objects: ['شجرة', 'شوكولاتة', 'أرض'],
    objectsEnglish: ['tree', 'chocolate', 'earth'],
    image: 'https://images.unsplash.com/photo-1606312619070-d48b4cbc5b52?w=400&h=400&fit=crop'
  },
  {
    arabic: 'أبيض',
    english: 'White',
    pronunciation: 'abyad',
    hex: '#FFFFFF',
    objects: ['ثلج', 'حليب', 'سحاب'],
    objectsEnglish: ['snow', 'milk', 'cloud'],
    image: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400&h=400&fit=crop'
  },
  {
    arabic: 'أسود',
    english: 'Black',
    pronunciation: 'aswad',
    hex: '#000000',
    objects: ['ليل', 'فحم', 'قط'],
    objectsEnglish: ['night', 'coal', 'cat'],
    image: 'https://images.unsplash.com/photo-1518176258769-f227c798150e?w=400&h=400&fit=crop'
  },
  {
    arabic: 'رمادي',
    english: 'Gray',
    pronunciation: 'ramadi',
    hex: '#808080',
    objects: ['سحاب', 'فيل', 'حجر'],
    objectsEnglish: ['cloud', 'elephant', 'stone'],
    image: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?w=400&h=400&fit=crop'
  },
  {
    arabic: 'ذهبي',
    english: 'Gold',
    pronunciation: 'dhahabi',
    hex: '#FFD700',
    objects: ['ذهب', 'تاج', 'شمس'],
    objectsEnglish: ['gold', 'crown', 'sun'],
    image: 'https://images.unsplash.com/photo-1610375461369-d8a76755f2b0?w=400&h=400&fit=crop'
  }
];

const ArabicColorsLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [viewedColors, setViewedColors] = useState([]);
  const containerRef = useRef(null);

  // Voice Over hook for accessibility
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  // Handle scroll indicator
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (container) {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Show scroll indicator if content is scrollable and not at bottom
        const isScrollable = scrollHeight > clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        setShowScrollIndicator(isScrollable && !isAtBottom);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Check initial state
      handleScroll();

      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Smooth scroll to bottom function
  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    // Scroll to top when a color is selected
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Show celebration if color is viewed for the first time
    if (!viewedColors.includes(color.english)) {
      setViewedColors([...viewedColors, color.english]);
      setShowCelebration(true);
    }

    // Voice over announcement
    voiceOver.speak(
      language === 'ar'
        ? `لون ${color.arabic}, ${color.pronunciation}`
        : `Color ${color.english}, ${color.pronunciation}`,
      true
    );
  };

  const handleCloseDetail = () => {
    setSelectedColor(null);
    voiceOver.stop();
  };

  return (
    <div className="arabic-colors-learning" ref={containerRef}>
      <motion.div
        className="colors-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="colors-main-title">
          {language === 'ar' ? '🎨 تعلم الألوان العربية' : '🎨 Learn Arabic Colors'}
        </h1>
        <p className="colors-subtitle">
          {language === 'ar'
            ? 'اكتشف الألوان الجميلة في اللغة العربية'
            : 'Discover beautiful colors in Arabic language'
          }
        </p>
      </motion.div>

      {/* Expanded Color Display */}
      <AnimatePresence>
        {selectedColor && (
          <motion.div
            className="color-fullscreen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseDetail}
          >
            <button
              className="close-fullscreen-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseDetail();
              }}
            >
              ✕
            </button>

            <motion.div
              className="fullscreen-color-info"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: selectedColor.hex
              }}
            >
              <img
                src={selectedColor.image}
                alt={selectedColor.english}
                className="fullscreen-color-image"
              />
              <div className="fullscreen-arabic-name">{selectedColor.arabic}</div>
              <div className="fullscreen-english-name">{selectedColor.english}</div>
              <div className="fullscreen-pronunciation">{selectedColor.pronunciation}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Colors Grid */}
      <div className="modern-colors-grid">
        {arabicColors.map((color, index) => (
          <motion.div
            key={index}
            className="modern-color-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleColorSelect(color)}
            style={{ backgroundColor: color.hex }}
          >
            <div className="color-image-container">
              <img
                src={color.image}
                alt={color.english}
                className="color-object-image"
              />
            </div>

            <div className="modern-color-bottom">
              <div className="modern-color-arabic">{color.arabic}</div>
              <div className="modern-color-english">{color.english}</div>
            </div>

            <div className="tap-hint">
              {language === 'ar' ? 'انقر للعرض ←' : 'Tap to view →'}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scroll Down Indicator */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
          >
            <div className="scroll-arrow">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ↓
              </motion.div>
            </div>
            <div className="scroll-text">
              {language === 'ar' ? 'مرر للأسفل' : 'Scroll down'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Popup */}
      <CelebrationPopup
        show={showCelebration}
        language={language}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default ArabicColorsLearning;