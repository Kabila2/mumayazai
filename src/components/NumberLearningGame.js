import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import { playClickSound } from '../utils/soundEffects';
import CelebrationPopup from './CelebrationPopup';
import './NumberLearningGame.css';

const NumberLearningGame = ({ language = 'en', difficulty = 'medium' }) => {
  const [currentNumber, setCurrentNumber] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  const numbers = [
    { value: 0, nameEn: 'Zero', nameAr: 'صفر', emoji: '0️⃣' },
    { value: 1, nameEn: 'One', nameAr: 'واحد', emoji: '1️⃣' },
    { value: 2, nameEn: 'Two', nameAr: 'اثنان', emoji: '2️⃣' },
    { value: 3, nameEn: 'Three', nameAr: 'ثلاثة', emoji: '3️⃣' },
    { value: 4, nameEn: 'Four', nameAr: 'أربعة', emoji: '4️⃣' },
    { value: 5, nameEn: 'Five', nameAr: 'خمسة', emoji: '5️⃣' },
    { value: 6, nameEn: 'Six', nameAr: 'ستة', emoji: '6️⃣' },
    { value: 7, nameEn: 'Seven', nameAr: 'سبعة', emoji: '7️⃣' },
    { value: 8, nameEn: 'Eight', nameAr: 'ثمانية', emoji: '8️⃣' },
    { value: 9, nameEn: 'Nine', nameAr: 'تسعة', emoji: '9️⃣' },
    { value: 10, nameEn: 'Ten', nameAr: 'عشرة', emoji: '🔟' }
  ];

  const t = {
    en: {
      title: 'Number Learning',
      instruction: 'How many do you see?',
      score: 'Score:',
      round: 'Round:',
      correct: 'Perfect!',
      wrong: 'Try again!',
      complete: 'Game Complete!',
      finalScore: 'Final Score:',
      playAgain: 'Play Again',
      wellDone: 'Well done!',
      timeLeft: 'Time:',
      difficulty: 'Difficulty:',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard'
    },
    ar: {
      title: 'تعلم الأرقام',
      instruction: 'كم عدد ما تراه؟',
      score: 'النتيجة:',
      round: 'الجولة:',
      correct: 'ممتاز!',
      wrong: 'حاول مرة أخرى!',
      complete: 'اكتملت اللعبة!',
      finalScore: 'النتيجة النهائية:',
      playAgain: 'العب مرة أخرى',
      wellDone: 'أحسنت!',
      timeLeft: 'الوقت:',
      difficulty: 'الصعوبة:',
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب'
    }
  };

  const currentLang = t[language] || t.en;

  // Difficulty settings
  const difficultySettings = {
    easy: { rounds: 5, maxNumber: 5, numOptions: 3, timePerRound: null },      // 1-5, 3 options, no timer
    medium: { rounds: 10, maxNumber: 10, numOptions: 4, timePerRound: null },  // 1-10, 4 options, no timer
    hard: { rounds: 15, maxNumber: 15, numOptions: 4, timePerRound: 12 }       // 1-15, 4 options, 12 sec timer
  };

  const currentSettings = difficultySettings[difficulty] || difficultySettings.medium;
  const totalRounds = currentSettings.rounds;

  const emojis = ['🍎', '⭐', '🌸', '🎈', '🦋', '🍇', '🌼', '🎁', '🐶', '🚗'];

  useEffect(() => {
    startNewRound();
  }, []);

  // Timer effect for hard mode
  useEffect(() => {
    if (timeLeft === null || timeLeft === 0 || gameComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - move to next round with no points
          setFeedback('wrong');
          voiceOver.speak(
            language === 'ar' ? 'انتهى الوقت!' : 'Time is up!',
            true
          );
          setTimeout(() => {
            setRound(round + 1);
            startNewRound();
            setFeedback('');
          }, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameComplete]);

  const startNewRound = () => {
    if (round >= totalRounds) {
      setGameComplete(true);
      voiceOver.speak(
        language === 'ar' ? 'انتهت اللعبة! أحسنت' : 'Game complete! Well done!',
        true
      );
      return;
    }

    // Select a random number based on difficulty
    const maxNum = Math.min(currentSettings.maxNumber, numbers.length - 1);
    const targetNumber = numbers[Math.floor(Math.random() * maxNum) + 1];
    setCurrentNumber(targetNumber);

    // Create wrong options based on difficulty
    const numWrongOptions = currentSettings.numOptions - 1;
    const wrongOptions = numbers
      .filter(n => n.value !== targetNumber.value && n.value > 0 && n.value <= maxNum)
      .sort(() => Math.random() - 0.5)
      .slice(0, numWrongOptions);

    // Shuffle all options
    const allOptions = [targetNumber, ...wrongOptions].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    setFeedback('');

    // Set timer for hard mode
    if (currentSettings.timePerRound) {
      setTimeLeft(currentSettings.timePerRound);
    }

    // Announce the question
    voiceOver.speak(
      language === 'ar'
        ? `كم عدد ما تراه؟`
        : `How many do you see?`,
      true
    );
  };

  const handleOptionClick = (selectedNumber) => {
    playClickSound();

    if (selectedNumber.value === currentNumber.value) {
      setScore(score + 10);
      setFeedback('correct');
      setShowCelebration(true);
      voiceOver.speak(
        language === 'ar'
          ? `صحيح! ${selectedNumber.nameAr}`
          : `Correct! ${selectedNumber.nameEn}`,
        true
      );

      setTimeout(() => {
        setRound(round + 1);
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
    setRound(0);
    setGameComplete(false);
    setFeedback('');
    startNewRound();
  };

  // Render emojis for the current number
  const renderEmojis = () => {
    if (!currentNumber) return null;
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    return Array(currentNumber.value).fill(randomEmoji);
  };

  if (gameComplete) {
    return (
      <div className="number-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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
    <div className="number-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="number-game-header">
        <h1 className="number-game-title">
          <span className="title-icon">🔢</span>
          {currentLang.title}
        </h1>
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">{currentLang.score}</span>
            <span className="info-value">{score}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{currentLang.round}</span>
            <span className="info-value">{round + 1}/{totalRounds}</span>
          </div>
          {timeLeft !== null && (
            <div className="info-item" style={{
              backgroundColor: timeLeft <= 3 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.2)'
            }}>
              <span className="info-label">{currentLang.timeLeft}</span>
              <span className="info-value" style={{ color: timeLeft <= 3 ? '#ef4444' : 'inherit' }}>
                {timeLeft}s
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="number-game-content">
        <AnimatePresence mode="wait">
          {currentNumber && (
            <motion.div
              key={round}
              className="counting-area"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="instruction-text">{currentLang.instruction}</p>
              <div className="emoji-grid">
                {renderEmojis().map((emoji, index) => (
                  <motion.div
                    key={index}
                    className="emoji-item"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="options-grid">
          {options.map((option, index) => (
            <motion.div
              key={option.value}
              className={`number-option ${feedback === 'wrong' && option.value !== currentNumber.value ? 'shake' : ''}`}
              onClick={() => handleOptionClick(option)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="option-emoji">{option.emoji}</div>
              <div className="option-name">
                {language === 'ar' ? option.nameAr : option.nameEn}
              </div>
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

export default NumberLearningGame;
