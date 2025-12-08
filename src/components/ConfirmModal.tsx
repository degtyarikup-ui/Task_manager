import React from 'react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel: () => void;
    isDestructive?: boolean; // For red confirm button
    isAlert?: boolean; // If true, only show OK button
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'OK',
    cancelLabel = 'Отмена',
    onConfirm,
    onCancel,
    isDestructive = false,
    isAlert = false
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.content}>
                    {title && <div className={styles.title}>{title}</div>}
                    <div className={styles.message}>{message}</div>
                </div>
                <div className={styles.actions}>
                    {!isAlert && (
                        <button className={styles.button} onClick={onCancel}>
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        className={`${styles.button} ${isDestructive ? styles.danger : styles.bold}`}
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            else onCancel(); // If alert, just close
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
