// components/AvatarViewer.tsx

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface AvatarViewerProps {
    /** URL de l'avatar à afficher */
    avatarUrl: string | null | undefined;
    /** Élément référence pour l'animation d'ouverture/fermeture */
    triggerRef?: React.RefObject<HTMLDivElement>;
    /** Classes additionnelles pour le conteneur */
    className?: string;
    /** Taille de l'avatar en mode normal */
    size?: "sm" | "md" | "lg" | "xl";
    /** Forme de l'avatar */
    shape?: "circle" | "rounded";
    /** Fallback si pas d'avatar (initiales) */
    fallback?: React.ReactNode;
    /** Callback au clic sur l'avatar */
    onClick?: () => void;
    /** Désactiver l'ouverture plein écran */
    disablePreview?: boolean;
}

const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-32 h-32",
};

const shapeClasses = {
    circle: "rounded-full",
    rounded: "rounded-2xl",
};

export const AvatarViewer: React.FC<AvatarViewerProps> = ({
    avatarUrl,
    triggerRef,
    className = "",
    size = "md",
    shape = "circle",
    fallback,
    onClick,
    disablePreview = false,
}) => {
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isClosingBySwipe, setIsClosingBySwipe] = useState(false);
    const localRef = useRef<HTMLDivElement>(null);
    const [avatarRect, setAvatarRect] = useState<DOMRect | null>(null);

    const ref = triggerRef || localRef; // assignation de ref

    const openFullscreen = () => {
        if (!avatarUrl || disablePreview) return;

        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setAvatarRect(rect);
        }

        setScale(1);
        setPosition({ x: 0, y: 0 });
        setIsClosingBySwipe(false);
        setShowFullscreen(true);
    };

    const closeFullscreen = () => {
        setShowFullscreen(false);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setIsClosingBySwipe(false);
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setIsDragging(true);
        setDragStart({ x: 0, y: clientY - position.y });
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        let newY = clientY - dragStart.y;
        const maxPullDown = 200;
        newY = Math.max(-50, Math.min(maxPullDown, newY));

        setPosition({ x: 0, y: newY });
        setIsClosingBySwipe(newY > 120);
    };

    const handleDragEnd = () => {
        if (isClosingBySwipe) {
            closeFullscreen();
        } else {
            setPosition({ x: 0, y: 0 });
        }
        setIsDragging(false);
        setIsClosingBySwipe(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(1, Math.min(3, prev + delta)));
    };

    const handleDoubleClick = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleClick = () => {
        if (onClick) onClick();
        openFullscreen();
    };

    return (
        <>
            {/* Avatar normal */}
            <div
                ref={ref}
                className={`${sizeClasses[size]} ${shapeClasses[shape]} overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${avatarUrl && !disablePreview ? 'cursor-pointer' : ''} ${className}`}
                onClick={handleClick}
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    fallback
                )}
            </div>

            {/* Modal plein écran */}
            <AnimatePresence>
                {showFullscreen && avatarUrl && (
                    <motion.div
                        className="fixed inset-0 z-250 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeFullscreen}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        <div className="relative w-full max-w-md h-full flex items-center justify-center p-4">
                            <motion.div
                                className="relative w-full flex items-center justify-center overflow-hidden"
                                style={{ maxHeight: '85vh' }}
                                initial={avatarRect ? {
                                    scale: avatarRect.width / 300,
                                    x: avatarRect.left + avatarRect.width / 2 - window.innerWidth / 2,
                                    y: avatarRect.top + avatarRect.height / 2 - window.innerHeight / 2,
                                    opacity: 0
                                } : { opacity: 0 }}
                                animate={{
                                    scale: 1,
                                    x: 0,
                                    y: position.y,
                                    opacity: 1
                                }}
                                exit={avatarRect ? {
                                    scale: avatarRect.width / 300,
                                    x: avatarRect.left + avatarRect.width / 2 - window.innerWidth / 2,
                                    y: avatarRect.top + avatarRect.height / 2 - window.innerHeight / 2,
                                    opacity: 0
                                } : { opacity: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 30,
                                    mass: 0.9
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={closeFullscreen}
                                    className="absolute top-2 right-2 z-20 p-2 bg-black/30 backdrop-blur-md rounded-full text-white active:scale-90 transition-all"
                                >
                                    <X size={20} />
                                </button>

                                <div
                                    className="relative w-full flex items-center justify-center overflow-hidden"
                                    onMouseDown={handleDragStart}
                                    onMouseMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                    onTouchStart={handleDragStart}
                                    onTouchMove={handleDragMove}
                                    onTouchEnd={handleDragEnd}
                                    onWheel={handleWheel}
                                    onDoubleClick={handleDoubleClick}
                                    style={{
                                        cursor: isDragging
                                            ? (position.y > 50 ? 'grabbing' : 'ns-resize')
                                            : 'default',
                                        touchAction: 'pan-y'
                                    }}
                                >
                                    <motion.img
                                        src={avatarUrl}
                                        alt="Avatar plein écran"
                                        className="w-full h-auto object-contain select-none rounded-2xl"
                                        style={{
                                            transform: `scale(${scale})`,
                                            maxWidth: '100%',
                                            maxHeight: '85vh',
                                        }}
                                        animate={{ scale }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        draggable={false}
                                    />
                                </div>

                                <AnimatePresence>
                                    {position.y > 30 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full"
                                        >
                                            {position.y > 120 ? "Relâcher pour fermer" : "Tirer vers le bas pour fermer"}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {scale > 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full"
                                        >
                                            {Math.round(scale * 100)}%
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AvatarViewer;