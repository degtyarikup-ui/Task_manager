import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { getTelegramUser } from '../utils/telegram';
import {
    Moon,
    Bell,
    Globe,
    LogOut,
    Trash2,
    ChevronRight
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
    const { tasks, projects, clients, theme, toggleTheme, language, toggleLanguage } = useStore();
    const { t } = useTranslation();

    // Calculated Statistics
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const activeTasks = tasks.filter(t => t.status === 'in-progress').length;
    const totalProjects = projects.length;
    const totalClients = clients.length;

    // Get user data from Telegram
    const telegramUser = getTelegramUser();

    // Generate unique color based on user ID
    const generateGradient = (userId?: number) => {
        if (!userId) return 'linear-gradient(135deg, #FF9500, #FF2D55)';

        // Simple hash function to generate colors from ID
        const hue1 = (userId * 137) % 360; // Golden angle approximation
        const hue2 = (hue1 + 60) % 360; // Complementary hue

        return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 70%, 50%))`;
    };

    const user = {
        name: telegramUser?.first_name
            ? `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`
            : 'Пользователь',
        email: telegramUser?.username ? `@${telegramUser.username}` : 'Telegram User',
        initials: telegramUser?.first_name
            ? `${telegramUser.first_name[0]}${telegramUser.last_name?.[0] || ''}`
            : 'П',
        gradient: generateGradient(telegramUser?.id)
    };

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        isAlert: false
    });

    const handleClearData = () => {
        setConfirmConfig({
            isOpen: true,
            title: t('clearDataTitle'),
            message: t('clearDataMessage'),
            onConfirm: () => {
                localStorage.clear();
                window.location.reload();
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
                <div className={styles.avatar} style={{ background: user.gradient }}>
                    {user.initials}
                </div>
                <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                </div>
            </div>

            {/* Statistics */}
            <div className={styles.sectionTitle}>{t('statistics')}</div>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: 'var(--color-success)' }}>{completedTasks}</div>
                    <div className={styles.statLabel}>{t('completedTasks')}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: 'var(--color-accent)' }}>{activeTasks}</div>
                    <div className={styles.statLabel}>{t('activeTasks')}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: 'var(--color-text-primary)' }}>{totalProjects}</div>
                    <div className={styles.statLabel}>{t('lists')}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: 'var(--color-text-primary)' }}>{totalClients}</div>
                    <div className={styles.statLabel}>{t('clientsStats')}</div>
                </div>
            </div>

            {/* Settings Menu */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>{t('settings')}</div>
                <div className={styles.menuGroup}>
                    <button className={styles.menuItem} onClick={toggleTheme}>
                        <Moon size={20} className={styles.menuIcon} />
                        <span className={styles.menuLabel}>{t('theme')}</span>
                        <span className={styles.menuValue}>
                            {theme === 'light' ? t('light') : t('dark')} <ChevronRight size={16} />
                        </span>
                    </button>
                    <button className={styles.menuItem}>
                        <Bell size={20} className={styles.menuIcon} />
                        <span className={styles.menuLabel}>{t('notifications')}</span>
                        <span className={styles.menuValue}>
                            {t('on')} <ChevronRight size={16} />
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
                    <button className={`${styles.menuItem} ${styles.dangerItem}`}>
                        <LogOut size={20} className={styles.menuIcon} />
                        <span className={styles.menuLabel}>{t('logout')}</span>
                    </button>
                </div>
            </div>

            <div className={styles.version}>
                {t('version')} 1.0.2 • Build 240
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
        </div>
    );
};
