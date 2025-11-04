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
    },
    {
      id: 'handwriting',
      icon: '✍️',
      titleEn: 'Handwriting Practice',
      titleAr: 'تمرين الكتابة اليدوية',
      descriptionEn: 'Practice writing Arabic letters',
      descriptionAr: 'تدرب على كتابة الحروف العربية',
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      bgColor: '#10b981'
    },
    {
      id: 'story',
      icon: '📖',
      titleEn: 'Interactive Stories',
      titleAr: 'قصص تفاعلية',
      descriptionEn: 'Read fun and interactive stories',
      descriptionAr: 'اقرأ قصصاً ممتعة وتفاعلية',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      bgColor: '#f59e0b'
    },
    {
      id: 'homework',
      icon: '📚',
      titleEn: 'Homework Center',
      titleAr: 'مركز الواجبات',
      descriptionEn: 'View and complete your homework',
      descriptionAr: 'شاهد واجباتك وأكملها',
      color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      bgColor: '#3b82f6'
    },
    {
      id: 'drawing',
      icon: '🎨',
      titleEn: 'Drawing Board',
      titleAr: 'لوحة الرسم التعاونية',
      descriptionEn: 'Draw and write with others',
      descriptionAr: 'ارسم واكتب مع الآخرين',
      color: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
      bgColor: '#ec4899'
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
          transition={{ delay: index * 0.15, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="learn-section-content">
            <div className="learn-section-icon">{section.icon}</div>
            <h2 className="learn-section-title">
              {language === 'ar' ? section.titleAr : section.titleEn}
            </h2>
            <p className="learn-section-description">
              {language === 'ar' ? section.descriptionAr : section.descriptionEn}
            </p>
          </div>
          <div className="learn-section-decorator"></div>
        </motion.div>
      ))}
    </div>
  );
};

export default LearnHub;
