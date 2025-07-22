// src/components/ui/animated-modal.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// simple cn utility
const cn = (...inputs) => twMerge(clsx(inputs));

// 1) Context
const ModalContext = createContext();
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be inside ModalProvider");
  return ctx;
}
export function Modal({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <ModalContext.Provider value={{ open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

// 2) Trigger Button
export function ModalTrigger({ children, className }) {
  const { setOpen } = useModal();
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md text-center relative overflow-hidden",
        className
      )}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
}

// 3) Body + Animation
export function ModalBody({ children, className }) {
  const { open, setOpen } = useModal();
  const ref = useRef();
  // lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);
  // close on outside click
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setOpen]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 flex items-center justify-center z-50"
        >
          <motion.div
            ref={ref}
            className={cn(
              "bg-white dark:bg-neutral-900 rounded-xl shadow-xl overflow-hidden w-full max-w-md mx-4",
              className
            )}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 4) Content & Footer slots
export function ModalContent({ children, className }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
export function ModalFooter({ children, className }) {
  return <div className={cn("p-4 bg-gray-100 flex justify-end", className)}>{children}</div>;
}
