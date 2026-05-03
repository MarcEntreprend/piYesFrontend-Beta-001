// components/AutoScaleText.tsx
import React, { useRef, useEffect, useState } from 'react';

interface AutoScaleTextProps {
    children: React.ReactNode;
    maxFontSize?: number;
    minFontSize?: number;
    className?: string;
    as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4';
}

export const AutoScaleText: React.FC<AutoScaleTextProps> = ({
    children,
    maxFontSize = 36,
    minFontSize = 12,
    className = '',
    as: Component = 'span',
}) => {
    const textRef = useRef<HTMLElement>(null);
    const [fontSize, setFontSize] = useState(maxFontSize);

    useEffect(() => {
        const adjustFontSize = () => {
            const el = textRef.current;
            if (!el) return;

            const container = el.parentElement;
            if (!container) return;

            const containerWidth = container.clientWidth;
            const textWidth = el.scrollWidth;

            if (textWidth > containerWidth) {
                // Texte trop long → réduire la taille
                const ratio = containerWidth / textWidth;
                const newSize = Math.max(minFontSize, fontSize * ratio * 0.95);
                setFontSize(newSize);
            } else if (fontSize < maxFontSize) {
                // Texte tient → essayer d'augmenter progressivement
                const ratio = containerWidth / textWidth;
                const newSize = Math.min(maxFontSize, fontSize * (1 / ratio) * 1.05);
                if (newSize > fontSize + 0.5) {
                    setFontSize(newSize);
                }
            }
        };

        adjustFontSize();
        window.addEventListener('resize', adjustFontSize);
        return () => window.removeEventListener('resize', adjustFontSize);
    }, [children, fontSize, maxFontSize, minFontSize]);

    return (
        <Component
            ref={textRef as any}
            className={`whitespace-nowrap ${className}`}
            style={{ fontSize: `${fontSize}px` }}
        >
            {children}
        </Component>
    );
};