import React, { useState, useMemo } from "react";
import "./App.css";
import { useViewportHeight } from "./hooks/useViewportHeight";
import { useIsMobile } from "./hooks/useIsMobile";
import MobileNav from "./components/MobileNav";

/* Dummy icons as inline SVG (replace with your own if needed) */
function IconHome(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" stroke="currentColor" strokeWidth="1.5"/></svg>); }
function IconChat(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 12a8.5 8.5 0 1 1-3.03-6.53" stroke="currentColor" strokeWidth="1.5"/><path d="M21 6v4h-4" stroke="currentColor" strokeWidth="1.5"/></svg>); }
function IconSettings(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.5"/><path d="M19 12a7 7 0 0 0-.1-1.2l2.1-1.6-2-3.5-2.6.8A7 7 0 0 0 14 5l-.4-2.7h-4.3L9 5a7 7 0 0 0-2.4 1.5l-2.6-.8-2 3.5L4 10.8A7 7 0 0 0 4 12c0 .4 0 .8.1 1.2l-2.1 1.6 2 3.5 2.6-.8A7 7 0 0 0 10 19l.4 2.7h4.3L15 19a7 7 0 0 0 2.4-1.5l2.6.8 2-3.5-2.1-1.6c.1-.4.1-.8.1-1.2Z" stroke="currentColor" strokeWidth="1.2"/></svg>); }
function IconUser(){ return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" stroke="currentColor" strokeWidth="1.5"/></svg>); }

function HomeView(){
  return (
    <div className="container stack">
      <h1 style={{fontSize:"var(--font-xl)", margin:0}}>Mumayaz</h1>
      <p style={{color:"var(--muted)"}}>Welcome back. This layout is mobile-optimized.</p>

      <div className="card stack">
        <h2 style={{fontSize:"var(--font-lg)", margin:0}}>Quick Actions</h2>
        <div className="row">
          <button className="button">Start Learning</button>
          <button className="button">Parent Dashboard</button>
          <a className="button" href="#settings">Settings</a>
        </div>
      </div>

      <div className="card stack">
        <h2 style={{fontSize:"var(--font-lg)", margin:0}}>Recent</h2>
        <p style={{margin:0}}>Your latest sessions will appear here.</p>
      </div>
    </div>
  );
}

function ChatView(){
  return (
    <div className="container stack">
      <h1 style={{fontSize:"var(--font-lg)", margin:0}}>Chat</h1>
      <div className="card stack">
        <label htmlFor="message">Message</label>
        <textarea id="message" className="textarea" rows="5" placeholder="Ask anything…"></textarea>
        <div className="row">
          <button className="button">Send</button>
          <button className="button" disabled>Voice</button>
        </div>
      </div>
    </div>
  );
}

function SettingsView(){
  return (
    <div className="container stack">
      <h1 style={{fontSize:"var(--font-lg)", margin:0}}>Settings</h1>
      <div className="card stack">
        <label htmlFor="lang">Language</label>
        <select id="lang" className="select">
          <option>English</option>
          <option>Arabic</option>
        </select>
        <label htmlFor="tts">Text-to-Speech</label>
        <select id="tts" className="select">
          <option>Off</option>
          <option>On</option>
        </select>
      </div>
    </div>
  );
}

function ProfileView(){
  return (
    <div className="container stack">
      <h1 style={{fontSize:"var(--font-lg)", margin:0}}>Profile</h1>
      <div className="card stack">
        <p style={{margin:0}}>Manage your account details.</p>
      </div>
    </div>
  );
}

function App() {
  useViewportHeight();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("home");

  const navItems = useMemo(() => ([
    { key: "home", label: "Home", icon: <IconHome /> },
    { key: "chat", label: "Chat", icon: <IconChat /> },
    { key: "settings", label: "Settings", icon: <IconSettings /> },
    { key: "profile", label: "Profile", icon: <IconUser /> }
  ]), []);

  return (
    <div className="app">
      {/* Content */}
      {tab === "home" && <HomeView />}
      {tab === "chat" && <ChatView />}
      {tab === "settings" && <SettingsView />}
      {tab === "profile" && <ProfileView />}

      {/* Bottom nav for <=768px; hide on desktop via CSS */}
      <MobileNav items={navItems} active={tab} onSelect={setTab} />
    </div>
  );
}

export default App;
