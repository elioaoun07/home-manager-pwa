"use client";

import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-24 right-6 z-30 group"
      aria-label="Add new item"
    >
      {/* Outer glow */}
      <motion.div
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          opacity: isHovered ? [0.5, 0.8, 0.5] : 0,
        }}
        transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
        className="absolute inset-0 rounded-full bg-gradient-primary blur-xl"
      />

      {/* Main button */}
      <div className="relative w-16 h-16 rounded-full bg-gradient-primary shadow-elevated-lg overflow-hidden">
        {/* Shimmer effect */}
        <motion.div
          animate={{
            x: isHovered ? [-100, 200] : -100,
          }}
          transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />

        {/* Icons */}
        <div className="relative w-full h-full flex items-center justify-center text-white">
          <motion.div
            animate={{ rotate: isHovered ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Plus size={28} strokeWidth={3} />
          </motion.div>
        </div>

        {/* Sparkles on hover */}
        {isHovered && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, -20, -30],
                y: [0, -20, -30],
              }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2 }}
              className="absolute top-2 left-2"
            >
              <Sparkles size={12} className="text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, 20, 30],
                y: [0, -20, -30],
              }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }}
              className="absolute top-2 right-2"
            >
              <Sparkles size={12} className="text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, 0, 0],
                y: [0, 25, 35],
              }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.6 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2"
            >
              <Sparkles size={12} className="text-white" />
            </motion.div>
          </>
        )}
      </div>

      {/* Pulsing ring */}
      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full border-2 border-primary"
      />
    </motion.button>
  );
}
