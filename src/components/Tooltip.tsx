import React, { useState } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
    message: string;
    onDismiss: () => void;
}

export const Tooltip: React.FC<TooltipProps> = ({ message, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleClick = () => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for potential animation if we add exit animation
    };

    if (!isVisible) return null;

    return (
        <div className={styles.tooltip} onClick={handleClick}>
            <span className={styles.text}>{message}</span>
        </div>
    );
};
