import React from 'react';
import { Users, CircleUser, CircleCheck, Calculator } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import styles from './BottomNav.module.css';

type Tab = 'tasks' | 'clients' | 'profile' | 'calculator';

interface BottomNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    return (
        <div className={styles.navContainer}>
            <button
                className={`${styles.navItem} ${activeTab === 'tasks' ? styles.active : ''}`}
                onClick={() => onTabChange('tasks')}
            >
                <div className={styles.iconWrapper}>
                    <CircleCheck size={24} />
                </div>
                <span className={styles.label}>{t('tasks')}</span>
            </button>

            <button
                className={`${styles.navItem} ${activeTab === 'clients' ? styles.active : ''}`}
                onClick={() => onTabChange('clients')}
            >
                <div className={styles.iconWrapper}>
                    <Users size={24} />
                </div>
                <span className={styles.label}>{t('clients')}</span>
            </button>

            <button
                className={`${styles.navItem} ${activeTab === 'calculator' ? styles.active : ''}`}
                onClick={() => onTabChange('calculator')}
            >
                <div className={styles.iconWrapper}>
                    <Calculator size={24} />
                </div>
                <span className={styles.label}>{t('calculator')}</span>
            </button>

            <button
                className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
                onClick={() => onTabChange('profile')}
            >
                <div className={styles.iconWrapper}>
                    <CircleUser size={24} />
                </div>
                <span className={styles.label}>{t('profile')}</span>
            </button>
        </div>
    );
};
