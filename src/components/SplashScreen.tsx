// src/components/SplashScreen.tsx
import { motion } from "motion/react";
import { Logo } from "@/components/ui/Logo";

export function SplashScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-(--color-bg)">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
        <Logo size="lg" />
      </motion.div>
    </div>
  );
}