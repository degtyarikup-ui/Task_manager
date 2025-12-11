import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { getTelegramUser } from '../utils/telegram';
import { generateAvatarColor } from '../utils/colors'; // Import shared util
import {
    Moon,
    Star,
    Globe,
    Trash2,
    ChevronRight,
    Heart,
    Copy,
    Check,
    Wallet,
    HelpCircle
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../components/Modal';
import styles from './Profile.module.css';


export const Profile: React.FC = () => {
    const { tasks, clients, theme, toggleTheme, language, toggleLanguage, deleteAccount, isPremium } = useStore();
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Calculated Statistics
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const activeTasks = tasks.filter(t => t.status === 'in-progress').length;
    const onHoldTasks = tasks.filter(t => t.status === 'on-hold').length;
    const totalClients = clients.length;

    // Get user data from Telegram
    const telegramUser = getTelegramUser();

    const user = {
        name: telegramUser?.first_name
            ? `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`
            : 'Пользователь',
        email: telegramUser?.username ? `@${telegramUser.username}` : 'Telegram User',
        initials: telegramUser?.first_name
            ? `${telegramUser.first_name[0]}${telegramUser.last_name?.[0] || ''}`
            : 'П',
        gradient: generateAvatarColor(telegramUser?.first_name || '', telegramUser?.id), // Use shared util
        avatarUrl: telegramUser?.photo_url
    };



    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        isAlert: false
    });

    const [isDonateOpen, setIsDonateOpen] = useState(false);
    const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Адрес USDT (TON)
    const WALLET_ADDRESS = 'UQAK0pJdd3kOfQ5XWuiYODbTdNtKxpSnHV3BFdEp2SyswJ-r';
    const SUPPORT_LINK = 'https://t.me/sergei_degtyarik';

    const handleCopy = () => {
        navigator.clipboard.writeText(WALLET_ADDRESS);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenWallet = () => {
        const link = `https://app.tonkeeper.com/transfer/${WALLET_ADDRESS}`;
        const tg = (window as any).Telegram?.WebApp;

        if (tg && tg.openLink) {
            tg.openLink(link);
        } else {
            window.open(link, '_blank');
        }
    };

    const handleSupport = () => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg && tg.openTelegramLink) {
            tg.openTelegramLink(SUPPORT_LINK);
        } else {
            window.open(SUPPORT_LINK, '_blank');
        }
    };

    const handleClearData = () => {
        setConfirmConfig({
            isOpen: true,
            title: t('clearDataTitle'),
            message: t('clearDataMessage'),
            onConfirm: () => {
                deleteAccount();
            },
            isDestructive: true,
            isAlert: false
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>{t('profile')}</h1>
            </header>

            {/* Profile Header */}
            <div className={styles.profileCard}>
                <div
                    className={styles.avatar}
                    style={{
                        background: user.avatarUrl ? 'transparent' : (user?.gradient || 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)'),
                        overflow: 'hidden' // Ensure image respects border radius
                    }}
                >
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        user.initials
                    )}
                </div>
                <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                </div>
            </div>

            {/* Statistics */}
            <div className={styles.sectionTitle}>
                {t('statistics')}
                {isPremium && <span style={{ marginLeft: 8, fontSize: 12, color: '#FFD700' }}>★ Premium</span>}
            </div>

            <div style={{ position: 'relative' }}>
                <div className={styles.statsGrid} style={!isPremium ? { filter: 'blur(8px)', opacity: 0.5, pointerEvents: 'none' } : {}}>
                    <div className={styles.statCard} onClick={() => setIsCompletedModalOpen(true)} style={{ cursor: 'pointer' }}>
                        <div className={styles.statValue} style={{ color: 'var(--color-success)' }}>{completedTasks}</div>
                        <div className={styles.statLabel}>{t('completedTasks')}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue} style={{ color: 'var(--color-accent)' }}>{activeTasks}</div>
                        <div className={styles.statLabel}>{t('activeTasks')}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue} style={{ color: 'var(--color-text-primary)' }}>{onHoldTasks}</div>
                        <div className={styles.statLabel}>{t('lists')}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue} style={{ color: 'var(--color-text-primary)' }}>{totalClients}</div>
                        <div className={styles.statLabel}>{t('clientsStats')}</div>
                    </div>
                </div>

                {!isPremium && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10
                    }}>
                        <div style={{
                            background: 'var(--bg-card)', padding: '20px 24px', borderRadius: 20,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                            textAlign: 'center',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: 32 }}>📊</div>
                            <div style={{ fontWeight: 700, fontSize: 17 }}>{t('statistics')}</div>
                            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                                Unlock detailed statistics<br />for 1 week
                            </div>
                            <button onClick={() => navigate('/premium')} style={{
                                background: 'linear-gradient(135deg, #007AFF 0%, #00C6FF 100%)',
                                color: 'white', border: 'none',
                                padding: '12px 24px', borderRadius: 12, fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                marginTop: 8,
                                boxShadow: '0 4px 12px rgba(0,122,255,0.3)'
                            }}>
                                {t('premium') || 'Premium'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Menu */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>{t('settings')}</div>
                <div className={styles.menuGroup}>
                    <button className={styles.menuItem} onClick={() => navigate('/premium')}>
                        <div className={styles.menuIcon} style={{ color: '#FFD700' }}>
                            <Star size={20} />
                        </div>
                        <div className={styles.menuLabel}>Premium</div>
                        <ChevronRight size={16} className={styles.menuValue} />
                    </button>
                    <button className={styles.menuItem} onClick={handleSupport}>
                        <div className={styles.menuIcon} style={{ color: 'var(--color-accent)' }}>
                            <HelpCircle size={20} />
                        </div>
                        <div className={styles.menuLabel}>{t('support')}</div>
                        <ChevronRight size={16} className={styles.menuValue} />
                    </button>
                    <button className={styles.menuItem} onClick={() => setIsDonateOpen(true)}>
                        <div className={styles.menuIcon} style={{ color: '#FF2D55' }}>
                            <Heart size={20} />
                        </div>
                        <div className={styles.menuLabel}>{t('donate')}</div>
                        <ChevronRight size={16} className={styles.menuValue} />
                    </button>

                    <button className={styles.menuItem} onClick={toggleTheme}>
                        <div className={styles.menuIcon}>
                            <Moon size={20} />
                        </div>
                        <span className={styles.menuLabel}>{t('theme')}</span>
                        <span className={styles.menuValue}>
                            {theme === 'light' ? t('light') : t('dark')} <ChevronRight size={16} />
                        </span>
                    </button>

                    <button className={styles.menuItem} onClick={toggleLanguage}>
                        <Globe size={20} className={styles.menuIcon} />
                        <span className={styles.menuLabel}>{t('language')}</span>
                        <span className={styles.menuValue}>
                            {language === 'ru' ? t('russian') : t('english')} <ChevronRight size={16} />
                        </span>
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>{t('data')}</div>
                <div className={styles.menuGroup}>
                    <button className={`${styles.menuItem} ${styles.dangerItem}`} onClick={handleClearData}>
                        <Trash2 size={20} className={styles.menuIcon} />
                        <span className={styles.menuLabel}>{t('clearAllData')}</span>
                    </button>

                </div>
            </div>

            <div className={styles.version}>
                {t('version')} 1.0.3 • Build 242
            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                isDestructive={confirmConfig.isDestructive}
                isAlert={confirmConfig.isAlert}
                onConfirm={() => {
                    confirmConfig.onConfirm();
                    setConfirmConfig({ ...confirmConfig, isOpen: false });
                }}
                onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
            />

            <Modal
                isOpen={isDonateOpen}
                onClose={() => setIsDonateOpen(false)}
                title={t('donateTitle')}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        marginBottom: '8px'
                    }}>
                        <Heart size={32} fill="white" />
                    </div>

                    <p style={{ fontSize: '15px', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
                        {t('donateMessage')}
                    </p>

                    <div style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--bg-input)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        color: 'var(--color-text-primary)'
                    }}>
                        {WALLET_ADDRESS}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button
                            onClick={handleCopy}
                            style={{
                                flex: 1,
                                height: '44px',
                                borderRadius: '12px',
                                background: isCopied ? 'var(--color-success)' : 'var(--bg-chip)',
                                color: isCopied ? 'white' : 'var(--color-text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                        >
                            {isCopied ? <Check size={18} /> : <Copy size={18} />}
                            {isCopied ? t('copied') : t('copyAddress')}
                        </button>

                        <button
                            onClick={handleOpenWallet}
                            style={{
                                flex: 1,
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--color-accent)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontWeight: 500
                            }}
                        >
                            <Wallet size={18} />
                            Wallet
                        </button>
                    </div>
                </div>

            </Modal >

            {/* Completed Tasks History */}
            < Modal
                isOpen={isCompletedModalOpen}
                onClose={() => setIsCompletedModalOpen(false)}
                title={t('completedTasks')}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tasks.filter(t => t.status === 'completed').sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)).map(t => (
                        <div key={t.id} style={{
                            background: 'var(--bg-input)', padding: '12px 14px', borderRadius: 12,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', overflow: 'hidden' }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: 'var(--color-success)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Check size={12} color="white" strokeWidth={3} />
                                </div>
                                <span style={{
                                    textDecoration: 'line-through',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: 15,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {t.title}
                                </span>
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0, marginLeft: 8 }}>
                                {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                    {tasks.filter(t => t.status === 'completed').length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '32px 0' }}>
                            Нет завершенных задач
                        </div>
                    )}
                </div>
            </Modal >
        </div >
    );
};
