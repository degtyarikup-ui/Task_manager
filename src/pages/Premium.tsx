import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n/useTranslation';
import { Star, BarChart2, Check, X, ShieldCheck } from 'lucide-react';
import styles from './Premium.module.css';
import { useNavigate } from 'react-router-dom';

export const Premium: React.FC = () => {
    const { userId, isPremium } = useStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleBuyPremium = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('telegram-payment', {
                body: { action: 'create_invoice', userId: userId }
            });

            if (error) throw error;
            if (data?.invoiceLink) {
                const tg = (window as any).Telegram?.WebApp;
                if (tg && tg.openInvoice) {
                    tg.openInvoice(data.invoiceLink, (status: string) => {
                        if (status === 'paid' || status === 'paid_med') {
                            if (tg.showAlert) tg.showAlert('Payment Successful!');
                            setTimeout(() => {
                                navigate('/profile');
                                window.location.reload();
                            }, 1000);
                        }
                    });
                } else {
                    window.open(data.invoiceLink, '_blank');
                }
            }
        } catch (e: any) {
            console.error('Payment Error', e);
            alert(`Payment failed: ${e.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--bg-input)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 10
                }}
            >
                <X size={20} color="var(--color-text-secondary)" />
            </button>

            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Star size={44} color="white" fill="white" />
                </div>
                <div className={styles.title}>Trackit Premium</div>
                <div className={styles.subtitle}>
                    Раскройте полный потенциал вашей продуктивности
                </div>
            </div>

            <div className={styles.features}>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF' }}>
                        <BarChart2 size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>Расширенная статистика</h3>
                        <p>Анализируйте свою продуктивность с графиками и цифрами</p>
                    </div>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon} style={{ background: 'rgba(52,199,89,0.1)', color: '#34C759' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>Поддержка развития</h3>
                        <p>Ваш вклад помогает нам делать приложение лучше</p>
                    </div>
                </div>

                {/* Placeholder for future features */}
                <div className={styles.featureCard} style={{ opacity: 0.6 }}>
                    <div className={styles.featureIcon}>
                        <Star size={24} />
                    </div>
                    <div className={styles.featureText}>
                        <h3>Скоро больше</h3>
                        <p>Новые функции уже в разработке</p>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                {!isPremium ? (
                    <>
                        <button className={styles.buyButton} onClick={handleBuyPremium} disabled={isLoading}>
                            {isLoading ? 'Загрузка...' : 'Подключить за 5 ⭐ / неделя'}
                        </button>
                        <div className={styles.price}>
                            Отменить можно в любой момет
                        </div>
                    </>
                ) : (
                    <div style={{
                        padding: 16, background: 'var(--color-success)', color: 'white',
                        borderRadius: 16, fontWeight: 600
                    }}>
                        У вас уже есть Premium! 🎉
                    </div>
                )}
            </div>
        </div>
    );
};
