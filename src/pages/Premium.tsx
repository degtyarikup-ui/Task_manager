import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { supabase } from '../lib/supabase';

import { Star, BarChart2, ShieldCheck, Sparkles, Mic, Calculator } from 'lucide-react';
import styles from './Premium.module.css';
import { useNavigate } from 'react-router-dom';

export const Premium: React.FC = () => {
    const { userId, isPremium, language } = useStore();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            tg.BackButton.show();
            const handleBack = () => navigate('/profile');
            tg.BackButton.onClick(handleBack);
            return () => {
                tg.BackButton.offClick(handleBack);
                tg.BackButton.hide();
            };
        }
    }, [navigate]);

    const handleBuyPremium = async () => {
        setIsLoading(true);
        try {
            // Use Supabase Client invoke for better CORS/Auth handling
            const { data, error } = await supabase.functions.invoke('telegram-payment', {
                body: {
                    action: 'create_invoice',
                    userId: userId,
                    language: language
                }
            });

            if (error) throw error;

            if (data?.invoiceLink) {
                const tg = (window as any).Telegram?.WebApp;
                if (tg && tg.openInvoice) {
                    tg.openInvoice(data.invoiceLink, (status: string) => {
                        if (status === 'paid' || status === 'paid_med') {
                            if (tg.showAlert) tg.showAlert(t('paymentSuccess'));
                            setTimeout(() => {
                                navigate('/profile');
                                window.location.reload();
                            }, 1000);
                        }
                    });
                } else {
                    window.open(data.invoiceLink, '_blank');
                }
            } else {
                throw new Error('No invoice link in response');
            }
        } catch (e: any) {
            console.error('Payment Error', e);
            alert(`Debug Error: ${e.message || e}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>


            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Star size={44} color="white" fill="white" />
                </div>
                <div className={styles.title}>{t('premiumTitle')}</div>
                <div className={styles.subtitle}>
                    {t('premiumSubtitle')}
                </div>
            </div>

            <div className={styles.features}>
                {/* 1. AI Assistant */}
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(217, 70, 239, 0.1)', color: '#D946EF' }}>
                        <Sparkles size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>{t('featureAI')}</h3>
                        <p>{t('featureAIDesc')}</p>
                    </div>
                </div>

                {/* 2. AI Calculator (New) */}
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <Calculator size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>{t('featureCalculator')}</h3>
                        <p>{t('featureCalculatorDesc')}</p>
                    </div>
                </div>

                {/* 3. Advanced Stats */}
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                        <BarChart2 size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>{t('advancedStats')}</h3>
                        <p>{t('advancedStatsDesc')}</p>
                    </div>
                </div>

                {/* 4. Telegram Bot */}
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}>
                        <Mic size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>{t('featureBot')}</h3>
                        <p>{t('featureBotDesc')}</p>
                    </div>
                </div>

                {/* 5. Support Development (Moved to last) */}
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>{t('supportDev')}</h3>
                        <p>{t('supportDevDesc')}</p>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                {!isPremium ? (
                    <>
                        <button className={styles.buyButton} onClick={handleBuyPremium} disabled={isLoading}>
                            {isLoading ? t('loading') : t('buyButton')}
                        </button>
                        <div className={styles.price}>
                            {t('cancelAnytime')}
                        </div>
                    </>
                ) : (
                    <div style={{
                        padding: 16, background: 'var(--color-success)', color: 'white',
                        borderRadius: 16, fontWeight: 600
                    }}>
                        {t('alreadyPremium')}
                    </div>
                )}
            </div>
        </div>
    );
};
