import React, { useEffect, useState } from 'react';

interface UndoToastProps {
    onUndo: () => void;
    label: string;
    undoLabel: string;
    duration?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({ onUndo, label, undoLabel, duration = 5000 }) => {
    const [timeLeft, setTimeLeft] = useState(Math.ceil(duration / 1000));
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Start animation immediately
        requestAnimationFrame(() => {
            setProgress(1);
        });

        const infoInterval = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(infoInterval);
    }, []);

    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * progress; // 0 -> circumference (disappears)

    return (
        <div
            style={{
                background: 'var(--bg-card)',
                color: 'var(--color-text-primary)',
                padding: '12px 16px',
                borderRadius: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'slideUp 0.3s ease-out', // Assuming global keyframes or provided by parent (it was inline in Tasks)
                pointerEvents: 'auto',
                border: '1px solid var(--border-color)',
                marginBottom: 0
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Circular Timer */}
                <div style={{ position: 'relative', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="26" height="26" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Background track */}
                        <circle
                            r={radius}
                            cx="13"
                            cy="13"
                            fill="transparent"
                            stroke="var(--color-text-secondary)"
                            strokeWidth="2.5"
                            strokeOpacity="0.1"
                        />
                        {/* Progress ring */}
                        <circle
                            r={radius}
                            cx="13"
                            cy="13"
                            fill="transparent"
                            stroke="var(--color-accent)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{
                                transition: `stroke-dashoffset ${duration}ms linear`
                            }}
                        />
                    </svg>
                    <span style={{
                        position: 'absolute',
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: 'var(--color-text-primary)'
                    }}>
                        {timeLeft}
                    </span>
                </div>

                <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
            </div>

            <button
                onClick={onUndo}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-accent)',
                    fontSize: 14,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: '4px 8px'
                }}
            >
                {undoLabel}
            </button>
        </div>
    );
};
