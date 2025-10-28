import React from 'react';
import { motion } from 'framer-motion';
import './LearnHub.css';

const LearnHub = ({ language, onSectionSelect }) => {
  const sections = [
    {
      id: 'alphabet',
      icon: '🔤',
      titleEn: 'Alphabet',
      titleAr: 'الحروف',
      descriptionEn: 'Learn all 28 Arabic letters',
      descriptionAr: 'تعلم جميع الحروف العربية الـ 28',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      bgColor: '#667eea'
    },
    {
      id: 'colors',
      icon: '🎨',
      titleEn: 'Colors',
      titleAr: 'الألوان',
      descriptionEn: 'Discover Arabic color names',
      descriptionAr: 'اكتشف أسماء الألوان بالعربية',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      bgColor: '#f093fb'
    },
    {
      id: 'words',
      icon: '📚',
      titleEn: 'Words',
      titleAr: 'الكلمات',
      descriptionEn: 'Build your Arabic vocabulary',
      descriptionAr: 'بناء مفرداتك العربية',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      bgColor: '#4facfe'
    },
    {
      id: 'sentences',
      icon: '💬',
      titleEn: 'Sentences',
      titleAr: 'الجمل',
      descriptionEn: 'Learn common Arabic sentences',
      descriptionAr: 'تعلم الجمل العربية الشائعة',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      bgColor: '#43e97b'
    }
  ];

  return (
    <div className="learn-hub">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          className="learn-section"
          onClick={() => onSectionSelect(section.id)}
          style={{ background: section.color }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="learn-section-content">
            <div className="learn-section-icon">{section.icon}</div>
            <h2 className="learn-section-title">
              {language === 'ar' ? section.titleAr : section.titleEn}
            </h2>
            <p className="learn-section-description">
              {language === 'ar' ? section.descriptionAr : section.descriptionEn}
            </p>
            <div className="learn-section-arrow">→</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default LearnHub;
