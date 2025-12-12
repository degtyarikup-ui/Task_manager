import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { haptic } from '../utils/haptics';
import styles from './TaskForm.module.css';
import { Check, Plus, Calendar, AlertTriangle, User, List, Wand2, Loader2, X } from 'lucide-react';
import { generateAvatarColor, getInitials } from '../utils/colors';
import { formatDate, getStatusIcon, getStatusLabel, getIconClass } from '../utils/taskHelpers';
import { ru, enUS } from 'date-fns/locale';
import { Calendar as CustomCalendar } from '../components/Calendar';
import type { Status, Priority, Task } from '../types';

export const TaskForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { tasks, addTask, updateTask, projects, clients, availableStatuses, language, userId, isPremium } = useStore();
    const locale = language === 'ru' ? ru : enUS;

    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        subtasks: [],
        status: 'in-progress',
        priority: 'low',
        deadline: '',
        client: '',
        projectId: ''
    });

    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // Load Task Data if Editing
    useEffect(() => {
        if (id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                setFormData({
                    title: task.title,
                    subtasks: task.subtasks || [],
                    status: task.status,
                    priority: task.priority,
                    deadline: task.deadline,
                    client: task.client,
                    projectId: task.projectId
                });
            }
        }
    }, [id, tasks]);

    // Handle Telegram Back Button
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

    const handleSubmit = () => {
        if (!formData.title) {
            haptic.notification('error');
            return;
        }

        haptic.notification('success');

        if (id) {
            // Update
            updateTask(id, {
                title: formData.title,
                subtasks: formData.subtasks || [],
                status: formData.status as Status,
                priority: formData.priority,
                deadline: formData.deadline,
                client: formData.client,
                projectId: formData.projectId || undefined // Start using undefined
            });
        } else {
            // Create
            addTask({
                title: formData.title,
                subtasks: formData.subtasks || [],
                status: (formData.status as Status) || 'in-progress',
                priority: formData.priority || 'low',
                projectId: formData.projectId || undefined,
                deadline: formData.deadline,
                client: formData.client,
                userId: userId
            });
        }
        navigate(-1);
    };

    const addSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        const newSub = { id: Date.now().toString(), title: newSubtaskTitle.trim(), completed: false };
        setFormData(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), newSub] }));
        setNewSubtaskTitle('');
    };

    const removeSubtask = (subId: string) => {
        setFormData(prev => ({
            ...prev,
            subtasks: (prev.subtasks || []).filter(s => s.id !== subId)
        }));
    };

    const updateSubtaskTitle = (subId: string, title: string) => {
        setFormData(prev => ({
            ...prev,
            subtasks: (prev.subtasks || []).map(s => s.id === subId ? { ...s, title } : s)
        }));
    };

    const toggleSubtask = (subId: string) => {
        setFormData(prev => ({
            ...prev,
            subtasks: (prev.subtasks || []).map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
        }));
    };

    const handleGenerateSubtasks = async () => {
        if (!isPremium) {
            navigate('/premium');
            return;
        }

        if (!formData.title) return;
        setIsGenerating(true);
        setAiError(null);
        try {
            const response = await fetch('https://qysfycmynplwylnbnskw.supabase.co/functions/v1/generate-subtasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sb_publishable_ZikJgvMJx7lj9c7OmICtNg_ctMzFDDu'
                },
                body: JSON.stringify({
                    taskTitle: formData.title,
                    language: language
                })
            });

            if (!response.ok) throw new Error('Failed to generate');

            const data = await response.json();
            if (data.subtasks) {
                const newSubtasks = data.subtasks.map((t: string) => ({
                    id: crypto.randomUUID(),
                    title: t,
                    completed: false
                }));
                setFormData(prev => ({
                    ...prev,
                    subtasks: [...(prev.subtasks || []), ...newSubtasks]
                }));
                haptic.notification('success');
            }
        } catch (e: any) {
            setAiError(t('errorAIService'));
            haptic.notification('error');
        } finally {
            setIsGenerating(false);
        }
    };

    // UI Helpers
    const togglePriority = () => {
        const cycle: Priority[] = ['low', 'medium', 'high'];
        const currentIdx = cycle.indexOf(formData.priority || 'low');
        const nextIdx = (currentIdx + 1) % cycle.length;
        setFormData({ ...formData, priority: cycle[nextIdx] });
    };

    return (
        <div className={styles.container}>
            {/* Title Input */}
            <input
                className={styles.titleInput}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('taskTitle')}
                autoFocus={!id}
            />

            {/* AI Generation */}
            {formData.title && (
                <div style={{ width: '100%' }}>
                    <button className={styles.aiButton} onClick={handleGenerateSubtasks} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className={styles.spin} size={18} /> : <Wand2 size={18} />}
                        {isGenerating ? (t('generating') || 'AI Generating...') : (t('generateSubtasks') || 'Сгенерировать подзадачи')}
                    </button>
                    {aiError && (
                        <div style={{ color: 'var(--color-danger)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                            {aiError}
                        </div>
                    )}
                </div>
            )}

            {/* Subtasks */}
            <div className={styles.section}>
                <div className={styles.addSubtaskInput}>
                    <Plus size={20} color="var(--color-text-secondary)" />
                    <input
                        className={styles.input}
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        placeholder={t('addSubtask')}
                        onKeyDown={e => e.key === 'Enter' && addSubtask()}
                        style={{ padding: 0 }}
                    />
                    {newSubtaskTitle && (
                        <button onClick={addSubtask} style={{ border: 'none', background: 'var(--color-accent)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Plus size={14} />
                        </button>
                    )}
                </div>

                <div className={styles.subtaskList}>
                    {(formData.subtasks || []).map((sub) => (
                        <div key={sub.id} className={styles.subtaskItem}>
                            <button onClick={() => toggleSubtask(sub.id)} style={{ padding: 0, background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--color-border)',
                                    background: sub.completed ? 'var(--color-accent)' : 'transparent',
                                    borderColor: sub.completed ? 'var(--color-accent)' : 'var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {sub.completed && <Check size={12} color="white" />}
                                </div>
                            </button>
                            <textarea
                                value={sub.title}
                                onChange={(e) => {
                                    updateSubtaskTitle(sub.id, e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                className={styles.subtaskInput}
                                style={{
                                    textDecoration: sub.completed ? 'line-through' : 'none',
                                    color: sub.completed ? 'var(--color-text-secondary)' : 'var(--color-text-primary)'
                                }}
                                rows={1}
                            />
                            <button onClick={() => removeSubtask(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', padding: 4 }}>
                                <X size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Properties */}
            <div className={styles.section} style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden' }}>
                <button className={styles.menuItem} onClick={() => setIsCalendarOpen(true)}>
                    <div className={styles.menuIcon}>
                        <Calendar size={20} color="var(--color-accent)" />
                        <span>{formData.deadline ? formatDate(formData.deadline, locale) : t('deadline')}</span>
                    </div>
                </button>

                <button className={styles.menuItem} onClick={togglePriority}>
                    <div className={styles.menuIcon}>
                        <AlertTriangle size={20} className={getIconClass(formData.priority || 'low')} />
                        <span>{t('priority')}: {t(formData.priority || 'low')}</span>
                    </div>
                </button>

                <div className={styles.menuItem}>
                    <div className={styles.menuIcon}>
                        <List size={20} color="#FF9500" />
                        <select
                            value={formData.projectId || ''}
                            onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                            style={{ border: 'none', background: 'transparent', fontSize: 16, color: 'var(--color-text-primary)', outline: 'none', width: '100%' }}
                        >
                            <option value="">{formData.projectId ? projects.find(p => p.id === formData.projectId)?.title : t('list')}</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.menuItem}>
                    <div className={styles.menuIcon}>
                        {formData.client ? (
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: generateAvatarColor(formData.client), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                                {getInitials(formData.client)}
                            </div>
                        ) : <User size={20} color="#007AFF" />}
                        <select
                            value={formData.client || ''}
                            onChange={e => setFormData({ ...formData, client: e.target.value })}
                            style={{ border: 'none', background: 'transparent', fontSize: 16, color: 'var(--color-text-primary)', outline: 'none', width: '100%' }}
                        >
                            <option value="">{formData.client || t('client')}</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.menuItem}>
                    <div className={styles.menuIcon}>
                        {formData.status ? getStatusIcon(formData.status as Status, 20) : <div style={{ width: 20 }} />}
                        <select
                            value={formData.status || ''}
                            onChange={e => setFormData({ ...formData, status: e.target.value as Status })}
                            style={{ border: 'none', background: 'transparent', fontSize: 16, color: 'var(--color-text-primary)', outline: 'none', width: '100%' }}
                        >
                            {availableStatuses.map(s => (
                                <option key={s} value={s}>{getStatusLabel(s as Status, t)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Save FAB */}
            <button className={styles.saveFab} onClick={handleSubmit}>
                <Check size={28} />
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
        </div>
    );
};
