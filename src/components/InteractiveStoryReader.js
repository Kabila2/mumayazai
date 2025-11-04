import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { playClickSound } from '../utils/soundEffects';
import './InteractiveStoryReader.css';

const stories = [
  {
    id: 1,
    title: 'القط الصغير',
    titleEn: 'The Little Cat',
    content: [
      { ar: 'كان ياما كان قط صغير اسمه مش مش', en: 'Once upon a time there was a little cat named Mish Mish' },
      { ar: 'يحب اللعب في الحديقة كل يوم', en: 'He loved to play in the garden every day' },
      { ar: 'في يوم من الأيام وجد صديقاً جديداً', en: 'One day he found a new friend' },
      { ar: 'وعاشوا في سعادة وسرور', en: 'And they lived happily ever after' }
    ],
    image: '🐱'
  },
  {
    id: 2,
    title: 'الشجرة السعيدة',
    titleEn: 'The Happy Tree',
    content: [
      { ar: 'كانت هناك شجرة جميلة في الغابة', en: 'There was a beautiful tree in the forest' },
      { ar: 'تحب مساعدة جميع الحيوانات', en: 'She loved helping all the animals' },
      { ar: 'أعطتهم الظل والفاكهة اللذيذة', en: 'She gave them shade and delicious fruit' },
      { ar: 'وأصبحت أسعد شجرة في العالم', en: 'And became the happiest tree in the world' }
    ],
    image: '🌳'
  }
];

const InteractiveStoryReader = ({ onClose, language = 'en' }) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const t = {
    en: { title: 'Story Reading', selectStory: 'Select a Story', next: 'Next', prev: 'Previous', finish: 'Finish', close: 'Close' },
    ar: { title: 'قراءة القصص', selectStory: 'اختر قصة', next: 'التالي', prev: 'السابق', finish: 'إنهاء', close: 'إغلاق' }
  }[language] || { title: 'Story Reading', selectStory: 'Select a Story', next: 'Next', prev: 'Previous', finish: 'Finish', close: 'Close' };

  if (!selectedStory) {
    return (
      <motion.div
        className="story-reader-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <div className="story-reader-page">
          <div className="story-reader-header">
            <div className="header-left">
              <button className="back-button" onClick={onClose}>
                ← {t.close}
              </button>
              <h2>📚 {t.title}</h2>
            </div>
          </div>
          <div className="story-list" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h3>{t.selectStory}</h3>
            <div className="story-cards-grid">
              {stories.map((story) => (
                <motion.div
                  key={story.id}
                  className="story-card"
                  onClick={() => { playClickSound(); setSelectedStory(story); }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="story-icon">{story.image}</div>
                  <div>
                    <h4>{language === 'ar' ? story.title : story.titleEn}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentContent = selectedStory.content[currentPage];

  return (
    <motion.div
      className="story-reader-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="story-reader-page reading">
        <div className="story-reader-header">
          <div className="header-left">
            <button className="back-button" onClick={() => setSelectedStory(null)}>
              ← {t.close}
            </button>
            <h2>📖 {language === 'ar' ? selectedStory.title : selectedStory.titleEn}</h2>
          </div>
        </div>
        <div className="story-content" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="story-image">{selectedStory.image}</div>
          <div className="story-text ar">{currentContent.ar}</div>
          <div className="story-text en">{currentContent.en}</div>
          <div className="story-progress">Page {currentPage + 1} of {selectedStory.content.length}</div>
        </div>
        <div className="story-navigation">
          <button className="nav-btn" onClick={() => { playClickSound(); setCurrentPage(Math.max(0, currentPage - 1)); }} disabled={currentPage === 0}>{t.prev}</button>
          {currentPage < selectedStory.content.length - 1 ? (
            <button className="nav-btn" onClick={() => { playClickSound(); setCurrentPage(currentPage + 1); }}>{t.next}</button>
          ) : (
            <button className="nav-btn finish" onClick={() => { playClickSound(); setSelectedStory(null); setCurrentPage(0); }}>{t.finish}</button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InteractiveStoryReader;
