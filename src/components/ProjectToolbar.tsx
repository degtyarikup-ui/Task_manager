import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import type { Project } from '../types';
import { haptic } from '../utils/haptics';
import styles from './ProjectToolbar.module.css';

interface ProjectToolbarProps {
    projects: Project[];
    activeTab: string;
    onTabChange: (id: string) => void;
    onAddList: () => void;
    onEditList: (project: Project) => void;
    t: (key: any) => string;
}

export const ProjectToolbar: React.FC<ProjectToolbarProps> = ({
    projects,
    activeTab,
    onTabChange,
    onAddList,
    onEditList,
    t
}) => {
    const longPressTimer = useRef<any>(null);
    const isLongPress = useRef(false);

    const handleTouchStart = (project: Project) => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            haptic.impact('medium');
            onEditList(project);
        }, 600);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    return (
        <div className={styles.container}>
            <button
                className={styles.addButton}
                onClick={onAddList}
                aria-label={t('createList')}
            >
                <Plus size={22} />
            </button>

            <div className={styles.scrollArea}>
                <button
                    className={`${styles.chip} ${activeTab === 'all' ? styles.activeChip : ''} ${activeTab === 'all' ? styles.active : ''}`}
                    onClick={() => onTabChange('all')}
                >
                    {t('all')}
                </button>

                {projects.map(p => (
                    <button
                        key={p.id}
                        className={`${styles.chip} ${activeTab === p.id ? styles.active : ''}`}
                        onClick={() => {
                            if (!isLongPress.current) {
                                onTabChange(p.id);
                            }
                        }}
                        onTouchStart={() => handleTouchStart(p)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {p.title}
                    </button>
                ))}
            </div>
        </div>
    );
};
