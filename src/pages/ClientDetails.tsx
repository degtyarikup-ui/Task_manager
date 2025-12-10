import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { TaskItem } from '../components/TaskItem';
import { ChevronLeft } from 'lucide-react';
import styles from './Tasks.module.css'; // Reuse basic styles
import { generateAvatarColor, getInitials } from '../utils/colors';
import { ru, enUS } from 'date-fns/locale';
import { Modal } from '../components/Modal';
import { Calendar, AlertTriangle, List } from 'lucide-react';
import formStyles from '../components/ui/Form.module.css';
import extraStyles from './TasksExtra.module.css';
import { formatDate, getStatusIcon, getStatusLabel, getIconClass } from '../utils/taskHelpers';
import { format } from 'date-fns';
import { Calendar as CustomCalendar } from '../components/Calendar';
import type { Task, Status, Priority } from '../types';

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

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const { availableStatuses, projects } = useStore(); // Cleaned up

    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        status: 'in-progress',
        priority: 'low',
        deadline: '',
        client: ''
    });

    const resetForm = () => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setFormData({ title: '', description: '', status: 'in-progress', priority: 'low', deadline: todayStr, client: '' });
        setEditingId(null);
        setActiveTool(null);
        setIsCalendarOpen(false);
    }

    const handleEdit = (task: Task) => {
        setEditingId(task.id);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority || 'low',
            deadline: task.deadline || todayStr,
            client: task.client,
            projectId: task.projectId
        });
        setIsModalOpen(true);
    };

    const togglePriority = () => {
        const cycle: Priority[] = ['low', 'medium', 'high'];
        const currentIdx = cycle.indexOf(formData.priority || 'low');
        const nextIdx = (currentIdx + 1) % cycle.length;
        setFormData(prev => ({ ...prev, priority: cycle[nextIdx] }));
    }

    const toggleTool = (tool: string) => {
        if (activeTool === tool) setActiveTool(null);
        else {
            setActiveTool(tool);
            setIsCalendarOpen(false); // Close calendar if opening tool
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title && editingId) {
            updateTask(editingId, {
                title: formData.title,
                description: formData.description || '',
                status: (formData.status as Status) || 'in-progress',
                priority: formData.priority || 'low',
                projectId: formData.projectId, // Allow moving lists?
                deadline: formData.deadline,
                client: formData.client // Keep existing client
            });
            setIsModalOpen(false);
            resetForm();
        }
    };

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
                            onEdit={handleEdit}
                            locale={locale}
                            t={t}
                        />
                    ))
                )}
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={t('editTask')}
            >
                <form onSubmit={handleSubmit}>
                    <div className={formStyles.inputGroup}>
                        <input
                            className={formStyles.input}
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t('taskTitle')}
                            autoFocus
                            required
                        />
                    </div>

                    {/* Tools Row */}
                    <div className={extraStyles.toolbar}>
                        {/* Date */}
                        <button
                            type="button"
                            className={`${extraStyles.toolBtn} ${formData.deadline ? extraStyles.active : ''}`}
                            onClick={() => setIsCalendarOpen(true)}
                        >
                            <Calendar size={18} className={extraStyles.toolIcon} />
                            {formData.deadline ? formatDate(formData.deadline, locale) : t('deadline')}
                        </button>

                        {isCalendarOpen && (
                            <CustomCalendar
                                selectedDate={formData.deadline || null}
                                onChange={(date) => setFormData({ ...formData, deadline: date })}
                                onClose={() => setIsCalendarOpen(false)}
                                locale={locale}
                                todayLabel={t('today') || 'Today'}
                            />
                        )}

                        <button type="button"
                            className={`${extraStyles.toolBtn} ${extraStyles.priorityBtn} ${getIconClass(formData.priority || 'low')} ${formData.priority !== 'low' ? extraStyles.active : ''} `}
                            onClick={togglePriority}
                        >
                            <AlertTriangle size={18} className={extraStyles.toolIcon} />
                        </button>

                        <button type="button"
                            className={`${extraStyles.toolBtn} ${activeTool === 'status' ? extraStyles.active : ''} `}
                            onClick={() => toggleTool('status')}
                        >
                            {getStatusIcon((formData.status as Status) || 'in-progress', 18)}
                            {getStatusLabel((formData.status as Status) || 'in-progress', t)}
                        </button>

                        {/* No Client Button - we are in client details */}

                        {projects.length > 0 && (
                            <button type="button"
                                className={`${extraStyles.toolBtn} ${activeTool === 'list' ? extraStyles.active : ''} `}
                                onClick={() => toggleTool('list')}
                            >
                                <List size={18} className={extraStyles.toolIcon} />
                                {projects.find(p => p.id === formData.projectId)?.title || t('list')}
                            </button>
                        )}
                    </div>

                    {/* Dynamic Details Area */}

                    {activeTool === 'status' && (
                        <div style={{ marginTop: 24 }}>
                            <label className={formStyles.label}>{t('taskStatus')}</label>
                            <div className={extraStyles.statusContainer} style={{ marginTop: 8 }}>
                                {availableStatuses.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`${extraStyles.optionChip} ${formData.status === s ? extraStyles.active : ''}`}
                                        onClick={() => {
                                            setFormData({ ...formData, status: s as Status });
                                            setActiveTool(null);
                                        }}
                                    // Context menu for delete status omitted for simplicity here, or can be added
                                    >
                                        {getStatusIcon(s as Status, 16)}
                                        {getStatusLabel(s as Status, t)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTool === 'list' && (
                        <div style={{ marginTop: 24 }}>
                            <label className={formStyles.label}>{t('list')}</label>
                            <div className={extraStyles.statusContainer} style={{ marginTop: 8 }}>
                                {projects.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className={styles.filterChip}
                                        style={{
                                            backgroundColor: formData.projectId === p.id ? 'black' : '#f2f2f7',
                                            color: formData.projectId === p.id ? 'white' : 'black',
                                            border: 'none'
                                        }}
                                        onClick={() => {
                                            setFormData({ ...formData, projectId: p.id });
                                            setActiveTool(null);
                                        }}
                                    >
                                        {p.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className={styles.submitBtn}>
                        {t('save')}
                    </button>
                </form>
            </Modal>
        </div>
    );
};
