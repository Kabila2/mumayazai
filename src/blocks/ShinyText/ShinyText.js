// src/blocks/ShinyText/ShinyText.js
import React from "react";
import { motion } from "framer-motion";
import "./ShinyText.css";

export default function ShinyText({ textEN, textAR, showArabic }) {
  const displayedText = showArabic ? textAR : textEN;

  return (
    <motion.h1
      className="shiny-text"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {displayedText}
    </motion.h1>
  );
}
