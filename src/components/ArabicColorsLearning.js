import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './ArabicColorsLearning.css';

const arabicColors = [
  {
    arabic: 'أحمر',
    english: 'Red',
    pronunciation: 'ahmar',
    pastelHex: '#ffb3ba',
    darkHex: '#ff8a95',
    objects: ['تفاحة', 'وردة', 'فراولة'],
    objectsEnglish: ['apple', 'rose', 'strawberry']
  },
  {
    arabic: 'أزرق',
    english: 'Blue',
    pronunciation: 'azraq',
    pastelHex: '#bae1ff',
    darkHex: '#87ceeb',
    objects: ['سماء', 'بحر', 'طائر'],
    objectsEnglish: ['sky', 'sea', 'bird']
  },
  {
    arabic: 'أخضر',
    english: 'Green',
    pronunciation: 'akhdar',
    pastelHex: '#baffc9',
    darkHex: '#98fb98',
    objects: ['شجرة', 'عشب', 'خضار'],
    objectsEnglish: ['tree', 'grass', 'vegetables']
  },
  {
    arabic: 'أصفر',
    english: 'Yellow',
    pronunciation: 'asfar',
    pastelHex: '#ffffba',
    darkHex: '#f0e68c',
    objects: ['شمس', 'ليمون', 'موز'],
    objectsEnglish: ['sun', 'lemon', 'banana']
  },
  {
    arabic: 'بنفسجي',
    english: 'Purple',
    pronunciation: 'banafsaji',
    pastelHex: '#e1baff',
    darkHex: '#dda0dd',
    objects: ['عنب', 'زهرة', 'فراشة'],
    objectsEnglish: ['grapes', 'flower', 'butterfly']
  },
  {
    arabic: 'وردي',
    english: 'Pink',
    pronunciation: 'wardi',
    pastelHex: '#ffb3e6',
    darkHex: '#ffc0cb',
    objects: ['وردة', 'فستان', 'حلوى'],
    objectsEnglish: ['rose', 'dress', 'candy']
  },
  {
    arabic: 'برتقالي',
    english: 'Orange',
    pronunciation: 'burtuqali',
    pastelHex: '#ffd9b3',
    darkHex: '#ffa07a',
    objects: ['برتقال', 'جزر', 'قرع'],
    objectsEnglish: ['orange', 'carrot', 'pumpkin']
  },
  {
    arabic: 'بني',
    english: 'Brown',
    pronunciation: 'bunni',
    pastelHex: '#d4c4a8',
    darkHex: '#d2b48c',
    objects: ['شجرة', 'شوكولاتة', 'أرض'],
    objectsEnglish: ['tree', 'chocolate', 'earth']
  },
  {
    arabic: 'أبيض',
    english: 'White',
    pronunciation: 'abyad',
    pastelHex: '#f8f8ff',
    darkHex: '#f5f5f5',
    objects: ['ثلج', 'حليب', 'سحاب'],
    objectsEnglish: ['snow', 'milk', 'cloud']
  },
  {
    arabic: 'أسود',
    english: 'Black',
    pronunciation: 'aswad',
    pastelHex: '#696969',
    darkHex: '#2f2f2f',
    objects: ['ليل', 'فحم', 'قط'],
    objectsEnglish: ['night', 'coal', 'cat']
  },
  {
    arabic: 'رمادي',
    english: 'Gray',
    pronunciation: 'ramadi',
    pastelHex: '#d3d3d3',
    darkHex: '#a9a9a9',
    objects: ['سحاب', 'فيل', 'حجر'],
    objectsEnglish: ['cloud', 'elephant', 'stone']
  },
  {
    arabic: 'ذهبي',
    english: 'Gold',
    pronunciation: 'dhahabi',
    pastelHex: '#f0e68c',
    darkHex: '#ffd700',
    objects: ['ذهب', 'تاج', 'شمس'],
    objectsEnglish: ['gold', 'crown', 'sun']
  }
];

const ArabicColorsLearning = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const containerRef = useRef(null);

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
  };

  const handleCloseDetail = () => {
    setSelectedColor(null);
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

      {/* Color Detail Modal */}
      <AnimatePresence>
        {selectedColor && (
          <motion.div
            className="color-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseDetail}
          >
            <motion.div
              className="color-detail-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: `linear-gradient(135deg, ${selectedColor.pastelHex}, ${selectedColor.darkHex}15)`
              }}
            >
              <button className="close-detail-btn" onClick={handleCloseDetail}>
                ✕
              </button>

              <div className="detail-color-circle-large" style={{ backgroundColor: selectedColor.darkHex }}>
                <div className="detail-color-shine"></div>
              </div>

              <div className="detail-color-info">
                <div className="detail-arabic-name">{selectedColor.arabic}</div>
                <div className="detail-english-name">{selectedColor.english}</div>
                <div className="detail-pronunciation">{selectedColor.pronunciation}</div>
              </div>

              <div className="detail-objects-section">
                <h3 className="detail-objects-title">
                  {language === 'ar' ? 'أمثلة من الحياة اليومية' : 'Everyday Examples'}
                </h3>
                <div className="detail-objects-grid">
                  {selectedColor.objects.map((object, index) => (
                    <motion.div
                      key={index}
                      className="detail-object-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="detail-object-arabic">{object}</div>
                      <div className="detail-object-english">{selectedColor.objectsEnglish[index]}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
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
          >
            <div className="modern-color-top" style={{ backgroundColor: color.pastelHex }}>
              <div className="modern-color-circle" style={{ backgroundColor: color.darkHex }}>
                <div className="color-shine"></div>
              </div>
            </div>

            <div className="modern-color-bottom">
              <div className="modern-color-arabic">{color.arabic}</div>
              <div className="modern-color-english">{color.english}</div>
              <div className="modern-color-pronunciation">{color.pronunciation}</div>
            </div>

            <div className="tap-hint">
              {language === 'ar' ? '← انقر لمزيد من التفاصيل' : 'Tap for details →'}
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
    </div>
  );
};

export default ArabicColorsLearning;