import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { haptic } from '../utils/haptics';
import { Calculator as CalcIcon, Sparkles } from 'lucide-react';
import styles from './Calculator.module.css';

export const Calculator: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [rate, setRate] = useState<number>(50);
    const [hours, setHours] = useState<number>(40);
    const [complexity, setComplexity] = useState<number>(1.2);
    const [projectType, setProjectType] = useState<string>('landing');
    const [result, setResult] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Handle Telegram Back Button
    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            tg.BackButton.show();
            const handleBack = () => navigate(-1);
            tg.BackButton.onClick(handleBack);
            return () => {
                tg.BackButton.offClick(handleBack);
                tg.BackButton.hide();
            };
        }
    }, [navigate]);

    const handleCalculate = () => {
        setIsCalculating(true);
        haptic.impact('light');

        // Simulate AI thinking
        setTimeout(() => {
            let base = rate * hours;

            // Apply Project Type Multiplier
            let typeMultiplier = 1;
            switch (projectType) {
                case 'landing': typeMultiplier = 1; break; // Simple
                case 'ecommerce': typeMultiplier = 1.3; break; // Backend, db
                case 'webapp': typeMultiplier = 1.5; break; // Logic, API
                case 'bot': typeMultiplier = 1.2; break; // Logic
                case 'mobile': typeMultiplier = 1.8; break; // Two platforms often
            }

            // Random "AI" variance for market conditions (simulated)
            const marketVariance = 0.95 + Math.random() * 0.1; // +/- 5%

            const final = Math.round(base * complexity * typeMultiplier * marketVariance);

            setResult(final);
            setIsCalculating(false);
            haptic.notification('success');
        }, 1500);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        WebkitBackgroundClip: 'text', // Added for text clipping
                        backgroundClip: 'text',       // Added for text clipping
                        WebkitTextFillColor: 'transparent', // Added for text fill color
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(255, 165, 0, 0.3)'
                    }}>
                        <CalcIcon size={32} color="white" />
                    </div>
                </div>
                <h1 className={styles.title}>{t('aiCalculator') || 'AI Calculator'}</h1>
                <p className={styles.subtitle}>{t('aiCalculatorDesc') || 'Estimate project cost based on parameters'}</p>
            </header>

            <div className={styles.formGroup}>
                <label className={styles.label}>{t('projectType') || 'Project Type'}</label>
                <select
                    className={styles.input}
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                >
                    <option value="landing">Landing Page</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="webapp">Web Application</option>
                    <option value="bot">Telegram Bot</option>
                    <option value="mobile">Mobile App</option>
                </select>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>{t('hourlyRate') || 'Hourly Rate ($)'}</label>
                <input
                    type="number"
                    className={styles.input}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>{t('estimatedHours') || 'Estimated Hours'}</label>
                <input
                    type="number"
                    className={styles.input}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>
                    {t('complexity') || 'Complexity'} (x{complexity})
                </label>
                <div className={styles.rangeContainer}>
                    <span style={{ fontSize: 12 }}>Low</span>
                    <input
                        type="range"
                        className={styles.rangeInput}
                        min="1"
                        max="2"
                        step="0.1"
                        value={complexity}
                        onChange={(e) => setComplexity(Number(e.target.value))}
                    />
                    <span style={{ fontSize: 12 }}>High</span>
                </div>
            </div>

            <button
                className={styles.calculateBtn}
                onClick={handleCalculate}
                disabled={isCalculating}
            >
                {isCalculating ? (
                    <>Processing...</>
                ) : (
                    <>
                        <Sparkles size={20} />
                        {t('calculate') || 'Calculate Cost'}
                    </>
                )}
            </button>

            {result !== null && (
                <div className={styles.resultCard}>
                    <div className={styles.resultLabel}>{t('estimatedCost') || 'Estimated Cost'}</div>
                    <div className={styles.resultValue}>${result.toLocaleString()}</div>
                    <div className={styles.disclaimer}>
                        {t('aiDisclaimer') || '* This is an AI estimation based on average market rates. Actual cost may vary.'}
                    </div>
                </div>
            )}
        </div>
    );
};
