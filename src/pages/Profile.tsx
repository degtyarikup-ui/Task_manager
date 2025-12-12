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
    const { tasks, clients, theme, toggleTheme, language, toggleLanguage, deleteAccount, isPremium, togglePremiumDebug, userId, userProfile, uploadProfileAvatar } = useStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        gradient: generateAvatarColor(telegramUser?.first_name || '', telegramUser?.id),
        avatarUrl: userProfile?.avatar_url || telegramUser?.photo_url
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                await uploadProfileAvatar(file);
            } catch (error) {
                console.error('Failed to upload avatar', error);
                alert('Failed to upload avatar');
            }
        }
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
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <div
                    className={styles.avatar}
                    style={{
                        background: user.avatarUrl ? 'transparent' : (user?.gradient || 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)'),
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                    onClick={handleAvatarClick}
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
            {isPremium && (
                <>
                    <div className={styles.sectionTitle}>
                        {t('statistics')}
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-premium)' }}>★ Premium</span>
                    </div>

                    <div className={styles.statsGrid}>
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
                </>
            )}

            {/* Settings Menu */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>{t('settings')}</div>
                <div className={styles.menuGroup}>
                    <button className={styles.menuItem} onClick={() => navigate('/premium')}>
                        <div className={styles.menuIcon} style={{ color: 'var(--color-premium)' }}>
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

            {(userId === 6034524743 || userId === 906251783 || userId === 643656439) && (
                <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 8, opacity: 0.8 }}>
                    <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: 12,
                        cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            checked={isPremium}
                            onChange={togglePremiumDebug}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Dev: Admin Premium
                        </span>
                    </label>
                </div>
            )}

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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        position: 'relative'
                    }}>
                        <div style={{
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                            color: 'var(--color-text-primary)',
                            flex: 1,
                            textAlign: 'left'
                        }}>
                            {WALLET_ADDRESS}
                        </div>
                        <button
                            onClick={handleCopy}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: isCopied ? 'var(--color-success)' : 'var(--color-text-secondary)',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {isCopied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>

                    <button
                        onClick={handleOpenWallet}
                        style={{
                            width: '100%',
                            height: '48px',
                            borderRadius: '14px',
                            background: '#0098EA', // Official Wallet Blue
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: 600,
                            fontSize: '16px'
                        }}
                    >
                        <Wallet size={20} />
                        Wallet
                    </button>
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
                            {t('noCompletedTasks')}
                        </div>
                    )}
                </div>
            </Modal >
        </div >
    );
};
