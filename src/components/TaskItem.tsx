import React, { useState } from 'react';
import { Check, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import type { Task } from '../types';
import styles from '../pages/Tasks.module.css';
import extraStyles from '../pages/TasksExtra.module.css';
import { generateAvatarColor, getInitials } from '../utils/colors';
import { haptic } from '../utils/haptics';
import { formatDate, getStatusIcon, getStatusLabel } from '../utils/taskHelpers';

interface TaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
    isDeleting?: boolean;
    locale: any;
    t: any;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit, isDeleting, locale, t }) => {
    const [offset, setOffset] = useState(0);
    const startX = React.useRef(0);
    const isDragging = React.useRef(false);

    const onTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = false;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        if (diff < 0) {
            setOffset(Math.max(diff, -100));
            if (Math.abs(diff) > 5) isDragging.current = true;
        }
    };

    const onTouchEnd = () => {
        if (offset < -60) {
            haptic.notification('warning');
            onDelete(task.id);
            setOffset(-500);
        } else {
            setOffset(0);
        }
        setTimeout(() => { isDragging.current = false; }, 100);
    };

    const priorityColor = task.priority === 'high' ? '#FF3B30' : task.priority === 'medium' ? '#FF9500' : 'var(--color-border)';

    return (
        <div style={{ position: 'relative', borderRadius: 16, marginBottom: 6, overflow: 'hidden' }}>
            <div style={{
                position: 'absolute', inset: 0,
                background: '#FF3B30',
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                paddingRight: 24, borderRadius: 16,
                opacity: offset < -5 ? 1 : 0,
                transition: 'opacity 0.2s'
            }}>
                <Trash2 size={24} color="white" />
            </div>

            <div className={`${styles.taskCard} ${isDeleting ? styles.deleting : ''}`}
                onClick={() => { if (!isDragging.current && offset === 0) onEdit(task); else setOffset(0); }}
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                style={{
                    transform: `translateX(${offset}px)`,
                    transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    marginBottom: 0,
                    background: 'var(--bg-card)',
                    position: 'relative',
                    zIndex: 2
                }}
            >
                <button
                    className={`${styles.checkbox} ${task.status === 'completed' ? styles.checked : ''} `}
                    onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                    style={{
                        borderColor: task.status === 'completed' ? 'transparent' : priorityColor,
                        borderWidth: 2
                    }}
                >
                    {task.status === 'completed' && <Check size={14} color="white" />}
                </button>
                <div className={styles.taskContent}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                        <span className={`${styles.taskTitle} ${task.status === 'completed' ? styles.completedText : ''} `} style={{ marginBottom: 0 }}>
                            {task.title}
                        </span>
                    </div>
                    {task.description && <p className={styles.taskDesc}>{task.description}</p>}

                    <div className={extraStyles.taskMeta}>
                        {task.deadline && (
                            <span className={extraStyles.metaBadge} style={
                                (task.status !== 'completed' && new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0)))
                                    ? { color: '#FF3B30', backgroundColor: 'rgba(255, 59, 48, 0.1)' }
                                    : {}
                            }>
                                {(task.status !== 'completed' && new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0)))
                                    ? <AlertTriangle size={10} />
                                    : <Calendar size={10} />
                                }
                                {formatDate(task.deadline, locale)}
                            </span>
                        )}

                        {task.client && (
                            <span className={extraStyles.metaBadge} style={{ paddingLeft: 4, paddingRight: 10, borderRadius: 20, gap: 6 }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: generateAvatarColor(task.client),
                                    color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, fontWeight: 'bold'
                                }}>
                                    {getInitials(task.client)}
                                </div>
                                {task.client}
                            </span>
                        )}
                        <span className={extraStyles.metaBadge}>
                            {getStatusIcon(task.status, 10)}
                            {getStatusLabel(task.status, t)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
