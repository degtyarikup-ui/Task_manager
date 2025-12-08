import React from 'react';
import { LayoutDashboard, CheckSquare, FolderKanban, Users, Settings } from 'lucide-react';
import clsx from 'clsx';
import styles from './Sidebar.module.css';

type View = 'dashboard' | 'projects' | 'tasks' | 'clients';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
    const navItems = [
        { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard },
        { id: 'projects', label: 'Проекты', icon: FolderKanban },
        { id: 'tasks', label: 'Задачи', icon: CheckSquare },
        { id: 'clients', label: 'Клиенты', icon: Users },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <span className={styles.accent}>●</span> CRM
                </h1>
                <p className={styles.subtitle}>Фриланс менеджер</p>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as View)}
                            className={clsx(styles.navItem, isActive && styles.active)}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <button className={styles.navItem}>
                    <Settings size={20} />
                    Настройки
                </button>
            </div>
        </aside>
    );
};
