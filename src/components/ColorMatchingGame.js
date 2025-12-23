import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import { playClickSound } from '../utils/soundEffects';
import CelebrationPopup from './CelebrationPopup';
import './ColorMatchingGame.css';

const ColorMatchingGame = ({ language = 'en' }) => {
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [targetColor, setTargetColor] = useState(null);
  const [colorOptions, setColorOptions] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  const colors = [
    { name: 'Red', nameAr: 'أحمر', color: '#ef4444', emoji: '🔴' },
    { name: 'Blue', nameAr: 'أزرق', color: '#3b82f6', emoji: '🔵' },
    { name: 'Green', nameAr: 'أخضر', color: '#10b981', emoji: '🟢' },
    { name: 'Yellow', nameAr: 'أصفر', color: '#fbbf24', emoji: '🟡' },
    { name: 'Purple', nameAr: 'بنفسجي', color: '#a855f7', emoji: '🟣' },
    { name: 'Orange', nameAr: 'برتقالي', color: '#f97316', emoji: '🟠' },
    { name: 'Pink', nameAr: 'وردي', color: '#ec4899', emoji: '💗' },
    { name: 'Brown', nameAr: 'بني', color: '#92400e', emoji: '🟤' },
    { name: 'Black', nameAr: 'أسود', color: '#1f2937', emoji: '⚫' },
    { name: 'White', nameAr: 'أبيض', color: '#f9fafb', emoji: '⚪' }
  ];

  const t = {
    en: {
      title: 'Color Matching Game',
      instruction: 'Find the color:',
      score: 'Score:',
      round: 'Round:',
      correct: 'Perfect!',
      wrong: 'Try again!',
      complete: 'Game Complete!',
      finalScore: 'Final Score:',
      playAgain: 'Play Again',
      wellDone: 'Well done!'
    },
    ar: {
      title: 'لعبة مطابقة الألوان',
      instruction: 'ابحث عن اللون:',
      score: 'النتيجة:',
      round: 'الجولة:',
      correct: 'ممتاز!',
      wrong: 'حاول مرة أخرى!',
      complete: 'اكتملت اللعبة!',
      finalScore: 'النتيجة النهائية:',
      playAgain: 'العب مرة أخرى',
      wellDone: 'أحسنت!'
    }
  };

  const currentLang = t[language] || t.en;
  const totalRounds = 10;

  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    if (currentRound >= totalRounds) {
      setGameComplete(true);
      voiceOver.speak(
        language === 'ar' ? 'انتهت اللعبة! أحسنت' : 'Game complete! Well done!',
        true
      );
      return;
    }

    // Select a random target color
    const randomTarget = colors[Math.floor(Math.random() * colors.length)];
    setTargetColor(randomTarget);

    // Create options (3 random colors + the target)
    const otherColors = colors.filter(c => c.name !== randomTarget.name);
    const shuffled = [...otherColors].sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...shuffled, randomTarget].sort(() => Math.random() - 0.5);
    setColorOptions(options);

    setFeedback('');

    // Announce the target color
    voiceOver.speak(
      language === 'ar'
        ? `ابحث عن اللون ${randomTarget.nameAr}`
        : `Find the color ${randomTarget.name}`,
      true
    );
  };

  const handleColorClick = (selectedColor) => {
    playClickSound();

    if (selectedColor.name === targetColor.name) {
      setScore(score + 10);
      setFeedback('correct');
      setShowCelebration(true);
      voiceOver.speak(
        language === 'ar' ? 'ممتاز! صحيح' : 'Perfect! Correct!',
        true
      );

      setTimeout(() => {
        setCurrentRound(currentRound + 1);
        startNewRound();
        setFeedback('');
      }, 1500);
    } else {
      setFeedback('wrong');
      voiceOver.speak(
        language === 'ar' ? 'حاول مرة أخرى' : 'Try again',
        true
      );

      setTimeout(() => {
        setFeedback('');
      }, 1000);
    }
  };

  const resetGame = () => {
    playClickSound();
    setScore(0);
    setCurrentRound(0);
    setGameComplete(false);
    setFeedback('');
    startNewRound();
  };

  if (gameComplete) {
    return (
      <div className="color-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          className="game-complete-screen"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="complete-title">🎉 {currentLang.complete} 🎉</h1>
          <p className="complete-message">{currentLang.wellDone}</p>
          <div className="final-score">
            {currentLang.finalScore} <span className="score-number">{score}</span>
          </div>
          <button className="play-again-btn" onClick={resetGame}>
            🔄 {currentLang.playAgain}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="color-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="color-game-header">
        <h1 className="color-game-title">
          <span className="title-icon">🎨</span>
          {currentLang.title}
        </h1>
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">{currentLang.score}</span>
            <span className="info-value">{score}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{currentLang.round}</span>
            <span className="info-value">{currentRound + 1}/{totalRounds}</span>
          </div>
        </div>
      </div>

      <div className="color-game-content">
        <AnimatePresence mode="wait">
          {targetColor && (
            <motion.div
              key={currentRound}
              className="target-color-display"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="instruction-text">{currentLang.instruction}</p>
              <div className="target-color-card">
                <h2 className="target-color-name">
                  {language === 'ar' ? targetColor.nameAr : targetColor.name}
                </h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="color-options-grid">
          {colorOptions.map((color, index) => (
            <motion.div
              key={color.name}
              className={`color-option ${feedback === 'wrong' && color.name !== targetColor.name ? 'shake' : ''}`}
              onClick={() => handleColorClick(color)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                backgroundColor: color.color,
                border: color.name === 'White' ? '3px solid #e5e7eb' : 'none'
              }}
            >
              <span className="color-emoji">{color.emoji}</span>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              className={`feedback-message ${feedback}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {feedback === 'correct' ? '✨ ' + currentLang.correct + ' ✨' : '❌ ' + currentLang.wrong}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CelebrationPopup
        show={showCelebration}
        language={language}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default ColorMatchingGame;
