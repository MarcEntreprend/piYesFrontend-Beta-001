// components/HighlightedItem.tsx

import React, { useEffect, useState, useRef } from 'react';

interface HighlightedItemProps {
    id: string;
    highlightDuration?: number;
    scrollBehavior?: 'smooth' | 'auto';
    scrollBlock?: 'start' | 'center' | 'end' | 'nearest';
    onHighlightStart?: () => void;
    onHighlightEnd?: () => void;
    children: React.ReactNode;
    className?: string;
}

export const HighlightedItem = ({
    id,
    highlightDuration = 2500,
    scrollBehavior = 'smooth',
    scrollBlock = 'center',
    onHighlightStart,
    onHighlightEnd,
    children,
    className = '',
}: HighlightedItemProps) => {
    const [isHighlighted, setIsHighlighted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const childRef = useRef<HTMLElement | null>(null);
    const hasBeenTriggeredRef = useRef(false); // Clé : ne déclencher qu'une fois

    // Trouver l'enfant
    useEffect(() => {
        if (containerRef.current) {
            const firstChild = containerRef.current.children[0] as HTMLElement;
            if (firstChild) {
                childRef.current = firstChild;
            }
        }
    }, [children]);

    // Appliquer/enlever les classes de surbrillance
    useEffect(() => {
        const child = childRef.current;
        if (!child) return;

        if (isHighlighted) {
            child.classList.add('ring-2', 'ring-(--primary-color)', 'bg-(--primary-color)/10', 'scale-[1.02]', 'z-10');
            child.style.transition = 'all 0.3s ease-in-out';
        } else {
            child.classList.remove('ring-2', 'ring-(--primary-color)', 'bg-(--primary-color)/10', 'scale-[1.02]', 'z-10');
        }
    }, [isHighlighted]);

    const triggerHighlight = () => {
        // Ne déclencher qu'une seule fois dans la vie du composant
        if (hasBeenTriggeredRef.current) return;
        hasBeenTriggeredRef.current = true;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setIsHighlighted(true);
        onHighlightStart?.();

        // Scroll uniquement si l'élément n'est pas déjà visible
        if (childRef.current) {
            const rect = childRef.current.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

            if (!isVisible) {
                childRef.current.scrollIntoView({
                    behavior: scrollBehavior as ScrollBehavior,
                    block: scrollBlock,
                });
            }
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
            ref={containerRef}
            id={id}
            className={className}
            style={{ display: 'contents' }}
        >
            {children}
        </div>
    );
};

// Hook utilitaire
export const useHighlight = () => {
    const highlight = (id: string) => {
        window.dispatchEvent(new CustomEvent('piyes:highlight', { detail: id }));
    };
    return { highlight };
};