import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../context/StoreContext';
import { haptic } from '../utils/haptics';
import { Calculator as CalcIcon, Sparkles, Clock, TrendingUp } from 'lucide-react';
import styles from './Calculator.module.css';

interface AIResult {
    minPrice: number;
    maxPrice: number;
    currency: string;
    minHours: number;
    maxHours: number;
    complexity: string;
    explanation: string;
}

export const Calculator: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { language } = useStore();

    const [projectType, setProjectType] = useState<string>('development');
    const [description, setDescription] = useState<string>('');
    const [rate, setRate] = useState<number>(30); // Default middle value
    const [experience, setExperience] = useState<string>('beginner');
    const [result, setResult] = useState<AIResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleCalculate = async () => {
        if (!description.trim()) {
            haptic.notification('error');
            setError(t('errorGeneric') || 'Please add a description');
            return;
        }

        setIsCalculating(true);
        setError(null);
        setResult(null);
        haptic.impact('light');

        try {
            const response = await fetch('https://qysfycmynplwylnbnskw.supabase.co/functions/v1/calculate-cost-ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sb_publishable_ZikJgvMJx7lj9c7OmICtNg_ctMzFDDu'
                },
                body: JSON.stringify({
                    projectType,
                    description,
                    hourlyRate: rate,
                    experience,
                    language
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to calculate');
            }

            setResult(data);
            haptic.notification('success');
        } catch (e) {
            console.error(e);
            setError(t('errorAIService') || 'AI Service Error');
            haptic.notification('error');
        } finally {
            setIsCalculating(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.iconWrapper}>
                    <CalcIcon size={40} color="white" />
                </div>
                <div className={styles.title}>{t('aiCalculator')}</div>
                <div className={styles.subtitle}>{t('aiCalculatorDesc')}</div>
            </header>

            <div className={styles.formGroup}>
                <label className={styles.label}>{t('category') || 'Category'}</label>
                <select
                    className={styles.input}
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                >
                    <option value="development">{t('development')}</option>
                    <option value="design">{t('design')}</option>
                    <option value="copywriting">{t('copywriting')}</option>
                    <option value="marketing">{t('marketing')}</option>
                    <option value="videoAudio">{t('videoAudio')}</option>
                    <option value="ai">{t('ai')}</option>
                    <option value="other">{t('other')}</option>
                </select>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>{t('projectDescription')}</label>
                <textarea
                    className={styles.input}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={String(t('projectDescriptionPlaceholder') || '')}
                    rows={4}
                    style={{ resize: 'none', minHeight: 100 }}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>{t('experienceLevel')}</label>
                <select
                    className={styles.input}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                >
                    <option value="beginner">{t('beginner')}</option>
                    <option value="intermediate">{t('intermediate')}</option>
                    <option value="expert">{t('expert')}</option>
                </select>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>{t('hourlyRate')}</label>
                <div className={styles.rangeContainer}>
                    <input
                        type="range"
                        className={styles.rangeInput}
                        min="2"
                        max="50"
                        step="1"
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                    />
                    <div className={styles.rangeValue}>${rate}</div>
                </div>
            </div>

            {error && (
                <div style={{ color: 'var(--color-danger)', textAlign: 'center', margin: '8px 0', fontSize: 13 }}>
                    {error}
                </div>
            )}

            <button
                className={styles.calculateBtn}
                onClick={handleCalculate}
                disabled={isCalculating}
            >
                {isCalculating ? (
                    <>{t('loading') || 'Processing...'}</>
                ) : (
                    <>
                        <Sparkles size={24} />
                        {t('calculate')}
                    </>
                )}
            </button>

            {result && (
                <div className={styles.resultCard}>
                    <div className={styles.resultLabel}>{t('priceRange')}</div>
                    <div className={styles.resultValue}>
                        {result.minPrice} - {result.maxPrice} {result.currency}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                                <Clock size={16} /> {t('hoursEstimate')}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>
                                {result.minHours}-{result.maxHours} {t('hours')}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                                <TrendingUp size={16} /> {t('complexity')}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>
                                {result.complexity}
                            </div>
                        </div>
                    </div>

                    <div className={styles.disclaimer} style={{
                        fontSize: 15, marginTop: 20,
                        lineHeight: 1.5, textAlign: 'left',
                        background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16
                    }}>
                        {result.explanation}
                    </div>

                    <div className={styles.disclaimer}>
                        {t('aiDisclaimer')}
                    </div>
                </div>
            )}
        </div>
    );
};
