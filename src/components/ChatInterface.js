// Enhanced ChatInterface.js with Memory, Storage, Quiz & Leaderboard
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { 
  getCurrentDisability, 
  getDisabilityTheme,
  getWelcomeMessage,
  createDisabilityAwarePrompt,
  formatAIResponse,
  getDisabilityErrorMessage
} from "../utils/disabilityUtils";

// Enhanced storage utilities
const STORAGE_KEYS = {
  CHAT_SESSIONS: 'mumayaz_chat_sessions',
  USER_SCORES: 'mumayaz_user_scores',
  QUIZ_PROGRESS: 'mumayaz_quiz_progress',
  DAILY_TASKS: 'mumayaz_daily_tasks'
};

// Session Memory Management
class ChatMemory {
  constructor(userId, disability) {
    this.userId = userId;
    this.disability = disability;
    this.sessionId = Date.now().toString();
    this.context = [];
    this.maxContextLength = 10; // Keep last 10 exchanges for context
  }

  addExchange(userMessage, aiResponse) {
    this.context.push({
      user: userMessage,
      ai: aiResponse,
      timestamp: Date.now(),
      disability: this.disability
    });
    
    // Keep context manageable
    if (this.context.length > this.maxContextLength) {
      this.context = this.context.slice(-this.maxContextLength);
    }
  }

  getContextPrompt() {
    if (this.context.length === 0) return "";
    
    const contextString = this.context
      .map(exchange => `Previous User: ${exchange.user}\nPrevious Assistant: ${exchange.ai}`)
      .join('\n\n');
    
    return `\n\nPrevious conversation context (for continuity in ${this.disability.toUpperCase()} mode):\n${contextString}\n\nCurrent conversation:`;
  }

  saveSession() {
    const sessions = this.getSavedSessions();
    const sessionData = {
      id: this.sessionId,
      userId: this.userId,
      disability: this.disability,
      context: this.context,
      created: Date.now(),
      lastUpdated: Date.now(),
      title: this.generateTitle()
    };
    
    sessions[this.sessionId] = sessionData;
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    return sessionData;
  }

  getSavedSessions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS)) || {};
    } catch {
      return {};
    }
  }

  generateTitle() {
    if (this.context.length === 0) return `${this.disability.toUpperCase()} Chat Session`;
    
    const firstMessage = this.context[0]?.user || '';
    const title = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
    return title || `${this.disability.toUpperCase()} Chat - ${new Date().toLocaleDateString()}`;
  }

  loadSession(sessionId) {
    const sessions = this.getSavedSessions();
    if (sessions[sessionId]) {
      this.context = sessions[sessionId].context || [];
      this.sessionId = sessionId;
      return true;
    }
    return false;
  }
}

// Quiz System
class QuizSystem {
  constructor(disability) {
    this.disability = disability;
    this.questions = this.getDisabilityQuestions();
  }

  getDisabilityQuestions() {
    const baseQuestions = {
      dyslexia: [
        {
          question: "What reading strategy helps with dyslexia?",
          options: ["Speed reading", "Breaking words into syllables", "Reading in dim light", "Memorizing entire texts"],
          correct: 1,
          explanation: "Breaking words into syllables helps dyslexic readers process text more effectively."
        },
        {
          question: "Which font is most dyslexia-friendly?",
          options: ["Times New Roman", "Comic Sans", "Lexend", "Courier"],
          correct: 2,
          explanation: "Lexend font is specifically designed to improve reading proficiency."
        },
        {
          question: "What background color combination reduces visual stress for dyslexia?",
          options: ["Black on white", "White on black", "Blue on yellow", "Red on green"],
          correct: 2,
          explanation: "Blue text on yellow background can reduce visual stress for many with dyslexia."
        }
      ],
      adhd: [
        {
          question: "What is the Pomodoro Technique good for with ADHD?",
          options: ["Cooking", "Breaking tasks into focused intervals", "Exercise", "Sleeping"],
          correct: 1,
          explanation: "The Pomodoro Technique helps ADHD individuals maintain focus through structured time intervals."
        },
        {
          question: "Which environment helps ADHD focus?",
          options: ["Noisy and busy", "Quiet with minimal distractions", "Dark rooms", "Crowded spaces"],
          correct: 1,
          explanation: "A quiet environment with minimal visual and auditory distractions supports ADHD focus."
        },
        {
          question: "What's a good ADHD study strategy?",
          options: ["Study for 4 hours straight", "Use fidget tools while learning", "Study in bed", "Multitask heavily"],
          correct: 1,
          explanation: "Fidget tools can help ADHD individuals channel excess energy while maintaining focus."
        }
      ],
      autism: [
        {
          question: "What helps autistic individuals with routine?",
          options: ["Constant surprises", "Predictable schedules", "Random activities", "Chaos"],
          correct: 1,
          explanation: "Predictable schedules and routines provide comfort and reduce anxiety for autistic individuals."
        },
        {
          question: "Which communication style works best?",
          options: ["Indirect hints", "Direct, clear language", "Sarcasm", "Abstract metaphors"],
          correct: 1,
          explanation: "Direct, clear communication reduces confusion and supports autistic understanding."
        },
        {
          question: "What's important for sensory sensitivity?",
          options: ["Bright lights always", "Loud environments", "Sensory-friendly spaces", "Overwhelming stimuli"],
          correct: 2,
          explanation: "Sensory-friendly environments help autistic individuals manage sensory sensitivities."
        }
      ]
    };

    return baseQuestions[this.disability] || baseQuestions.dyslexia;
  }

  getDailyQuestion() {
    const today = new Date().toDateString();
    const progress = this.getQuizProgress();
    
    if (progress.lastQuizDate === today && progress.todayCompleted) {
      return null; // Already completed today
    }

    const questionIndex = progress.currentIndex || 0;
    return {
      ...this.questions[questionIndex % this.questions.length],
      index: questionIndex
    };
  }

  submitAnswer(questionIndex, selectedAnswer) {
    const question = this.questions[questionIndex % this.questions.length];
    const isCorrect = selectedAnswer === question.correct;
    
    const progress = this.getQuizProgress();
    progress.lastQuizDate = new Date().toDateString();
    progress.todayCompleted = true;
    progress.currentIndex = (questionIndex + 1) % this.questions.length;
    progress.totalAnswered = (progress.totalAnswered || 0) + 1;
    progress.correctAnswers = (progress.correctAnswers || 0) + (isCorrect ? 1 : 0);
    
    localStorage.setItem(STORAGE_KEYS.QUIZ_PROGRESS, JSON.stringify(progress));
    
    // Update user score
    if (isCorrect) {
      this.updateScore(10); // 10 points for correct answer
    }

    return {
      correct: isCorrect,
      explanation: question.explanation,
      progress
    };
  }

  getQuizProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZ_PROGRESS)) || {};
    } catch {
      return {};
    }
  }

  updateScore(points) {
    const userId = localStorage.getItem('mumayaz_session')?.email || 'anonymous';
    const scores = this.getUserScores();
    
    if (!scores[userId]) {
      scores[userId] = {
        totalScore: 0,
        quizzes: 0,
        chats: 0,
        disability: this.disability,
        name: userId
      };
    }

    scores[userId].totalScore += points;
    scores[userId].quizzes += 1;
    localStorage.setItem(STORAGE_KEYS.USER_SCORES, JSON.stringify(scores));
    
    return scores[userId];
  }

  getUserScores() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_SCORES)) || {};
    } catch {
      return {};
    }
  }
}

// Leaderboard System
class LeaderboardSystem {
  constructor() {
    this.scores = this.loadScores();
  }

  loadScores() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_SCORES)) || {};
    } catch {
      return {};
    }
  }

  getTopUsers(limit = 10) {
    const users = Object.values(this.scores);
    return users
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
  }

  getUserRank(userId) {
    const sortedUsers = Object.entries(this.scores)
      .sort(([,a], [,b]) => b.totalScore - a.totalScore);
    
    const userIndex = sortedUsers.findIndex(([id]) => id === userId);
    return userIndex >= 0 ? userIndex + 1 : null;
  }
}

// Enhanced ChatInterface Component
const ChatInterface = ({ 
  onSwitchMode, 
  fontSize, 
  highContrast, 
  assistantTitle,
  currentDisability = "dyslexia",
  t = {},
  language = "en",
  reducedMotion = false,
  onSignOut
}) => {
  
  const activeDisability = currentDisability || getCurrentDisability();
  const theme = getDisabilityTheme(activeDisability);
  const [chatMemory] = useState(new ChatMemory('user', activeDisability));
  const [quizSystem] = useState(new QuizSystem(activeDisability));
  const [leaderboard] = useState(new LeaderboardSystem());
  
  // Enhanced state management
  const [messages, setMessages] = useState([
    {
      sender: "gpt",
      text: getWelcomeMessage(activeDisability),
      id: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'saved', 'quiz', 'leaderboard'
  const [savedSessions, setSavedSessions] = useState([]);
  const [dailyQuiz, setDailyQuiz] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const controls = useAnimation();

  // Load saved sessions and daily quiz on mount
  useEffect(() => {
    loadSavedSessions();
    loadDailyQuiz();
    loadUserStats();
  }, []);

  const loadSavedSessions = useCallback(() => {
    const sessions = Object.values(chatMemory.getSavedSessions())
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
    setSavedSessions(sessions);
  }, [chatMemory]);

  const loadDailyQuiz = useCallback(() => {
    const quiz = quizSystem.getDailyQuestion();
    setDailyQuiz(quiz);
  }, [quizSystem]);

  const loadUserStats = useCallback(() => {
    const userId = 'user'; // Get from auth
    const scores = quizSystem.getUserScores();
    const userRank = leaderboard.getUserRank(userId);
    setUserStats({
      ...scores[userId],
      rank: userRank
    });
  }, [quizSystem, leaderboard]);

  // Enhanced AI communication with memory
  const getAIResponse = async (prompt, disability) => {
    try {
      const contextPrompt = chatMemory.getContextPrompt();
      const enhancedPrompt = createDisabilityAwarePrompt(prompt + contextPrompt, disability, false);
      
      // Mock AI response for demo
      const response = `Based on our previous conversation and your ${disability} needs, here's my response to "${prompt}". I remember what we discussed earlier and I'm continuing our conversation with that context in mind.`;
      
      return formatAIResponse(response, disability);
    } catch (err) {
      return getDisabilityErrorMessage(disability);
    }
  };

  // Enhanced send handler with memory
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    const userId = Date.now();
    setMessages(prev => [...prev, { sender: "user", text, id: userId }]);
    setInput("");

    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { sender: "gpt", loading: true, id: loadingId }]);

    try {
      const response = await getAIResponse(text, activeDisability);
      
      // Add to memory
      chatMemory.addExchange(text, response);
      
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: response, id: loadingId } : m
        )
      );
      
      // Update chat score
      quizSystem.updateScore(5); // 5 points per chat message
      loadUserStats();
      
    } catch (err) {
      const errorMsg = getDisabilityErrorMessage(activeDisability);
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: errorMsg, id: loadingId } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, activeDisability, chatMemory, quizSystem]);

  // Save current session
  const saveCurrentSession = useCallback(() => {
    if (messages.length > 1) { // Don't save empty sessions
      const sessionData = chatMemory.saveSession();
      loadSavedSessions();
      alert(`Session saved: "${sessionData.title}"`);
    }
  }, [messages, chatMemory, loadSavedSessions]);

  // Load saved session
  const loadSession = useCallback((sessionId) => {
    const sessions = chatMemory.getSavedSessions();
    const session = sessions[sessionId];
    if (session) {
      const sessionMessages = [
        {
          sender: "gpt",
          text: `Loaded previous ${session.disability.toUpperCase()} session: "${session.title}"`,
          id: Date.now()
        }
      ];
      
      session.context.forEach(exchange => {
        sessionMessages.push(
          { sender: "user", text: exchange.user, id: Date.now() + Math.random() },
          { sender: "gpt", text: exchange.ai, id: Date.now() + Math.random() }
        );
      });

      setMessages(sessionMessages);
      chatMemory.loadSession(sessionId);
      setCurrentView('chat');
    }
  }, [chatMemory]);

  // Handle quiz answer
  const handleQuizAnswer = useCallback((selectedAnswer) => {
    if (!dailyQuiz) return;

    const result = quizSystem.submitAnswer(dailyQuiz.index, selectedAnswer);
    setShowQuizResult(result);
    loadUserStats();
    
    setTimeout(() => {
      setShowQuizResult(null);
      setDailyQuiz(null);
    }, 3000);
  }, [dailyQuiz, quizSystem]);

  // Keyboard handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Navigation buttons
  const NavigationBar = () => (
    <motion.div
      style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}
    >
      {[
        { view: 'chat', label: 'Chat', icon: '💬' },
        { view: 'saved', label: 'Saved', icon: '💾' },
        { view: 'quiz', label: 'Daily Quiz', icon: '🧩' },
        { view: 'leaderboard', label: 'Leaderboard', icon: '🏆' }
      ].map(({ view, label, icon }) => (
        <button
          key={view}
          onClick={() => setCurrentView(view)}
          style={{
            padding: '0.5rem 1rem',
            background: currentView === view ? theme.bubbleUserBg : 'transparent',
            color: theme.textColor,
            border: `2px solid ${theme.borderColor}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          {icon} {label}
        </button>
      ))}
    </motion.div>
  );

  // Saved Sessions View
  const SavedSessionsView = () => (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ color: theme.textColor, marginBottom: '1rem' }}>
        Saved Chat Sessions
      </h3>
      {savedSessions.length === 0 ? (
        <p style={{ color: theme.textColor, opacity: 0.7 }}>
          No saved sessions yet. Start chatting and save your conversations!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {savedSessions.map(session => (
            <motion.div
              key={session.id}
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: `1px solid ${theme.borderColor}`,
                cursor: 'pointer'
              }}
              whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.15)' }}
              onClick={() => loadSession(session.id)}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: theme.textColor }}>
                {session.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                {session.disability.toUpperCase()} • {new Date(session.created).toLocaleDateString()} • {session.context.length} messages
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // Quiz View
  const QuizView = () => (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ color: theme.textColor, marginBottom: '1rem' }}>
        Daily Quiz - {activeDisability.toUpperCase()} Mode
      </h3>
      
      {showQuizResult && (
        <motion.div
          style={{
            background: showQuizResult.correct ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: `2px solid ${showQuizResult.correct ? '#4CAF50' : '#F44336'}`
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0', color: theme.textColor }}>
            {showQuizResult.correct ? '🎉 Correct!' : '❌ Incorrect'}
          </h4>
          <p style={{ margin: 0, color: theme.textColor }}>
            {showQuizResult.explanation}
          </p>
          {showQuizResult.correct && (
            <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold', color: '#4CAF50' }}>
              +10 points earned!
            </p>
          )}
        </motion.div>
      )}

      {!dailyQuiz ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: theme.textColor, fontSize: '1.2rem' }}>
            🎉 You've completed today's quiz!
          </p>
          <p style={{ color: theme.textColor, opacity: 0.8 }}>
            Come back tomorrow for a new question.
          </p>
        </div>
      ) : (
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: theme.textColor, marginBottom: '1rem' }}>
              {dailyQuiz.question}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dailyQuiz.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleQuizAnswer(index)}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    color: theme.textColor,
                    border: `2px solid ${theme.borderColor}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {userStats && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '1rem',
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <h4 style={{ color: theme.textColor, margin: '0 0 0.5rem 0' }}>
            Your Quiz Stats
          </h4>
          <p style={{ margin: '0.25rem 0', color: theme.textColor }}>
            Quizzes completed: {userStats.quizzes || 0}
          </p>
          <p style={{ margin: '0.25rem 0', color: theme.textColor }}>
            Accuracy: {userStats.quizzes > 0 ? Math.round((userStats.correctAnswers || 0) / userStats.quizzes * 100) : 0}%
          </p>
        </div>
      )}
    </div>
  );

  // Leaderboard View
  const LeaderboardView = () => {
    const topUsers = leaderboard.getTopUsers();
    
    return (
      <div style={{ padding: '1rem' }}>
        <h3 style={{ color: theme.textColor, marginBottom: '1rem' }}>
          🏆 Accessibility Champion Leaderboard
        </h3>
        
        {userStats && userStats.rank && (
          <div style={{
            background: theme.bubbleUserBg,
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>
              Your Rank: #{userStats.rank}
            </h4>
            <p style={{ margin: 0, color: '#fff' }}>
              Total Score: {userStats.totalScore || 0} points
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {topUsers.map((user, index) => (
            <motion.div
              key={user.name}
              style={{
                background: index < 3 ? 
                  'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2))' :
                  'rgba(255,255,255,0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: `2px solid ${index < 3 ? '#FFD700' : theme.borderColor}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div>
                <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${user.rank}`}
                </span>
                <strong style={{ color: theme.textColor }}>
                  {user.name}
                </strong>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, color: theme.textColor }}>
                  {user.disability?.toUpperCase()} • {user.chats || 0} chats • {user.quizzes || 0} quizzes
                </div>
              </div>
              <div style={{ 
                color: theme.textColor, 
                fontWeight: 'bold', 
                fontSize: '1.1rem' 
              }}>
                {user.totalScore} pts
              </div>
            </motion.div>
          ))}
        </div>

        {topUsers.length === 0 && (
          <p style={{ color: theme.textColor, textAlign: 'center', padding: '2rem' }}>
            No users on the leaderboard yet. Be the first to earn points!
          </p>
        )}
      </div>
    );
  };

  // Main render
  return (
    <div style={{
      position: 'relative',
      fontSize: `${fontSize}rem`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0',
      background: 'linear-gradient(135deg, #1a001a, #000020, #100018)',
      minHeight: '100vh',
      fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
    }}>
      {/* Enhanced Top Navigation Bar */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          background: 'rgba(26, 0, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: `2px solid ${theme.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 1000
        }}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.6, type: "spring", stiffness: 100 }}
      >
        <motion.button
          onClick={onSwitchMode}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            border: `2px solid ${theme.borderColor}`,
            borderRadius: '12px',
            color: theme.textColor,
            padding: '0.7rem 1.2rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          <span>🎤</span> Voice
        </motion.button>

        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{ color: theme.textColor, fontWeight: '700', fontSize: '1.1rem' }}>
            {assistantTitle}
          </div>
          {userStats && (
            <div style={{ fontSize: '0.7rem', opacity: 0.8, color: theme.textColor }}>
              Score: {userStats.totalScore || 0} • Rank: #{userStats.rank || 'Unranked'}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {currentView === 'chat' && (
            <motion.button
              onClick={saveCurrentSession}
              style={{
                background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                padding: '0.7rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              💾 Save
            </motion.button>
          )}
          
                      <motion.button
            onClick={onSignOut}
            style={{
              background: 'linear-gradient(135deg, #ff4757, #ff3838)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              padding: '0.7rem 1.2rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}
          >
            Sign Out
          </motion.button>
        </div>
      </motion.div>

      {/* Main Chat Container with Navigation */}
      <div style={{
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(26, 0, 26, 0.8)',
        backdropFilter: 'blur(15px)',
        overflow: 'hidden',
        paddingTop: '80px'
      }}>
        {/* Navigation Bar */}
        <div style={{ padding: '1rem' }}>
          <NavigationBar />
        </div>

        {/* Dynamic Content Area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {currentView === 'chat' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Messages Area */}
              <div 
                ref={messagesRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <AnimatePresence mode="popLayout">
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      style={{
                        maxWidth: '80%',
                        padding: '1rem 1.5rem',
                        borderRadius: '16px',
                        background: msg.sender === 'user' ? theme.bubbleUserBg : theme.bubbleGptBg,
                        color: msg.sender === 'user' ? '#ffffff' : theme.textColor,
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        border: `2px solid ${theme.borderColor}`,
                        lineHeight: 1.8,
                        letterSpacing: '0.04em',
                        wordSpacing: '0.12em',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                      }}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 200, 
                        damping: 20,
                        duration: reducedMotion ? 0.1 : 0.4
                      }}
                      layout
                    >
                      {msg.loading ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span>Thinking with memory context...</span>
                          {[0,1,2].map(i => (
                            <motion.div
                              key={i}
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: theme.primary
                              }}
                              animate={{ 
                                scale: reducedMotion ? 1 : [1, 1.4, 1], 
                                opacity: reducedMotion ? 0.7 : [0.4, 1, 0.4] 
                              }}
                              transition={{ 
                                duration: reducedMotion ? 0 : 1.2, 
                                repeat: reducedMotion ? 0 : Infinity, 
                                delay: reducedMotion ? 0 : i * 0.15 
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </motion.div>
                  ))}
                  <div ref={bottomRef} />
                </AnimatePresence>
              </div>

              {/* Input Area with Memory Indicator */}
              <motion.div 
                style={{
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  borderTop: `2px solid ${theme.borderColor}`,
                  flexShrink: 0
                }}
              >
                {/* Memory Status */}
                {chatMemory.context.length > 0 && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: theme.textColor,
                    opacity: 0.7,
                    textAlign: 'center'
                  }}>
                    Remembering {chatMemory.context.length} previous exchanges for context
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <motion.input
                    ref={inputRef}
                    value={input}
                    disabled={isSending}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Chat with memory context (${activeDisability.toUpperCase()} mode)`}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: `2px solid ${theme.inputBorderColor}`,
                      background: 'rgba(26, 0, 26, 0.9)',
                      color: theme.textColor,
                      outline: 'none',
                      fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
                      fontSize: '1rem',
                      letterSpacing: '0.04em',
                      lineHeight: 1.6
                    }}
                  />
                  <motion.button
                    onClick={handleSend}
                    disabled={isSending || !input.trim()}
                    animate={controls}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: theme.bubbleUserBg,
                      color: '#ffffff',
                      cursor: isSending || !input.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSending || !input.trim() ? 0.6 : 1,
                      fontWeight: '600',
                      fontSize: '1rem',
                      minWidth: '100px'
                    }}
                  >
                    {isSending ? "Sending..." : "Send"}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}

          {currentView === 'saved' && <SavedSessionsView />}
          {currentView === 'quiz' && <QuizView />}
          {currentView === 'leaderboard' && <LeaderboardView />}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;