import React from 'react';
import { motion } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import './LearnHub.css';

const LearnHub = ({ language, onSectionSelect }) => {
  // Voice Over hook for accessibility
  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });
  const t = {
    en: {
      title: 'Learning Center',
      subtitle: 'Choose what you want to learn today',
      basics: 'Core Lessons',
      practice: 'Practice & Activities',
      interactive: 'Interactive Learning'
    },
    ar: {
      title: 'مركز التعلم',
      subtitle: 'اختر ما تريد تعلمه اليوم',
      basics: 'الدروس الأساسية',
      practice: 'التمرين والأنشطة',
      interactive: 'التعلم التفاعلي'
    }
  };

  const currentLang = t[language] || t.en;

  const sections = [
    {
      id: 'alphabet',
      icon: '🔤',
      titleEn: 'Alphabet',
      titleAr: 'الحروف',
      descriptionEn: 'Learn all 28 Arabic letters',
      descriptionAr: 'تعلم جميع الحروف العربية الـ 28',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      category: 'basics'
    },
    {
      id: 'colors',
      icon: '🎨',
      titleEn: 'Colors',
      titleAr: 'الألوان',
      descriptionEn: 'Discover Arabic color names',
      descriptionAr: 'اكتشف أسماء الألوان بالعربية',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      category: 'basics'
    },
    {
      id: 'words',
      icon: '📚',
      titleEn: 'Words',
      titleAr: 'الكلمات',
      descriptionEn: 'Build your Arabic vocabulary',
      descriptionAr: 'بناء مفرداتك العربية',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      category: 'basics'
    },
    {
      id: 'sentences',
      icon: '💬',
      titleEn: 'Sentences',
      titleAr: 'الجمل',
      descriptionEn: 'Learn common Arabic sentences',
      descriptionAr: 'تعلم الجمل العربية الشائعة',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      category: 'basics'
    },
    {
      id: 'handwriting',
      icon: '✍️',
      titleEn: 'Handwriting',
      titleAr: 'الكتابة اليدوية',
      descriptionEn: 'Practice writing Arabic letters',
      descriptionAr: 'تدرب على كتابة الحروف العربية',
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      category: 'practice'
    },
    {
      id: 'homework',
      icon: '📝',
      titleEn: 'Homework',
      titleAr: 'الواجبات',
      descriptionEn: 'Complete your homework',
      descriptionAr: 'أكمل واجباتك',
      color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      category: 'practice'
    },
    {
      id: 'story',
      icon: '📖',
      titleEn: 'Stories',
      titleAr: 'القصص',
      descriptionEn: 'Read interactive stories',
      descriptionAr: 'اقرأ قصصاً تفاعلية',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      category: 'interactive'
    },
    {
      id: 'drawing',
      icon: '🎨',
      titleEn: 'Drawing',
      titleAr: 'الرسم',
      descriptionEn: 'Draw and create together',
      descriptionAr: 'ارسم وأبدع معاً',
      color: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
      category: 'interactive'
    }
  ];

  const categories = [
    { id: 'basics', label: currentLang.basics },
    { id: 'practice', label: currentLang.practice },
    { id: 'interactive', label: currentLang.interactive }
  ];

  const handleSectionClick = (section) => {
    // Voice over announcement
    voiceOver.speak(
      language === 'ar'
        ? `${section.titleAr}, ${section.descriptionAr}`
        : `${section.titleEn}, ${section.descriptionEn}`,
      true
    );
    onSectionSelect(section.id);
  };

  return (
    <div className="learn-hub-container">
      <motion.div
        className="learn-hub-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="learn-hub-title">{currentLang.title}</h1>
        <p className="learn-hub-subtitle">{currentLang.subtitle}</p>
      </motion.div>

      <div className="learn-hub-content">
        {categories.map((category, catIndex) => {
          const categorySections = sections.filter(s => s.category === category.id);

          return (
            <div key={category.id} className="learn-category">
              <motion.h2
                className="category-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: catIndex * 0.1, duration: 0.4 }}
              >
                {category.label}
              </motion.h2>

              <div className="learn-sections-grid">
                {categorySections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    className="learn-card"
                    onClick={() => handleSectionClick(section)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: catIndex * 0.1 + index * 0.1,
                      duration: 0.4,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="learn-card-gradient" style={{ background: section.color }}></div>
                    <div className="learn-card-content">
                      <div className="learn-card-icon">{section.icon}</div>
                      <h3 className="learn-card-title">
                        {language === 'ar' ? section.titleAr : section.titleEn}
                      </h3>
                      <p className="learn-card-description">
                        {language === 'ar' ? section.descriptionAr : section.descriptionEn}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearnHub;
