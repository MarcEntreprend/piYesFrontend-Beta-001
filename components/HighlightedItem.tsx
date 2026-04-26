// components/HighlightedItem.tsx

import React, { useEffect, useState, useRef, forwardRef } from 'react';

interface HighlightedItemProps {
    id: string;
    highlightDuration?: number; // ms, défaut 2500
    scrollBehavior?: 'smooth' | 'auto';
    scrollBlock?: 'start' | 'center' | 'end' | 'nearest';
    onHighlightStart?: () => void;
    onHighlightEnd?: () => void;
    children: React.ReactNode;
    className?: string;
}

export const HighlightedItem = forwardRef<HTMLDivElement, HighlightedItemProps>(({
    id,
    highlightDuration = 2500,
    scrollBehavior = 'smooth',
    scrollBlock = 'center',
    onHighlightStart,
    onHighlightEnd,
    children,
    className = '',
}, externalRef) => {
    const [isHighlighted, setIsHighlighted] = useState(false);
    const internalRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const ref = (externalRef as React.RefObject<HTMLDivElement>) || internalRef;

    const triggerHighlight = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setIsHighlighted(true);
        onHighlightStart?.();

        if (ref && 'current' in ref && ref.current) {
            ref.current.scrollIntoView({
                behavior: scrollBehavior as ScrollBehavior,
                block: scrollBlock,
            });
        }

        timeoutRef.current = setTimeout(() => {
            setIsHighlighted(false);
            onHighlightEnd?.();
            timeoutRef.current = null;
        }, highlightDuration);
    };

    useEffect(() => {
        const handleGlobalHighlight = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail === id) {
                triggerHighlight();
            }
        };

        window.addEventListener('piyes:highlight', handleGlobalHighlight);

        return () => {
            window.removeEventListener('piyes:highlight', handleGlobalHighlight);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [id]);

    return (
        <div
            ref={ref as React.Ref<HTMLDivElement>}
            id={id}
            className={`transition-all duration-300 ${isHighlighted
                ? 'ring-2 ring-(--primary-color) bg-(--primary-color)/10 scale-[1.01] z-10 ' + className
                : className}`}
            style={{
                boxShadow: isHighlighted ? '0 0 0 4px rgba(131, 10, 209, 0.2)' : undefined,
            }}
        >
            {children}
        </div>
    );
});

HighlightedItem.displayName = 'HighlightedItem';

// Hook utilitaire pour déclencher la surbrillance
export const useHighlight = () => {
    const highlight = (id: string) => {
        window.dispatchEvent(new CustomEvent('piyes:highlight', { detail: id }));
    };
    return { highlight };
};