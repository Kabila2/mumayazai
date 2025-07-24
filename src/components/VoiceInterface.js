/* global puter */
import React, { useState, useRef, useEffect } from "react";
import "./VoiceInterface.css";
import Avatar from "../blocks/Avatar/Avatar";
import { translations } from "../translations";

export default function VoiceInterface() {
  const [messages, setMessages] = useState([]);
  const [isListening, setListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [language, setLanguage] = useState("en-US");
  const [summary, setSummary] = useState("");
  const recognitionRef = useRef(null);

  const t = (key) => translations.en[key] ?? key;

  // Load and filter system TTS voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const all = synth.getVoices();
      const filtered = all.filter((v) => v.lang.startsWith("en"));
      setVoices(filtered);
      if (!selectedVoice && filtered.length) {
        setSelectedVoice(filtered[0].name);
      }
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  // SpeechRecognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.lang = language;
    recog.interimResults = false;
    recog.continuous = false;
    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);
    recog.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setMessages((m) => [...m, { sender: "user", text }]);
      try {
        const disability = localStorage.getItem("disability") || "none";
        const prompt = `You are helping a user with ${disability}. Answer simply and supportively.\n\nUser: ${text}`;
        const resp = await puter.ai.chat(prompt);

        const reply =
          typeof resp === "string"
            ? resp
            : resp.message?.content ?? "";
        setMessages((m) => [
          ...m,
          { sender: "gpt", text: reply.trim() },
        ]);
        speak(reply.trim());
      } catch {
        setMessages((m) => [
          ...m,
          { sender: "gpt", text: "⚠️ Something went wrong." },
        ]);
      }
    };
    recognitionRef.current = recog;
  }, [language]);

  const startListening = () => recognitionRef.current?.start();

  const speak = (text) => {
    if (!window.speechSynthesis) {
      alert("Sorry, your browser does not support speech synthesis.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceObj = voices.find((v) => v.name === selectedVoice);
    if (voiceObj) {
      utterance.voice = voiceObj;
      utterance.lang = voiceObj.lang;
    } else {
      utterance.lang = language;
    }
    utterance.rate = speed;
    utterance.pitch = pitch;
    utterance.onstart = () => setListening(true);
    utterance.onend = () => setListening(false);
    window.speechSynthesis.speak(utterance);
  };

  const generateSummary = async () => {
    const prompt = `Summarize this conversation in 3 bullet points:\n${messages
      .map((m) => `${m.sender}: ${m.text}`)
      .join("\n")}`;
    try {
      const resp = await puter.ai.chat(prompt);
      const text = typeof resp === "string"
        ? resp
        : resp.message?.content;
      setSummary(text.trim());
    } catch {
      setSummary("⚠️ Unable to generate summary.");
    }
  };

  return (
    <div className="voice-area">
      <div className="avatar-main">
        <Avatar className="avatar-large" />
      </div>

      <div className="voice-container">
        <div className="voice-controls">
          <button onClick={startListening} disabled={isListening}>
            {isListening ? t("listening") : t("speak")}
          </button>
        </div>

       
      </div>

      <div className="voice-log">
        {messages.map((m, i) => (
          <div key={i} className={`log ${m.sender}`}>
            <strong>{m.sender === "user" ? t("you") : ""}</strong> {m.text}
          </div>
        ))}

        {summary && (
          <div className="summary">
            <strong>{t("summary")}</strong>
            <pre>{summary}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
