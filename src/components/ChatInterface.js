/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

// AI response function using puter.ai.chat
const getAIResponse = async (prompt) => {
  const resp = await puter.ai.chat(prompt);
  return typeof resp === "string" ? resp : resp.message?.content ?? "";
};

// Voice Interface Component
const VoiceInterface = ({ onSwitchMode, highContrast, fontSize }) => {
  const [messages, setMessages] = useState([]);
  const [isListening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const recognitionRef = useRef(null);
  const messagesRef = useRef(null);

  // Load voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const allVoices = synth.getVoices();
      const englishVoices = allVoices.filter(v => v.lang.startsWith("en"));
      setVoices(englishVoices);
      if (!selectedVoice && englishVoices.length) {
        setSelectedVoice(englishVoices[0].name);
      }
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => { synth.onvoiceschanged = null; };
  }, [selectedVoice]);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      if (navigator.vibrate) navigator.vibrate(100);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
      setMessages(prev => [...prev, {
        sender: "system",
        text: `❌ Speech recognition error: ${event.error}. Please try again.`,
        id: Date.now()
      }]);
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      const confidenceIcon = confidence > 0.8 ? "✅" : confidence > 0.5 ? "⚠️" : "❓";

      setMessages(prev => [...prev, {
        sender: "user",
        text: `${confidenceIcon} ${text}`,
        confidence,
        id: Date.now()
      }]);

      try {
        const disability = localStorage.getItem("disability") || "dyslexia";
        const prompt = `You are helping a user with ${disability}. Answer simply and supportively. Keep responses concise for voice interaction.\n\nUser: ${text}`;
        const reply = await getAIResponse(prompt);
        const cleanReply = reply.trim().replace(/[*_#]/g, '');

        setMessages(prev => [...prev, {
          sender: "gpt",
          text: cleanReply,
          id: Date.now() + 1
        }]);

        speak(cleanReply);
      } catch (error) {
        const errorMsg = "I'm sorry, I'm having trouble connecting right now. Please try again.";
        setMessages(prev => [...prev, {
          sender: "gpt",
          text: `⚠️ ${errorMsg}`,
          id: Date.now() + 1
        }]);
        speak(errorMsg);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    recognitionRef.current.start();
  };

  const speak = (text) => {
    if (!window.speechSynthesis) {
      alert("Sorry, your browser does not support speech synthesis.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceObj = voices.find(v => v.name === selectedVoice);
    if (voiceObj) {
      utterance.voice = voiceObj;
      utterance.lang = voiceObj.lang;
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = speed;
    utterance.pitch = pitch;
    utterance.volume = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <motion.div
      className={`voice-area ${highContrast ? 'high-contrast' : ''}`}
      style={{
        fontSize: `${fontSize}rem`,
        position: 'relative',
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '2rem 1rem',
        background: 'linear-gradient(135deg, #0a0a23 0%, #1a001a 50%, #000020 100%)',
        color: '#ffffff',
        fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
        overflow: 'hidden'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Switch Button */}
      <motion.button
        onClick={onSwitchMode}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#fff',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        ← Switch to Text Chat
      </motion.button>

      {/* Voice Controls */}
      <motion.div
        style={{
          display: 'flex',
          gap: '1rem',
          margin: '2rem 0',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          onClick={startListening}
          disabled={isListening || isSpeaking}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            background: isListening 
              ? 'linear-gradient(135deg, #4caf50, #45a049)'
              : 'linear-gradient(135deg, #8e2de2, #4a00e0)',
            border: 'none',
            borderRadius: '16px',
            color: '#ffffff',
            cursor: isListening || isSpeaking ? 'not-allowed' : 'pointer',
            minWidth: '160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: isListening || isSpeaking ? 0.7 : 1
          }}
          whileHover={!isListening && !isSpeaking ? { scale: 1.05, y: -3 } : {}}
          whileTap={!isListening && !isSpeaking ? { scale: 0.95 } : {}}
          animate={isListening ? { 
            boxShadow: [
              '0 0 20px rgba(76, 175, 80, 0.4)',
              '0 0 40px rgba(76, 175, 80, 0.8)',
              '0 0 20px rgba(76, 175, 80, 0.4)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>{isListening ? "🎤" : "🗣️"}</span>
          {isListening ? "Listening..." : "Speak Now"}
        </motion.button>

        {isSpeaking && (
          <motion.button
            onClick={stopSpeaking}
            style={{
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              background: '#f44336',
              border: 'none',
              borderRadius: '16px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
          >
            🔇 Stop
          </motion.button>
        )}

        <motion.button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: '0.8rem 1.5rem',
            fontSize: '1rem',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '16px',
            color: '#ffffff',
            cursor: 'pointer'
          }}
          whileHover={{ scale: 1.05 }}
        >
          ⚙️ Settings
        </motion.button>
      </motion.div>

      {/* Quick Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            style={{
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '1.5rem',
              margin: '1rem 0',
              minWidth: '300px'
            }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0d6ff' }}>
                Voice Speed: {speed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#e0d6ff' }}>
                Voice Pitch: {pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <button
              onClick={() => speak("This is a test of the voice settings.")}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              🔊 Test Voice
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Log */}
      <motion.div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '800px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginTop: '1rem',
          overflowY: 'auto',
          maxHeight: '50vh'
        }}
        ref={messagesRef}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: '600' }}>
            Conversation History
          </h3>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              style={{
                padding: '0.6rem 1.2rem',
                fontSize: '0.95rem',
                background: '#f44336',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              🗑️ Clear
            </button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              style={{
                background: msg.sender === 'user' 
                  ? 'rgba(138, 43, 226, 0.2)' 
                  : msg.sender === 'gpt' 
                  ? 'rgba(76, 175, 80, 0.2)' 
                  : 'rgba(255, 152, 0, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1rem',
                position: 'relative'
              }}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              layout
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {msg.sender === "user" ? "👤" : msg.sender === "gpt" ? "🤖" : "⚙️"}
                </span>
                <span style={{ fontWeight: '600', color: '#ffffff' }}>
                  {msg.sender === "user" ? "You" : msg.sender === "gpt" ? "Assistant" : "System"}
                </span>
                {msg.confidence && (
                  <span style={{
                    marginLeft: 'auto',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    background: msg.confidence > 0.8 
                      ? 'rgba(76, 175, 80, 0.3)' 
                      : msg.confidence > 0.5 
                      ? 'rgba(255, 152, 0, 0.3)' 
                      : 'rgba(244, 67, 54, 0.3)',
                    color: msg.confidence > 0.8 
                      ? '#4caf50' 
                      : msg.confidence > 0.5 
                      ? '#ff9800' 
                      : '#f44336'
                  }}>
                    {Math.round(msg.confidence * 100)}%
                  </span>
                )}
              </div>
              <div style={{
                color: '#e0d6ff',
                lineHeight: 1.6,
                wordWrap: 'break-word'
              }}>
                {msg.text}
              </div>
              {msg.sender === "gpt" && (
                <button
                  onClick={() => speak(msg.text.replace(/[⚠️❌]/g, ''))}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.2rem',
                    color: '#b199ff',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    padding: '0.5rem'
                  }}
                >
                  🔄
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length === 0 && (
          <motion.div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: '#b199ff'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem', opacity: 0.6 }}>🎙️</div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#e0d6ff', fontSize: '1.5rem' }}>Ready to chat!</h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '1.1rem' }}>Click "Speak Now" to start your voice conversation.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Chat Interface Component
const ChatInterface = ({ onSwitchMode, fontSize, highContrast }) => {
  const [messages, setMessages] = useState([
    {
      sender: "gpt",
      text: "Hi there! 👋 I know you have dyslexia, and I'll provide dyslexia-friendly support. What would you like to work on today?",
      id: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const controls = useAnimation();
  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    await controls.start({ scale: 0.95, transition: { duration: 0.1 } });
    controls.start({ scale: 1, transition: { type: "spring", stiffness: 300, damping: 15 } });

    const userId = Date.now();
    setMessages(prev => [...prev, { sender: "user", text, id: userId }]);
    setInput("");

    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { sender: "gpt", loading: true, id: loadingId }]);

    try {
      const disability = localStorage.getItem("disability") || "dyslexia";
      const prompt = `You are helping a user with ${disability}. Answer directly and supportively.\n\nUser: ${text}`;
      const resp = await getAIResponse(prompt);
      const clean = resp.trim().replace(/[*_#]/g, '');

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: clean, id: loadingId } : m
        )
      );
    } catch (error) {
      const err = "Sorry, I'm having trouble right now. Please try again later.";
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId ? { sender: "gpt", text: err, id: loadingId } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        fontSize: `${fontSize}rem`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0',
        background: 'linear-gradient(135deg, #1a001a, #000020, #100018)',
        minHeight: '100vh',
        fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif"
      }}
    >
      {/* Switch Button */}
      <motion.button
        onClick={onSwitchMode}
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#fff',
          fontSize: '0.9rem',
          cursor: 'pointer',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          zIndex: 10
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        → Switch to Voice Chat
      </motion.button>

      <div
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(26, 0, 26, 0.8)',
          backdropFilter: 'blur(15px)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <motion.div
          style={{
            padding: '1rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: '#ffffff',
            textAlign: 'center',
            fontSize: '1.2rem'
          }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          Dyslexia-Friendly Chat Assistant 💚
        </motion.div>

        {/* Messages */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          direction: 'ltr'
        }}>
          <AnimatePresence mode="popLayout">
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                style={{
                  maxWidth: '80%',
                  padding: '1rem 1.5rem',
                  borderRadius: '16px',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #4CAF50, #45a049)' 
                    : 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(69, 160, 73, 0.1))',
                  color: msg.sender === 'user' ? '#ffffff' : '#e8f5e8',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  border: `2px solid ${msg.sender === 'user' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.3)'}`,
                  lineHeight: 1.8,
                  letterSpacing: '0.05em',
                  wordSpacing: '0.15em',
                  textAlign: 'left',
                  direction: 'ltr'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {msg.loading ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>Thinking</span>
                    {[0,1,2].map(i => (
                      <motion.div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#4CAF50'
                        }}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          delay: i * 0.2
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

        {/* Input Area */}
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(0,0,0,0.2)', 
          display: 'flex', 
          gap: '0.75rem',
          borderTop: '2px solid rgba(76, 175, 80, 0.3)',
          direction: 'ltr'
        }}>
          <motion.input
            value={input}
            disabled={isSending}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: '2px solid rgba(76, 175, 80, 0.4)',
              background: 'rgba(26, 0, 26, 0.9)',
              color: '#e8f5e8',
              outline: 'none',
              fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
              fontSize: '1rem',
              letterSpacing: '0.05em',
              lineHeight: 1.6,
              textAlign: 'left',
              direction: 'ltr'
            }}
            whileFocus={{ 
              borderColor: '#4CAF50',
              boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.3)'
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
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              color: '#ffffff',
              cursor: isSending || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: isSending || !input.trim() ? 0.6 : 1,
              fontWeight: '600',
              fontSize: '1rem',
              minWidth: '80px'
            }}
            whileHover={!isSending && input.trim() ? { scale: 1.05, y: -3 } : {}}
            whileTap={!isSending && input.trim() ? { scale: 0.95 } : {}}
          >
            {isSending ? "Sending..." : "Send"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [mode, setMode] = useState("text");
  const [fontSize, setFontSize] = useState(1.1);
  const [highContrast, setHighContrast] = useState(false);

  // Initialize disability preference
  useEffect(() => {
    if (!localStorage.getItem("disability")) {
      localStorage.setItem("disability", "dyslexia");
    }
  }, []);

  const switchMode = () => {
    setMode(mode === "text" ? "voice" : "text");
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      overflow: 'hidden',
      fontFamily: "'Lexend', 'Open Dyslexic', Arial, sans-serif",
      direction: 'ltr'
    }}>
      {mode === "text" ? (
        <ChatInterface
          onSwitchMode={switchMode}
          fontSize={fontSize}
          highContrast={highContrast}
        />
      ) : (
        <VoiceInterface
          onSwitchMode={switchMode}
          fontSize={fontSize}
          highContrast={highContrast}
        />
      )}
    </div>
  );
}