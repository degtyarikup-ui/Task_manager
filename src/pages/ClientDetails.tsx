import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { TaskItem } from '../components/TaskItem';
import { ChevronLeft } from 'lucide-react';
import styles from './Tasks.module.css'; // Reuse basic styles
import { generateAvatarColor, getInitials } from '../utils/colors';
import { ru, enUS } from 'date-fns/locale';

export const ClientDetails: React.FC = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { clients, tasks, language, updateTask, deleteTask } = useStore();
    const { t } = useTranslation();
    const locale = language === 'ru' ? ru : enUS;

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

    const client = clients.find(c => c.id === clientId);

    if (!client) {
        return (
            <div className={styles.container}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                    <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', padding: 0, marginRight: 16 }}>
                        <ChevronLeft size={28} color="var(--color-text-primary)" />
                    </button>
                    <div>Client not found</div>
                </div>
            </div>
        );
    }

    const clientTasks = tasks.filter(task => task.client === client.name);

    const handleToggle = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
            updateTask(id, { status: newStatus });
        }
    };

    const handleDelete = (id: string) => {
        // Simple native confirm
        if (window.confirm('Delete this task?')) {
            deleteTask(id);
        }
    };

    return (
        <div className={`${styles.container} ${styles.detailsHeaderPadding}`}>


            {/* Client Info Card */}
            <div style={{
                background: 'var(--bg-card)',
                padding: 24,
                borderRadius: 24,
                marginBottom: 32,
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: generateAvatarColor(client.name),
                    color: 'white', fontSize: 24, fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                }}>
                    {getInitials(client.name)}
                </div>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>{client.name}</div>
                    {client.contact && <div style={{ color: 'var(--color-text-secondary)', fontSize: 15, marginTop: 4 }}>{client.contact}</div>}
                </div>
            </div>

            {/* Tasks List */}
            <h3 style={{ marginBottom: 16, color: 'var(--color-text-primary)' }}>{t('tasks') || 'Tasks'} ({clientTasks.length})</h3>
            <div className={styles.taskList}>
                {clientTasks.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 32 }}>
                        {t('noTasks') || 'No tasks found'}
                    </p>
                ) : (
                    clientTasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onEdit={() => { }}
                            locale={locale}
                            t={t}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
