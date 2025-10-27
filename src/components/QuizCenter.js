// src/components/QuizCenter.js - Centralized Quiz System with Multiple Quiz Types

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './QuizCenter.css';

const QuizCenter = ({ t, language, fontSize, highContrast, reducedMotion, speak }) => {
  const [selectedQuizType, setSelectedQuizType] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Quiz Types
  const quizTypes = [
    {
      id: 'multiple-choice',
      nameEn: 'Multiple Choice',
      nameAr: 'اختيار من متعدد',
      icon: '✓',
      color: '#6366f1',
      description: 'Choose the correct answer from options'
    },
    {
      id: 'scrambled-letters',
      nameEn: 'Unscramble Words',
      nameAr: 'ترتيب الحروف',
      icon: '🔤',
      color: '#8b5cf6',
      description: 'Arrange letters to form the correct word'
    },
    {
      id: 'matching',
      nameEn: 'Match Pairs',
      nameAr: 'مطابقة الأزواج',
      icon: '🔗',
      color: '#ec4899',
      description: 'Match Arabic words with their English translations'
    },
    {
      id: 'fill-blanks',
      nameEn: 'Fill in the Blanks',
      nameAr: 'املأ الفراغات',
      icon: '📝',
      color: '#10b981',
      description: 'Complete the sentence with the correct word'
    },
    {
      id: 'recall',
      nameEn: 'Memory Recall',
      nameAr: 'استدعاء الذاكرة',
      icon: '🧠',
      color: '#f59e0b',
      description: 'Recall the meaning from memory'
    }
  ];

  // Topics with content for quizzes
  const topics = [
    {
      id: 'alphabet',
      nameEn: 'Alphabet',
      nameAr: 'الحروف',
      icon: '🔤',
      color: '#6366f1'
    },
    {
      id: 'words',
      nameEn: 'Words',
      nameAr: 'الكلمات',
      icon: '📚',
      color: '#8b5cf6'
    },
    {
      id: 'sentences',
      nameEn: 'Sentences',
      nameAr: 'الجمل',
      icon: '💬',
      color: '#ec4899'
    },
    {
      id: 'colors',
      nameEn: 'Colors',
      nameAr: 'الألوان',
      icon: '🎨',
      color: '#10b981'
    }
  ];

  // Quiz content database
  const quizContent = {
    alphabet: {
      multipleChoice: [
        { question: 'What is the sound of "ب"?', arabic: 'ب', options: ['ba', 'ta', 'tha', 'ja'], correct: 0 },
        { question: 'What is the sound of "ت"?', arabic: 'ت', options: ['ba', 'ta', 'tha', 'ja'], correct: 1 },
        { question: 'What is the sound of "ث"?', arabic: 'ث', options: ['ba', 'ta', 'tha', 'ja'], correct: 2 },
        { question: 'What is the sound of "ج"?', arabic: 'ج', options: ['ba', 'ta', 'tha', 'ja'], correct: 3 },
        { question: 'What is the sound of "ح"?', arabic: 'ح', options: ['ha', 'kha', 'dal', 'dhal'], correct: 0 }
      ],
      scrambledWords: [
        { word: 'alif', scrambled: 'flia', arabic: 'أ', hint: 'First letter of Arabic alphabet' },
        { word: 'ba', scrambled: 'ab', arabic: 'ب', hint: 'Second letter of Arabic alphabet' },
        { word: 'ta', scrambled: 'at', arabic: 'ت', hint: 'Third letter of Arabic alphabet' },
        { word: 'tha', scrambled: 'aht', arabic: 'ث', hint: 'Fourth letter of Arabic alphabet' },
        { word: 'jeem', scrambled: 'mejе', arabic: 'ج', hint: 'Fifth letter of Arabic alphabet' }
      ],
      recall: [
        { arabic: 'أ', english: 'alif', hint: 'First letter' },
        { arabic: 'ب', english: 'ba', hint: 'Second letter' },
        { arabic: 'ت', english: 'ta', hint: 'Third letter' },
        { arabic: 'ث', english: 'tha', hint: 'Fourth letter' },
        { arabic: 'ج', english: 'jeem', hint: 'Fifth letter' }
      ]
    },
    words: {
      multipleChoice: [
        { question: 'What does "كِتَاب" mean?', arabic: 'كِتَاب', options: ['Book', 'Pen', 'Learn', 'Reading'], correct: 0 },
        { question: 'What does "قَلَم" mean?', arabic: 'قَلَم', options: ['Book', 'Pen', 'Learn', 'Reading'], correct: 1 },
        { question: 'What does "مَاء" mean?', arabic: 'مَاء', options: ['Food', 'Water', 'Home', 'Family'], correct: 1 },
        { question: 'What does "سَعِيد" mean?', arabic: 'سَعِيد', options: ['Sad', 'Happy', 'Angry', 'Tired'], correct: 1 },
        { question: 'What does "بَيْت" mean?', arabic: 'بَيْت', options: ['School', 'Home', 'Car', 'Tree'], correct: 1 }
      ],
      scrambledWords: [
        { word: 'book', scrambled: 'koob', arabic: 'كِتَاب', hint: 'Reading material' },
        { word: 'pen', scrambled: 'nep', arabic: 'قَلَم', hint: 'Writing tool' },
        { word: 'water', scrambled: 'retaw', arabic: 'مَاء', hint: 'Drink this' },
        { word: 'home', scrambled: 'emoh', arabic: 'بَيْت', hint: 'Where you live' },
        { word: 'happy', scrambled: 'yppah', arabic: 'سَعِيد', hint: 'Feeling good' }
      ],
      recall: [
        { arabic: 'كِتَاب', english: 'book', hint: 'Reading material' },
        { arabic: 'قَلَم', english: 'pen', hint: 'Writing tool' },
        { arabic: 'مَاء', english: 'water', hint: 'Drink this' },
        { arabic: 'بَيْت', english: 'home', hint: 'Where you live' },
        { arabic: 'طَعَام', english: 'food', hint: 'You eat this' }
      ],
      fillBlanks: [
        { sentence: 'I read a _____ every day.', arabic: 'كِتَاب', options: ['book', 'pen', 'car', 'tree'], correct: 0 },
        { sentence: 'I write with a _____.', arabic: 'قَلَم', options: ['book', 'pen', 'car', 'tree'], correct: 1 },
        { sentence: 'I drink _____ when thirsty.', arabic: 'مَاء', options: ['food', 'water', 'milk', 'juice'], correct: 1 },
        { sentence: 'I live in a _____.', arabic: 'بَيْت', options: ['car', 'home', 'school', 'park'], correct: 1 },
        { sentence: 'I am _____ today!', arabic: 'سَعِيد', options: ['sad', 'happy', 'angry', 'tired'], correct: 1 }
      ]
    },
    sentences: {
      multipleChoice: [
        { question: 'What does "السَّلَامُ عَلَيْكُم" mean?', arabic: 'السَّلَامُ عَلَيْكُم', options: ['Peace be upon you', 'Good morning', 'Thank you', 'Goodbye'], correct: 0 },
        { question: 'What does "شُكْرًا" mean?', arabic: 'شُكْرًا', options: ['Hello', 'Goodbye', 'Thank you', 'Please'], correct: 2 },
        { question: 'What does "مَعَ السَّلَامَة" mean?', arabic: 'مَعَ السَّلَامَة', options: ['Hello', 'Goodbye', 'Thank you', 'Please'], correct: 1 },
        { question: 'What does "صَبَاحُ الخَيْر" mean?', arabic: 'صَبَاحُ الخَيْر', options: ['Good morning', 'Good night', 'Good afternoon', 'Good evening'], correct: 0 },
        { question: 'What does "كَيْفَ حَالُك" mean?', arabic: 'كَيْفَ حَالُك', options: ['What is your name?', 'How are you?', 'Where are you?', 'What time is it?'], correct: 1 }
      ],
      scrambledWords: [
        { word: 'hello', scrambled: 'olleh', arabic: 'مَرْحَبًا', hint: 'Greeting' },
        { word: 'thanks', scrambled: 'sknath', arabic: 'شُكْرًا', hint: 'Express gratitude' },
        { word: 'goodbye', scrambled: 'eydboog', arabic: 'مَعَ السَّلَامَة', hint: 'Farewell' },
        { word: 'please', scrambled: 'esaelp', arabic: 'مِن فَضْلِك', hint: 'Polite request' },
        { word: 'welcome', scrambled: 'emoclew', arabic: 'أَهْلًا وَسَهْلًا', hint: 'Greeting guests' }
      ],
      recall: [
        { arabic: 'السَّلَامُ عَلَيْكُم', english: 'peace be upon you', hint: 'Islamic greeting' },
        { arabic: 'شُكْرًا', english: 'thank you', hint: 'Express gratitude' },
        { arabic: 'مَرْحَبًا', english: 'hello', hint: 'Greeting' },
        { arabic: 'مَعَ السَّلَامَة', english: 'goodbye', hint: 'Farewell' },
        { arabic: 'كَيْفَ حَالُك', english: 'how are you', hint: 'Ask about wellbeing' }
      ]
    },
    colors: {
      multipleChoice: [
        { question: 'What color is "أَحْمَر"?', arabic: 'أَحْمَر', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 1 },
        { question: 'What color is "أَزْرَق"?', arabic: 'أَزْرَق', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 0 },
        { question: 'What color is "أَخْضَر"?', arabic: 'أَخْضَر', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 2 },
        { question: 'What color is "أَصْفَر"?', arabic: 'أَصْفَر', options: ['Blue', 'Red', 'Green', 'Yellow'], correct: 3 },
        { question: 'What color is "أَبْيَض"?', arabic: 'أَبْيَض', options: ['White', 'Black', 'Brown', 'Pink'], correct: 0 }
      ],
      scrambledWords: [
        { word: 'red', scrambled: 'der', arabic: 'أَحْمَر', hint: 'Color of apple' },
        { word: 'blue', scrambled: 'eulb', arabic: 'أَزْرَق', hint: 'Color of sky' },
        { word: 'green', scrambled: 'neerg', arabic: 'أَخْضَر', hint: 'Color of grass' },
        { word: 'yellow', scrambled: 'wolley', arabic: 'أَصْفَر', hint: 'Color of sun' },
        { word: 'white', scrambled: 'etihw', arabic: 'أَبْيَض', hint: 'Color of snow' }
      ],
      recall: [
        { arabic: 'أَحْمَر', english: 'red', hint: 'Color of apple' },
        { arabic: 'أَزْرَق', english: 'blue', hint: 'Color of sky' },
        { arabic: 'أَخْضَر', english: 'green', hint: 'Color of grass' },
        { arabic: 'أَصْفَر', english: 'yellow', hint: 'Color of sun' },
        { arabic: 'أَبْيَض', english: 'white', hint: 'Color of snow' }
      ]
    }
  };

  // Scramble letters for scrambled quiz
  const scrambleWord = (word) => {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  };

  // Initialize scrambled letters when starting scrambled quiz
  useEffect(() => {
    if (selectedQuizType?.id === 'scrambled-letters' && selectedTopic && currentQuestionIndex >= 0) {
      const content = quizContent[selectedTopic.id]?.scrambledWords;
      if (content && content[currentQuestionIndex]) {
        const word = content[currentQuestionIndex].word;
        setScrambledLetters(scrambleWord(word));
        setUserAnswer('');
      }
    }
  }, [selectedQuizType, selectedTopic, currentQuestionIndex]);

  const handleQuizTypeSelect = (type) => {
    setSelectedQuizType(type);
    setSelectedTopic(null);
    resetQuiz();
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    resetQuiz();
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setShowResults(false);
    setUserAnswer('');
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (showFeedback) return; // Prevent multiple selections

    setSelectedAnswer(answerIndex);

    // Get current question content
    let content;
    if (selectedQuizType.id === 'multiple-choice') {
      content = quizContent[selectedTopic.id]?.multipleChoice;
    } else if (selectedQuizType.id === 'fill-blanks') {
      content = quizContent[selectedTopic.id]?.fillBlanks;
    }

    if (content && content[currentQuestionIndex]) {
      const correct = content[currentQuestionIndex].correct === answerIndex;
      setIsCorrect(correct);
      setShowFeedback(true);

      if (correct) {
        setScore(score + 1);
        speak && speak(language === 'ar' ? 'صحيح' : 'Correct!');
      } else {
        speak && speak(language === 'ar' ? 'حاول مرة أخرى' : 'Try again');
      }

      setAnswers([...answers, { questionIndex: currentQuestionIndex, correct }]);

      setTimeout(() => {
        if (currentQuestionIndex < content.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedAnswer(null);
          setShowFeedback(false);
        } else {
          setShowResults(true);
        }
      }, 1500);
    }
  };

  const handleScrambledSubmit = () => {
    const content = quizContent[selectedTopic.id]?.scrambledWords;
    if (content && content[currentQuestionIndex]) {
      const correct = userAnswer.toLowerCase().trim() === content[currentQuestionIndex].word.toLowerCase();
      setIsCorrect(correct);
      setShowFeedback(true);

      if (correct) {
        setScore(score + 1);
        speak && speak(language === 'ar' ? 'صحيح' : 'Correct!');
      } else {
        speak && speak(language === 'ar' ? 'حاول مرة أخرى' : 'Try again');
      }

      setAnswers([...answers, { questionIndex: currentQuestionIndex, correct }]);

      setTimeout(() => {
        if (currentQuestionIndex < content.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setShowFeedback(false);
        } else {
          setShowResults(true);
        }
      }, 1500);
    }
  };

  const handleLetterClick = (letter, index) => {
    if (showFeedback) return;
    setUserAnswer(userAnswer + letter);
    setScrambledLetters(scrambledLetters.filter((_, i) => i !== index));
  };

  const handleBackspace = () => {
    if (userAnswer.length > 0) {
      const lastLetter = userAnswer[userAnswer.length - 1];
      setUserAnswer(userAnswer.slice(0, -1));
      setScrambledLetters([...scrambledLetters, lastLetter]);
    }
  };

  const handleRecallReveal = (reveal) => {
    const content = quizContent[selectedTopic.id]?.recall;
    if (content && content[currentQuestionIndex]) {
      if (reveal) {
        setShowFeedback(true);
        setIsCorrect(false); // Revealed answers don't count as correct
      }
    }
  };

  const handleRecallKnow = (known) => {
    setIsCorrect(known);
    setShowFeedback(true);

    if (known) {
      setScore(score + 1);
      speak && speak(language === 'ar' ? 'رائع' : 'Great!');
    }

    setAnswers([...answers, { questionIndex: currentQuestionIndex, correct: known }]);

    const content = quizContent[selectedTopic.id]?.recall;
    setTimeout(() => {
      if (currentQuestionIndex < content.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setShowFeedback(false);
      } else {
        setShowResults(true);
      }
    }, 1000);
  };

  // Render Quiz Type Selection
  if (!selectedQuizType) {
    return (
      <div className="quiz-center">
        <motion.div
          className="quiz-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="quiz-title">
            {language === 'ar' ? '🎯 مركز الاختبارات' : '🎯 Quiz Center'}
          </h2>
          <p className="quiz-subtitle">
            {language === 'ar'
              ? 'اختر نوع الاختبار لبدء التعلم'
              : 'Select a quiz type to start learning'}
          </p>
        </motion.div>

        <div className="quiz-types-grid">
          {quizTypes.map((type, index) => (
            <motion.div
              key={type.id}
              className="quiz-type-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleQuizTypeSelect(type)}
              style={{ borderColor: type.color }}
            >
              <div className="quiz-type-icon" style={{ color: type.color }}>
                {type.icon}
              </div>
              <h3 className="quiz-type-name">
                {language === 'ar' ? type.nameAr : type.nameEn}
              </h3>
              <p className="quiz-type-description">
                {type.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Render Topic Selection
  if (!selectedTopic) {
    return (
      <div className="quiz-center">
        <motion.div
          className="quiz-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button className="back-button" onClick={() => setSelectedQuizType(null)}>
            ← {language === 'ar' ? 'رجوع' : 'Back'}
          </button>
          <h2 className="quiz-title">
            {language === 'ar' ? selectedQuizType.nameAr : selectedQuizType.nameEn}
          </h2>
          <p className="quiz-subtitle">
            {language === 'ar' ? 'اختر موضوعًا' : 'Select a topic'}
          </p>
        </motion.div>

        <div className="topics-grid">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              className="topic-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleTopicSelect(topic)}
              style={{ borderColor: topic.color }}
            >
              <div className="topic-icon" style={{ color: topic.color }}>
                {topic.icon}
              </div>
              <h3 className="topic-name">
                {language === 'ar' ? topic.nameAr : topic.nameEn}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Render Results
  if (showResults) {
    const totalQuestions = answers.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 70;

    return (
      <div className="quiz-center">
        <motion.div
          className="quiz-results"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="results-icon">
            {passed ? '🎉' : '📚'}
          </div>
          <h2 className="results-title">
            {language === 'ar' ? 'النتيجة النهائية' : 'Quiz Complete!'}
          </h2>
          <div className="results-score">
            <div className="score-circle" style={{ borderColor: passed ? '#10b981' : '#f59e0b' }}>
              <span className="score-percentage">{percentage}%</span>
              <span className="score-fraction">{score}/{totalQuestions}</span>
            </div>
          </div>
          <p className="results-message">
            {passed
              ? (language === 'ar' ? 'رائع! لقد نجحت!' : 'Great job! You passed!')
              : (language === 'ar' ? 'حاول مرة أخرى!' : 'Keep practicing!')}
          </p>
          <div className="results-buttons">
            <button className="btn btn-primary" onClick={resetQuiz}>
              {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </button>
            <button className="btn btn-secondary" onClick={() => setSelectedTopic(null)}>
              {language === 'ar' ? 'اختر موضوعًا آخر' : 'Choose Another Topic'}
            </button>
            <button className="btn btn-secondary" onClick={() => setSelectedQuizType(null)}>
              {language === 'ar' ? 'العودة إلى الاختبارات' : 'Back to Quizzes'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Quiz Questions
  let content;
  let currentQuestion;

  if (selectedQuizType.id === 'multiple-choice') {
    content = quizContent[selectedTopic.id]?.multipleChoice;
    currentQuestion = content?.[currentQuestionIndex];
  } else if (selectedQuizType.id === 'scrambled-letters') {
    content = quizContent[selectedTopic.id]?.scrambledWords;
    currentQuestion = content?.[currentQuestionIndex];
  } else if (selectedQuizType.id === 'recall') {
    content = quizContent[selectedTopic.id]?.recall;
    currentQuestion = content?.[currentQuestionIndex];
  } else if (selectedQuizType.id === 'fill-blanks') {
    content = quizContent[selectedTopic.id]?.fillBlanks;
    currentQuestion = content?.[currentQuestionIndex];
  }

  if (!content || !currentQuestion) {
    return (
      <div className="quiz-center">
        <div className="quiz-error">
          <p>{language === 'ar' ? 'هذا الاختبار غير متوفر حاليًا' : 'This quiz is not available yet'}</p>
          <button className="btn btn-primary" onClick={() => setSelectedTopic(null)}>
            {language === 'ar' ? 'رجوع' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-center">
      <motion.div
        className="quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Quiz Header */}
        <div className="quiz-progress-header">
          <button className="back-button" onClick={() => setSelectedTopic(null)}>
            ← {language === 'ar' ? 'رجوع' : 'Back'}
          </button>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{
                width: `${((currentQuestionIndex + 1) / content.length) * 100}%`,
                backgroundColor: selectedTopic.color
              }}
            />
          </div>
          <span className="quiz-progress-text">
            {currentQuestionIndex + 1}/{content.length}
          </span>
        </div>

        {/* Quiz Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            className="quiz-question-container"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Multiple Choice Quiz */}
            {selectedQuizType.id === 'multiple-choice' && (
              <div className="quiz-question">
                <div className="arabic-display">
                  {currentQuestion.arabic}
                </div>
                <h3 className="question-text">{currentQuestion.question}</h3>
                <div className="options-grid">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className={`option-btn ${selectedAnswer === index ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showFeedback}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scrambled Letters Quiz */}
            {selectedQuizType.id === 'scrambled-letters' && (
              <div className="quiz-question scrambled-quiz">
                <div className="arabic-display">
                  {currentQuestion.arabic}
                </div>
                <p className="hint-text">💡 {currentQuestion.hint}</p>
                <h3 className="question-text">
                  {language === 'ar' ? 'رتب الحروف لتكوين الكلمة' : 'Arrange the letters to form the word'}
                </h3>

                <div className="answer-display">
                  {userAnswer || (
                    <span className="placeholder">
                      {language === 'ar' ? 'اضغط على الحروف أدناه' : 'Click letters below'}
                    </span>
                  )}
                </div>

                <div className="scrambled-letters">
                  {scrambledLetters.map((letter, index) => (
                    <button
                      key={index}
                      className="letter-btn"
                      onClick={() => handleLetterClick(letter, index)}
                      disabled={showFeedback}
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                <div className="scrambled-controls">
                  <button
                    className="btn btn-secondary"
                    onClick={handleBackspace}
                    disabled={showFeedback || userAnswer.length === 0}
                  >
                    ⌫ {language === 'ar' ? 'حذف' : 'Backspace'}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleScrambledSubmit}
                    disabled={showFeedback || userAnswer.length === 0}
                  >
                    ✓ {language === 'ar' ? 'تحقق' : 'Check'}
                  </button>
                </div>

                {showFeedback && (
                  <motion.div
                    className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {isCorrect ? (
                      <span>✓ {language === 'ar' ? 'صحيح!' : 'Correct!'}</span>
                    ) : (
                      <span>✗ {language === 'ar' ? `الإجابة الصحيحة: ${currentQuestion.word}` : `Correct answer: ${currentQuestion.word}`}</span>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Recall Quiz */}
            {selectedQuizType.id === 'recall' && (
              <div className="quiz-question recall-quiz">
                <div className="arabic-display-large">
                  {currentQuestion.arabic}
                </div>
                <p className="hint-text">💡 {currentQuestion.hint}</p>

                {!showFeedback ? (
                  <div className="recall-actions">
                    <h3 className="question-text">
                      {language === 'ar' ? 'هل تتذكر معنى هذه الكلمة؟' : 'Do you remember the meaning?'}
                    </h3>
                    <div className="recall-buttons">
                      <button className="btn btn-success" onClick={() => handleRecallKnow(true)}>
                        ✓ {language === 'ar' ? 'أعرف' : 'I Know'}
                      </button>
                      <button className="btn btn-warning" onClick={() => handleRecallReveal(true)}>
                        👁️ {language === 'ar' ? 'أظهر الإجابة' : 'Show Answer'}
                      </button>
                      <button className="btn btn-danger" onClick={() => handleRecallKnow(false)}>
                        ✗ {language === 'ar' ? 'لا أعرف' : "I Don't Know"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    className="recall-answer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="english-meaning">{currentQuestion.english}</div>
                    {isCorrect && <div className="feedback correct">✓ {language === 'ar' ? 'رائع!' : 'Great!'}</div>}
                  </motion.div>
                )}
              </div>
            )}

            {/* Fill in the Blanks Quiz */}
            {selectedQuizType.id === 'fill-blanks' && (
              <div className="quiz-question">
                <div className="arabic-display">
                  {currentQuestion.arabic}
                </div>
                <h3 className="question-text">{currentQuestion.sentence}</h3>
                <div className="options-grid">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className={`option-btn ${selectedAnswer === index ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showFeedback}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Score Display */}
        <div className="quiz-score-display">
          <span className="score-label">{language === 'ar' ? 'النقاط:' : 'Score:'}</span>
          <span className="score-value">{score}/{content.length}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizCenter;
