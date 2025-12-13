import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../context/StoreContext';
import { haptic } from '../utils/haptics';
import { Calculator as CalcIcon, Sparkles, Clock, TrendingUp, Lock } from 'lucide-react';
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

interface HistoryItem extends AIResult {
    timestamp: number;
    projectType: string;
    description: string;
}

export const Calculator: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { language, isPremium, tasks } = useStore();

    const [projectType, setProjectType] = useState<string>('development');
    const [inputMode, setInputMode] = useState<'manual' | 'select'>('manual');
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [rate, setRate] = useState<number>(30);
    const [experience, setExperience] = useState<string>('beginner');
    const [result, setResult] = useState<AIResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('calc_history');
            if (saved) {
                setHistory(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load history', e);
        }
    }, []);

    const saveToHistory = (res: AIResult, params: { projectType: string, description: string }) => {
        const newItem: HistoryItem = { ...res, ...params, timestamp: Date.now() };
        const newHistory = [newItem, ...history].slice(0, 3);
        setHistory(newHistory);
        localStorage.setItem('calc_history', JSON.stringify(newHistory));
    };

    // Handle Telegram Back Button

    const handleCalculate = async () => {
        let descToUse = description;

        if (inputMode === 'select') {
            const selectedTask = tasks.find(t => t.id === selectedTaskId);
            if (!selectedTask) {
                haptic.notification('error');
                setError(t('selectTaskPlaceholder') || 'Please select a task');
                return;
            }
            descToUse = selectedTask.title;
        } else {
            if (!descToUse.trim()) {
                haptic.notification('error');
                setError(t('errorGeneric') || 'Please add a description');
                return;
            }
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
                    description: descToUse,
                    hourlyRate: rate,
                    experience,
                    language
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('AI Error Data:', data);
                throw new Error(data.error || 'Failed to calculate');
            }

            setResult(data);
            saveToHistory(data, { projectType, description: descToUse });
            haptic.notification('success');
        } catch (e: any) {
            console.error('Calculation Error:', e);
            setError(e.message || t('errorAIService') || 'AI Service Error');
            haptic.notification('error');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleButtonClick = () => {
        if (!isPremium) {
            haptic.impact('medium');
            navigate('/premium');
            return;
        }
        handleCalculate();
    };

    const categories = [
        { id: 'development', label: t('development') },
        { id: 'design', label: t('design') },
        { id: 'art', label: t('art') },
        { id: 'text', label: t('text') },
        { id: 'marketing', label: t('marketing') },
        { id: 'smm', label: t('smm') },
        { id: 'video', label: t('video') },
        { id: 'audio', label: t('audio') },
        { id: 'ai', label: t('ai') },
        { id: 'other', label: t('other') }
    ];

    const levels = [
        { id: 'beginner', label: t('beginner') },
        { id: 'intermediate', label: t('intermediate') },
        { id: 'expert', label: t('expert') }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>{t('aiCalculator')}</div>
                <div className={styles.subtitle}>{t('aiCalculatorDesc')}</div>
            </header>

            <div className={styles.formGroup} style={{ animationDelay: '0.1s' }}>
                <label className={styles.label}>{t('category') || 'Category'}</label>
                <div className={styles.chipContainer}>
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`${styles.chip} ${projectType === cat.id ? styles.active : ''}`}
                            onClick={() => {
                                setProjectType(cat.id);
                                haptic.impact('light');
                            }}
                        >
                            {cat.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.formGroup} style={{ animationDelay: '0.2s' }}>
                <label className={styles.label}>{t('experienceLevel')}</label>
                <div className={styles.chipContainer}>
                    {levels.map((lvl) => (
                        <div
                            key={lvl.id}
                            className={`${styles.chip} ${experience === lvl.id ? styles.active : ''}`}
                            onClick={() => {
                                setExperience(lvl.id);
                                haptic.impact('light');
                            }}
                        >
                            {lvl.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.formGroup} style={{ animationDelay: '0.3s' }}>
                <label className={styles.label}>{t('projectDescription')}</label>

                <div className={styles.chipContainer} style={{ marginBottom: 12 }}>
                    <div
                        className={`${styles.chip} ${inputMode === 'manual' ? styles.active : ''}`}
                        onClick={() => setInputMode('manual')}
                    >
                        {t('writeDescription')}
                    </div>
                    <div
                        className={`${styles.chip} ${inputMode === 'select' ? styles.active : ''}`}
                        onClick={() => setInputMode('select')}
                    >
                        {t('selectTask')}
                    </div>
                </div>

                {inputMode === 'manual' ? (
                    <textarea
                        className={styles.input}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={String(t('projectDescriptionPlaceholder') || '')}
                        rows={4}
                        style={{ resize: 'none', minHeight: 100 }}
                    />
                ) : (
                    <select
                        className={styles.input}
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                    >
                        <option value="">{t('selectTaskPlaceholder')}</option>
                        {tasks.filter(t => t.status !== 'completed').map(task => (
                            <option key={task.id} value={task.id}>
                                {task.title.length > 50 ? task.title.substring(0, 50) + '...' : task.title}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className={styles.formGroup} style={{ animationDelay: '0.4s' }}>
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

            {result && (
                <div className={styles.resultCard}>
                    <div className={styles.resultLabel}>{t('priceRange')}</div>
                    <div className={styles.resultValue}>
                        ${result.minPrice} - ${result.maxPrice}
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

            {history.length > 0 && !result && (
                <div style={{ marginTop: 24, paddingBottom: 20 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, paddingLeft: 8 }}>
                        {t('history') || 'History'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {history.map((item) => (
                            <div key={item.timestamp} onClick={() => {
                                setResult(item);
                                setProjectType(item.projectType);
                                setDescription(item.description);
                                setInputMode('manual');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} style={{
                                background: 'var(--bg-card)', padding: 16, borderRadius: 16,
                                cursor: 'pointer', border: '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, fontSize: 15 }}>${item.minPrice} - ${item.maxPrice}</span>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                    {item.description.length > 60 ? item.description.substring(0, 60) + '...' : item.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.footer}>
                <button
                    className={styles.calculateBtn}
                    onClick={handleButtonClick}
                    disabled={isCalculating}
                >
                    {isCalculating ? (
                        <>{t('loading') || 'Processing...'}</>
                    ) : (
                        <>
                            {!isPremium && <Lock size={20} />}
                            {isPremium ? <CalcIcon size={24} /> : null}
                            {t('calculate')}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
