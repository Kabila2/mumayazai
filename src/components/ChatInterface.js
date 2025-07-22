// src/components/ChatInterface.js
/* global puter */
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { toWords } from "number-to-words";
import { useNavigate } from "react-router-dom";
import "./ChatInterface.css";
import Dock from "../blocks/Dock/Dock";  // your existing Dock component

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const bubbleVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0 },
};

export default function ChatInterface() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { sender: "gpt", text: "Welcome! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const sendControls = useAnimation();

  // auto-scroll when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    // animate send button press
    await sendControls.start({ scale: 0.9 });
    sendControls.start({ scale: 1 });

    // echo user message
    setMessages(prev => [...prev, { sender: "user", text }]);
    setInput("");

    // quick multiply shortcut
    const timesPattern = /(\d+)\s*(?:times|×|\*|x)\s*(\d+)/i;
    const match = timesPattern.exec(text);
    if (match) {
      const a = +match[1], b = +match[2], p = a * b;
      const reply = `${toWords(a)} times ${toWords(b)} equals ${toWords(p)}.`;
      setMessages(prev => [...prev, { sender: "gpt", text: reply }]);
      return;
    }

    // send to GPT
    setIsSending(true);
    setMessages(prev => [...prev, { sender: "gpt", text: "…", loading: true }]);
    try {
      const resp = await puter.ai.chat(text);
      let replyText =
        typeof resp === "string"
          ? resp
          : resp.message?.content ?? String(resp);
      replyText = replyText.trim().replace(/^[^0-9A-Za-z]+/, "");

      setMessages(prev =>
        prev.map(m => m.loading ? { sender: "gpt", text: replyText } : m)
      );
    } catch (err) {
      console.error(err);
      setMessages(prev =>
        prev.map(m =>
          m.loading
            ? { sender: "gpt", text: "⚠️ Something went wrong." }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      className="chat-area"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="chat-window"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="chat-messages"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              className={`chat-bubble ${msg.sender}`}
              variants={bubbleVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              {msg.text}
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </motion.div>

        <div className="chat-input-area">
          <motion.input
            className="chat-input"
            value={input}
            disabled={isSending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message…"
            whileFocus={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          />
          <motion.button
            className="chat-send"
            onClick={handleSend}
            disabled={isSending}
            animate={sendControls}
            whileHover={!isSending ? { scale: 1.05, rotate: 2 } : {}}
            whileTap={!isSending ? { scale: 0.9, rotate: -2 } : {}}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            {isSending ? "…" : "Send"}
          </motion.button>
        </div>
      </motion.div>

      {/* Bottom dock */}
      <Dock
        style={{
          position: "fixed",
          bottom: 0,
          width: "100%",
          background: "#000",
          padding: "10px 0",
          display: "flex",
          justifyContent: "center",
          zIndex: 100,
        }}
      >
        <button
          className="dock-btn"
          onClick={() => navigate("/voice-chat")}
          aria-label="Voice Chat"
        >
          💬
        </button>
        <button
          className="dock-btn"
          onClick={() => navigate("/profile")}
          aria-label="Profile"
        >
          👤
        </button>
        <button
          className="dock-btn"
          onClick={() => navigate("/settings")}
          aria-label="Settings"
        >
          ⚙️
        </button>
      </Dock>
    </motion.div>
  );
}
