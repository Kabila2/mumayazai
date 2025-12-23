import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceOver } from '../hooks/useVoiceOver';
import { playClickSound } from '../utils/soundEffects';
import CelebrationPopup from './CelebrationPopup';
import './BubblePopGame.css';

const BubblePopGame = ({ language = 'en' }) => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [targetLetter, setTargetLetter] = useState('');
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showCelebration, setShowCelebration] = useState(false);
  const [level, setLevel] = useState(1);
  const bubbleIdRef = useRef(0);
  const gameTimerRef = useRef(null);
  const bubbleSpawnRef = useRef(null);

  const voiceOver = useVoiceOver(language, { autoPlayEnabled: true });

  const arabicLetters = [
    'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
    'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
    'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
  ];

  const englishLetters = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  const letters = language === 'ar' ? arabicLetters : englishLetters;

  const t = {
    en: {
      title: 'Bubble Pop Game',
      instruction: 'Pop all bubbles with:',
      score: 'Score:',
      time: 'Time:',
      level: 'Level:',
      start: 'Start Game',
      gameOver: 'Game Over!',
      finalScore: 'Final Score:',
      playAgain: 'Play Again',
      correct: 'Great!',
      wrong: 'Wrong bubble!'
    },
    ar: {
      title: 'لعبة فقاعات الحروف',
      instruction: 'افقع كل الفقاعات التي تحتوي على:',
      score: 'النتيجة:',
      time: 'الوقت:',
      level: 'المستوى:',
      start: 'ابدأ اللعبة',
      gameOver: 'انتهت اللعبة!',
      finalScore: 'النتيجة النهائية:',
      playAgain: 'العب مرة أخرى',
      correct: 'رائع!',
      wrong: 'فقاعة خاطئة!'
    }
  };

  const currentLang = t[language] || t.en;

  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (bubbleSpawnRef.current) clearInterval(bubbleSpawnRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameActive) {
      // Game timer
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Bubble spawner
      const spawnInterval = Math.max(1000 - (level * 100), 500);
      bubbleSpawnRef.current = setInterval(() => {
        spawnBubble();
      }, spawnInterval);

      return () => {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
        if (bubbleSpawnRef.current) clearInterval(bubbleSpawnRef.current);
      };
    }
  }, [gameActive, level]);

  const startGame = () => {
    playClickSound();
    setGameActive(true);
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setBubbles([]);
    selectNewTarget();
  };

  const selectNewTarget = () => {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    setTargetLetter(randomLetter);
    voiceOver.speak(
      language === 'ar'
        ? `ابحث عن حرف ${randomLetter}`
        : `Find letter ${randomLetter}`,
      true
    );
  };

  const spawnBubble = () => {
    const isTarget = Math.random() < 0.3; // 30% chance of target letter
    const letter = isTarget ? targetLetter : letters[Math.floor(Math.random() * letters.length)];

    const newBubble = {
      id: bubbleIdRef.current++,
      letter,
      isTarget,
      x: Math.random() * 80 + 10, // 10% to 90% of width
      duration: Math.random() * 3 + 4, // 4-7 seconds
      size: Math.random() * 40 + 80 // 80-120px
    };

    setBubbles(prev => [...prev, newBubble]);

    // Remove bubble after it reaches top
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== newBubble.id));
    }, newBubble.duration * 1000);
  };

  const popBubble = (bubble) => {
    playClickSound();

    if (bubble.isTarget) {
      setScore(prev => prev + (10 * level));
      setShowCelebration(true);
      voiceOver.speak(currentLang.correct, true);

      // Level up every 50 points
      if ((score + 10) % 50 === 0) {
        setLevel(prev => prev + 1);
      }

      // Select new target
      selectNewTarget();
    } else {
      setScore(prev => Math.max(0, prev - 5));
      voiceOver.speak(currentLang.wrong, true);
    }

    // Remove the popped bubble
    setBubbles(prev => prev.filter(b => b.id !== bubble.id));
  };

  const endGame = () => {
    setGameActive(false);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (bubbleSpawnRef.current) clearInterval(bubbleSpawnRef.current);
    voiceOver.speak(
      language === 'ar'
        ? `انتهت اللعبة! نتيجتك ${score}`
        : `Game over! Your score is ${score}`,
      true
    );
  };

  if (!gameActive && timeLeft === 0) {
    return (
      <div className="bubble-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          className="game-over-screen"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="game-over-title">🎮 {currentLang.gameOver}</h1>
          <div className="final-score-display">
            {currentLang.finalScore}
            <span className="score-number">{score}</span>
          </div>
          <button className="play-again-btn" onClick={startGame}>
            🔄 {currentLang.playAgain}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bubble-game-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bubble-game-header">
        <h1 className="bubble-game-title">
          <span className="title-icon">🫧</span>
          {currentLang.title}
        </h1>

        {!gameActive ? (
          <button className="start-game-btn" onClick={startGame}>
            {currentLang.start}
          </button>
        ) : (
          <>
            <div className="game-stats">
              <div className="stat-box">
                <span className="stat-label">{currentLang.score}</span>
                <span className="stat-value">{score}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">{currentLang.time}</span>
                <span className={`stat-value ${timeLeft <= 10 ? 'urgent' : ''}`}>{timeLeft}s</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">{currentLang.level}</span>
                <span className="stat-value">{level}</span>
              </div>
            </div>

            <div className="target-display">
              <p className="target-instruction">{currentLang.instruction}</p>
              <div className="target-letter-box">
                <span className="target-letter">{targetLetter}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {gameActive && (
        <div className="bubble-playground">
          <AnimatePresence>
            {bubbles.map(bubble => (
              <motion.div
                key={bubble.id}
                className={`bubble ${bubble.isTarget ? 'target-bubble' : ''}`}
                initial={{
                  x: `${bubble.x}%`,
                  y: '100vh',
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  y: '-20vh',
                  opacity: 1,
                  scale: 1
                }}
                exit={{
                  scale: 0,
                  opacity: 0
                }}
                transition={{
                  duration: bubble.duration,
                  ease: 'linear'
                }}
                onClick={() => popBubble(bubble)}
                style={{
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  left: 0
                }}
              >
                <div className="bubble-shine" />
                <span className="bubble-letter">{bubble.letter}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <CelebrationPopup
        show={showCelebration}
        language={language}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default BubblePopGame;
