// src/components/ChatInterface.js
/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { toWords } from "number-to-words";
import { useNavigate } from "react-router-dom";
import "./ChatInterface.css";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

const bubbleVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.8,
    rotateX: -15
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: { duration: 0.2 }
  }
};

const headerVariants = {
  hidden: { 
    y: -50, 
    opacity: 0,
    scale: 0.9
  },
  show: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: 0.1
    }
  }
};

const inputVariants = {
  hidden: { 
    y: 50, 
    opacity: 0,
    scale: 0.95
  },
  show: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay: 0.4
    }
  }
};

const typingIndicatorVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

export default function ChatInterface() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { sender: "gpt", text: "Welcome! How can I help you today?", id: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const sendControls = useAnimation();
  const headerControls = useAnimation();
  const windowControls = useAnimation();

  // auto-scroll when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Header pulse animation on new messages
  useEffect(() => {
    if (messages.length > 1) {
      headerControls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 0.4 }
      });
    }
  }, [messages.length, headerControls]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    // Enhanced send button animation
    await sendControls.start({ 
      scale: 0.85,
      rotate: -5,
      transition: { duration: 0.1 }
    });
    sendControls.start({ 
      scale: 1,
      rotate: 0,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    });

    // Window shake effect for interaction feedback
    windowControls.start({
      x: [0, -2, 2, -1, 1, 0],
      transition: { duration: 0.3 }
    });

    // echo user message with unique ID
    const userMessage = { sender: "user", text, id: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // quick multiply shortcut
    const timesPattern = /(\d+)\s*(?:times|×|\*|x)\s*(\d+)/i;
    const match = timesPattern.exec(text);
    if (match) {
      setIsTyping(true);
      setTimeout(() => {
        const a = +match[1], b = +match[2], p = a * b;
        const reply = `${toWords(a)} times ${toWords(b)} equals ${toWords(p)}.`;
        setMessages(prev => [...prev, { sender: "gpt", text: reply, id: Date.now() + 1 }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // send to GPT with enhanced loading
    setIsSending(true);
    setIsTyping(true);
    const loadingMsg = { sender: "gpt", text: "…", loading: true, id: Date.now() + 1 };
    setMessages(prev => [...prev, loadingMsg]);
    
    try {
      const disability = localStorage.getItem("disability") || "none";
      const prompt = `You are helping a user with ${disability}. Answer simply and supportively.\n\nUser: ${text}`;
      const resp = await puter.ai.chat(prompt);

      let replyText =
        typeof resp === "string"
          ? resp
          : resp.message?.content ?? String(resp);
      replyText = replyText.trim().replace(/^[^0-9A-Za-z]+/, "");

      // Simulate typing delay for more natural feel
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => m.loading ? { sender: "gpt", text: replyText, id: m.id } : m)
        );
        setIsTyping(false);
      }, 800);

    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.loading
              ? { sender: "gpt", text: "⚠️ Something went wrong.", id: m.id }
              : m
          )
        );
        setIsTyping(false);
      }, 500);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      className="chat-area"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        background: "linear-gradient(135deg, #1a001a 0%, #000020 50%, #100018 100%)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 20s ease infinite"
      }}
    >
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(138, 43, 226, 0.3); }
          50% { box-shadow: 0 0 40px rgba(138, 43, 226, 0.6); }
        }
      `}</style>

      <motion.div
        className="chat-window"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={[
          { scale: 1, opacity: 1, y: 0 },
          windowControls
        ]}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          delay: 0.2
        }}
        style={{
          background: "rgba(26, 0, 26, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(138, 43, 226, 0.3)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(138, 43, 226, 0.1)"
        }}
      >
        {/* Enhanced Header */}
        <motion.div 
          className="chat-header"
          variants={headerVariants}
          initial="hidden"
          animate={[
            "show",
            headerControls
          ]}
          style={{
            background: "linear-gradient(135deg, #8e2de2, #4a00e0)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            }}
            animate={{
              left: ["−100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "linear"
            }}
          />
          <motion.span
            animate={{ 
              textShadow: [
                "0 0 10px rgba(255,255,255,0.5)",
                "0 0 20px rgba(255,255,255,0.8)",
                "0 0 10px rgba(255,255,255,0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨ AI Assistant Chat ✨
          </motion.span>
          
          {/* Status indicator */}
          <motion.div
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: isTyping ? "#ff6b6b" : "#51cf66"
            }}
            animate={{
              scale: isTyping ? [1, 1.5, 1] : [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{ 
              duration: isTyping ? 0.5 : 2, 
              repeat: Infinity 
            }}
          />
        </motion.div>

        {/* Enhanced Messages */}
        <motion.div
          className="chat-messages"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            background: "rgba(0, 0, 0, 0.2)",
            position: "relative"
          }}
        >
          {/* Floating particles background */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "rgba(138, 43, 226, 0.3)",
                left: `${20 + i * 15}%`,
                top: `${10 + i * 20}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                opacity: [0.3, 0.7, 0.3],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}

          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                className={`chat-bubble ${msg.sender}`}
                variants={bubbleVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                layout
                whileHover={{ 
                  scale: 1.03, 
                  y: -3,
                  boxShadow: msg.sender === 'user' 
                    ? "0 10px 30px rgba(138, 43, 226, 0.4)"
                    : "0 10px 30px rgba(0, 0, 0, 0.3)",
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: msg.sender === 'user' 
                    ? "linear-gradient(135deg, #8e2de2, #4a00e0)"
                    : "linear-gradient(135deg, rgba(38, 0, 46, 0.9), rgba(26, 0, 26, 0.9))",
                  border: msg.sender === 'gpt' ? "1px solid rgba(138, 43, 226, 0.2)" : "none",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Message shimmer effect */}
                {msg.sender === 'gpt' && !msg.loading && (
                  <motion.div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.1), transparent)",
                    }}
                    animate={{
                      left: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: idx * 0.2,
                      ease: "linear"
                    }}
                  />
                )}

                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {msg.text}
                </motion.span>

                {msg.loading && (
                  <motion.div 
                    className="loading-dots"
                    variants={typingIndicatorVariants}
                    initial="hidden"
                    animate="show"
                    style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      marginTop: '8px',
                      alignItems: 'center'
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div 
                        key={i}
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: 'currentColor',
                          boxShadow: '0 0 10px currentColor'
                        }}
                        animate={{ 
                          y: [-8, 8, -8],
                          scale: [0.8, 1.2, 0.8],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                          duration: 0.8, 
                          repeat: Infinity, 
                          delay: i * 0.2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </motion.div>

        {/* Enhanced Input Area */}
        <motion.div 
          className="chat-input-area"
          variants={inputVariants}
          initial="hidden"
          animate="show"
          style={{
            background: "rgba(26, 0, 26, 0.8)",
            borderTop: "1px solid rgba(138, 43, 226, 0.3)",
            position: "relative"
          }}
        >
          <motion.input
            className="chat-input"
            value={input}
            disabled={isSending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message…"
            whileFocus={{ 
              scale: 1.02,
              boxShadow: "0 0 20px rgba(138, 43, 226, 0.4)",
              borderColor: "rgba(138, 43, 226, 0.6)"
            }}
            transition={{ type: "spring", stiffness: 400 }}
            style={{
              background: "rgba(26, 0, 26, 0.9)",
              border: "1px solid rgba(138, 43, 226, 0.3)",
              transition: "all 0.3s ease"
            }}
          />
          
          <motion.button
            className="chat-send"
            onClick={handleSend}
            disabled={isSending}
            animate={sendControls}
            whileHover={!isSending ? { 
              scale: 1.08, 
              y: -3,
              boxShadow: "0 15px 35px rgba(138, 43, 226, 0.5)",
              background: "linear-gradient(135deg, #a855f7, #6366f1)"
            } : {}}
            whileTap={!isSending ? { 
              scale: 0.92, 
              y: 1,
              boxShadow: "0 5px 15px rgba(138, 43, 226, 0.3)"
            } : {}}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            style={{
              background: isSending 
                ? "linear-gradient(135deg, #6b7280, #4b5563)"
                : "linear-gradient(135deg, #8e2de2, #4a00e0)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Button glow effect */}
            {!isSending && (
              <motion.div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                  transform: "translateX(-100%)"
                }}
                whileHover={{
                  transform: "translateX(100%)",
                  transition: { duration: 0.6 }
                }}
              />
            )}
            
            {isSending ? (
              <motion.span
                animate={{ 
                  opacity: [1, 0.4, 1],
                  scale: [1, 0.95, 1]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ position: "relative", zIndex: 1 }}
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ display: "inline-block", marginRight: "8px" }}
                >
                  ⏳
                </motion.span>
                Sending...
              </motion.span>
            ) : (
              <motion.span
                style={{ position: "relative", zIndex: 1 }}
                whileHover={{ 
                  textShadow: "0 0 10px rgba(255,255,255,0.8)" 
                }}
              >
                Send ✨
              </motion.span>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}