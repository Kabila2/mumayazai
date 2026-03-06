// src/blocks/ShinyTextSwitcher/ShinyTextSwitcher.js
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ShinyText from "../ShinyText/ShinyText";
import "./ShinyTextSwitcher.css";


 const texts = [
   { textEN: "Mumayaz", textAR: "مميّز" }
 ];

export default function ShinyTextSwitcher() {
  const [showArabic, setShowArabic] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowArabic(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { textEN, textAR } = texts[0];
  const key = showArabic ? "AR" : "EN";

  return (
    <div className="shiny-text-switcher" style={{ position: "relative", width: "max-content", margin: "0 auto" }}>
      <AnimatePresence exitBeforeEnter>
        <motion.div
          key={key}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <ShinyText textEN={textEN} textAR={textAR} showArabic={showArabic} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
