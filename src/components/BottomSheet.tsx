import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
    const [render, setRender] = useState(isOpen);
    const [isDragging, setIsDragging] = useState(false);
    const [offsetY, setOffsetY] = useState(0);
    const startY = useRef<number>(0);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            setOffsetY(0);
        }
    }, [isOpen]);

    const onAnimationEnd = () => {
        if (!isOpen) setRender(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only allow dragging from header/handle
        // Or checking prompt? 
        // Let's allow dragging from anywhere in content if scrollTop is 0?
        // For now, simpler: drag from header area (handleBar) or if we bind to whole sheet.
        // User said "pull by top edge down".
        setIsDragging(true);
        startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const delta = e.touches[0].clientY - startY.current;
        if (delta > 0) {
            e.preventDefault(); // Prevent scroll while dragging sheet
            setOffsetY(delta);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (offsetY > 100) {
            onClose();
        } else {
            setOffsetY(0);
        }
    };

    if (!render) return null;

    return createPortal(
        <div className={`${styles.backdrop} ${isOpen ? styles.open : styles.close}`} onClick={onClose}>
            <div
                className={`${styles.sheet} ${isOpen ? styles.sheetOpen : styles.sheetClose}`}
                onClick={e => e.stopPropagation()}
                onAnimationEnd={onAnimationEnd}
                style={{
                    transform: isOpen ? `translateY(${offsetY}px)` : undefined,
                    transition: isDragging ? 'none' : undefined
                }}
            >
                <div
                    className={styles.handleBar}
                    onClick={onClose}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className={styles.handle} />
                </div>
                {title && <div className={styles.title}>{title}</div>}
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
