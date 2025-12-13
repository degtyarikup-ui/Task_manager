import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (isOpen) setRender(true);
    }, [isOpen]);

    const onAnimationEnd = () => {
        if (!isOpen) setRender(false);
    };

    if (!render) return null;

    return createPortal(
        <div className={`${styles.backdrop} ${isOpen ? styles.open : styles.close}`} onClick={onClose}>
            <div
                className={`${styles.sheet} ${isOpen ? styles.sheetOpen : styles.sheetClose}`}
                onClick={e => e.stopPropagation()}
                onAnimationEnd={onAnimationEnd}
            >
                <div className={styles.handleBar} onClick={onClose}>
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
