// src/components/ImageStudio.js
import React, { useState, useRef } from "react";
import "./ImageStudio.css";

export default function ImageStudio({ t = {}, onBack }) {
  const [activeTab, setActiveTab] = useState("generate"); // "generate" | "upload"
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  const handleFakeGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Placeholder: generate a simple gradient placeholder using data URL
    const seed = Math.abs(Array.from(prompt).reduce((a, c) => a + c.charCodeAt(0), 0));
    const hue = seed % 360;
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, `hsl(${hue}, 80%, 55%)`);
    grad.addColorStop(1, `hsl(${(hue + 160) % 360}, 80%, 45%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 28px Lexend, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(prompt.slice(0, 40), canvas.width / 2, canvas.height / 2);
    const url = canvas.toDataURL("image/png");
    setImages((prev) => [{ id: Date.now(), url, name: `gen-${Date.now()}.png` }, ...prev]);
    setIsGenerating(false);
  };

  const handleFiles = (files) => {
    const list = Array.from(files).map((f) => ({
      id: `${f.name}-${f.size}-${Math.random()}`,
      url: URL.createObjectURL(f),
      name: f.name
    }));
    setImages((prev) => [...list, ...prev]);
  };

  return (
    <div className="image-studio">
      <div className="image-studio__header">
        <button className="is-btn is-btn--back" onClick={onBack}>← {t.back || "Back"}</button>
        <div className="image-studio__tabs">
          <button className={`is-tab ${activeTab === "generate" ? "active" : ""}`} onClick={() => setActiveTab("generate")}>
            {t.generate || "Generate"}
          </button>
          <button className={`is-tab ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>
            {t.upload || "Upload"}
          </button>
        </div>
      </div>

      {activeTab === "generate" ? (
        <div className="image-studio__panel">
          <div className="is-row">
            <input
              className="is-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.prompt_placeholder || "Describe the image you want..."}
            />
            <button className="is-btn is-btn--primary" disabled={!prompt.trim() || isGenerating} onClick={handleFakeGenerate}>
              {isGenerating ? (t.generating || "Generating...") : (t.generate || "Generate")}
            </button>
          </div>
        </div>
      ) : (
        <div className="image-studio__panel">
          <div className="upload-drop" onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}>
            <div className="upload-instructions">
              <div>📷</div>
              <div>{t.drop_or_click || "Drop images here or click to upload"}</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }} />
          </div>
        </div>
      )}

      <div className="image-grid">
        {images.map((img) => (
          <div key={img.id} className="image-card">
            <img src={img.url} alt={img.name} />
            <div className="image-name" title={img.name}>{img.name}</div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="image-empty">{t.no_images || "No images yet. Generate or upload to see them here."}</div>
        )}
      </div>
    </div>
  );
}

