import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ShinyText from "../ShinyText/ShinyText";                                 // :contentReference[oaicite:0]{index=0}
import ScrollFloat from "../ScrollFloat/ScrollFloat";                           // :contentReference[oaicite:1]{index=1}
import Ribbons from "../Ribbons/Ribbons";                                       // :contentReference[oaicite:2]{index=2}
import SpotlightCard from "../SpotlightCard/SpotlightCard";                     // :contentReference[oaicite:3]{index=3}
import GlassIcons from "../GlassIcons/GlassIcons";                             // :contentReference[oaicite:4]{index=4}
import Dock from "../Dock/Dock";                                                 // :contentReference[oaicite:5]{index=5}
import InfiniteScroll from "../InfiniteScroll/InfiniteScroll";                 // :contentReference[oaicite:6]{index=6}
import Stepper, { Step } from "../Stepper/Stepper";                             // :contentReference[oaicite:7]{index=7}

import "./ReactBitsSwitcher.css";

export default function ReactBitsSwitcher() {
  const components = [
    <ShinyText key="text" textEN="Mumayaz AI" textAR="ميميز الذكاء الاصطناعي" showArabic={false} />,
    <ScrollFloat key="scroll">Tailored for Every Learner</ScrollFloat>,
    <Ribbons key="ribbons" />,
    <SpotlightCard key="spotlight" spotlightColor="rgba(255,255,255,0.2)">
      <h2>Intelligent Learning</h2>
      <p>Adaptive lessons just for you.</p>
    </SpotlightCard>,
    <GlassIcons key="glass" icons={[
      { icon: "🔍", label: "Explore" },
      { icon: "⚙️", label: "Customize" },
      { icon: "💾", label: "Save" },
    ]} />,
    <Dock key="dock" items={[
      { icon: "📘", label: "Learn", onClick: () => {} },
      { icon: "🗣️", label: "Speak", onClick: () => {} },
      { icon: "🧠", label: "Think", onClick: () => {} },
    ]} />,
    <InfiniteScroll key="infinite" items={[
      { content: "Lesson 1: Basics" },
      { content: "Lesson 2: Practice" },
      { content: "Lesson 3: Quiz" },
    ]} />,
    <Stepper key="stepper" initialStep={1} backButtonText="‹ Back" nextButtonText="Next ›">
      <Step><h3>Step 1</h3><p>Welcome to Mumayaz!</p></Step>
      <Step><h3>Step 2</h3><p>Let’s get started.</p></Step>
    </Stepper>,
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setIndex(i => (i + 1) % components.length);
    }, 4000);
    return () => clearInterval(iv);
  }, [components.length]);

  return (
    <div className="reactbits-switcher">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="reactbits-item"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {components[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
