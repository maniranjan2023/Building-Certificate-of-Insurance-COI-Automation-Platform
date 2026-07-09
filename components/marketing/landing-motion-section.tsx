"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const fadeTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: fadeTransition },
};

interface LandingMotionSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function LandingMotionSection({
  children,
  className,
  delay = 0,
}: LandingMotionSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: fadeUp.hidden,
        visible: {
          opacity: 1,
          y: 0,
          transition: { ...fadeTransition, delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
