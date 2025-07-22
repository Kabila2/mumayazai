// src/blocks/Dock/Dock.js
"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import React, {
  Children,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Dock.css";

export default function Dock({
  /** 
   * items: [
   *   {
   *     icon: ReactNode,      // e.g. an <img>, emoji, or your own icon component
   *     label: string,        // shown on hover
   *     panel?: ReactNode,    // rendered above the icons when clicked
   *     onClick?: ()=>void,   // fallback if no panel
   *     className?: string
   *   }, …
   * ]
   */
  items = [],

  // Fisheye & layout params—you can tweak these
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
}) {
  // mouse-tracking for fisheye
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  // animate container height between "just icons" and "icons + panel"
  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  // which item is currently open?
  const [activeIndex, setActiveIndex] = useState(null);
  const handleClick = (item, idx) => {
    if (item.panel) {
      setActiveIndex((prev) => (prev === idx ? null : idx));
    } else if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <motion.div
      style={{ height, scrollbarWidth: "none" }}
      className="dock-outer"
    >
      {/* PANEL AREA */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            key="dock-content"
            className="dock-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {items[activeIndex].panel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ICON ROW */}
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className="dock-panel"
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, idx) => (
          <DockItem
            key={idx}
            onClick={() => handleClick(item, idx)}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
}) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  // compute distance from cursor to this icon’s center
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  // map that distance into a fisheye size
  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) =>
        cloneElement(child, { isHovered })
      )}
    </motion.div>
  );
}

function DockLabel({ children, className = "", ...rest }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsub = isHovered.on("change", (v) => {
      setIsVisible(v === 1);
    });
    return () => unsub();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: "-50%" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "" }) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}
