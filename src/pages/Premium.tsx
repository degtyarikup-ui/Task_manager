import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';

import { Star, BarChart2, ShieldCheck } from 'lucide-react';
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
            const handleBack = () => navigate(-1);
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
            // Используем прямой fetch для диагностики
            const response = await fetch('https://qysfycmynplwylnbnskw.supabase.co/functions/v1/telegram-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sb_publishable_ZikJgvMJx7lj9c7OmICtNg_ctMzFDDu'
                },
                body: JSON.stringify({
                    action: 'create_invoice',
                    userId: userId,
                    language: language
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server Error ${response.status}: ${text}`);
            }

            const data = await response.json();

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
            alert(`Debug Error: ${e.message}`);
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
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF' }}>
                        <BarChart2 size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>{t('advancedStats')}</h3>
                        <p>{t('advancedStatsDesc')}</p>
                    </div>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>{t('supportDev')}</h3>
                        <p>{t('supportDevDesc')}</p>
                    </div>
                </div>

                {/* Placeholder for future features */}
                <div className={styles.featureCard} style={{ opacity: 0.6 }}>
                    <div className={styles.featureIcon}>
                        <Star size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>{t('soonMore')}</h3>
                        <p>{t('soonMoreDesc')}</p>
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
