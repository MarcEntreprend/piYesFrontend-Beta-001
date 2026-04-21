// components\PageTransition.tsx


import React from "react";
import { motion } from "motion/react";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right" | "up" | "none";
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
  direction = "left"
}) => {
  const variants = {
    initial: {
      opacity: 0,
      x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
      y: direction === "up" ? 20 : 0,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
    },
    exit: {
      opacity: 0,
      x: direction === "left" ? -20 : direction === "right" ? 20 : 0,
      y: direction === "up" ? -20 : 0,
    },
  };

  if (direction === "none") {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
