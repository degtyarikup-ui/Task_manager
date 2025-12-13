import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { haptic } from '../utils/haptics';
import styles from './TaskForm.module.css';
import { Check, Plus, Calendar, AlertTriangle, List, Wand2, Loader2, X, ChevronDown, GripVertical, Circle } from 'lucide-react';
import { generateAvatarColor, getInitials } from '../utils/colors';
import { formatDate, getStatusIcon, getStatusLabel, getIconClass } from '../utils/taskHelpers';
import { ru, enUS } from 'date-fns/locale';
import { Calendar as CustomCalendar } from '../components/Calendar';
import { Modal } from '../components/Modal';
import { BottomSheet } from '../components/BottomSheet';
import sheetStyles from '../components/BottomSheet.module.css';
import type { Status, Priority, Task } from '../types';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

export const TaskForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { tasks, addTask, updateTask, projects, clients, availableStatuses, language, userId, isPremium, addCustomStatus } = useStore();
    const locale = language === 'ru' ? ru : enUS;

    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        subtasks: [],
        status: '', // Initial empty status
        priority: 'low',
        deadline: '',
        client: '',
        projectId: ''
    });

    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);
    const [customStatusText, setCustomStatusText] = useState('');

    const titleRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize title
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto';
            titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
        }
    }, [formData.title]);

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

        const statusToSave = formData.status || '';

        if (id) {
            // Update
            updateTask(id, {
                title: formData.title,
                subtasks: formData.subtasks || [],
                status: statusToSave as Status,
                priority: formData.priority,
                deadline: formData.deadline,
                client: formData.client,
                projectId: formData.projectId || undefined
            });
        } else {
            // Create
            addTask({
                title: formData.title,
                subtasks: formData.subtasks || [],
                status: statusToSave as Status,
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

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        if (sourceIndex === destIndex) return;

        const newSubtasks = Array.from(formData.subtasks || []);
        const [moved] = newSubtasks.splice(sourceIndex, 1);
        newSubtasks.splice(destIndex, 0, moved);

        setFormData(prev => ({ ...prev, subtasks: newSubtasks }));
        haptic.selection();
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
                    title: formData.title,
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
            {/* Title Input (Textarea) */}
            <textarea
                ref={titleRef}
                className={styles.titleInput}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('taskTitle')}
                rows={1}
                autoFocus={!id}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        // Allow new line
                    }
                }}
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
                    {/* Removed Plus Icon here as per request */}
                    <input
                        className={styles.subtaskInput}
                        style={{ padding: '8px 0', fontSize: 16 }}
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        placeholder={t('addSubtask')}
                        onKeyDown={e => e.key === 'Enter' && addSubtask()}
                    />
                    {newSubtaskTitle && (
                        <button onClick={addSubtask} style={{ border: 'none', background: 'var(--color-accent)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Plus size={14} />
                        </button>
                    )}
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="subtasks-list">
                        {(provided) => (
                            <div
                                className={styles.subtaskList}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {(formData.subtasks || []).map((sub, index) => (
                                    <Draggable key={sub.id} draggableId={sub.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={styles.subtaskItem}
                                                style={provided.draggableProps.style}
                                            >
                                                <div {...provided.dragHandleProps} style={{ padding: '0 8px 0 0', cursor: 'grab', color: 'var(--color-text-secondary)', opacity: 0.5 }}>
                                                    <GripVertical size={20} />
                                                </div>

                                                <button onClick={() => toggleSubtask(sub.id)} style={{ padding: 0, background: 'none', border: 'none', display: 'flex', alignItems: 'center', marginRight: 8 }}>
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
                                                    ref={el => {
                                                        if (el) {
                                                            el.style.height = 'auto';
                                                            el.style.height = el.scrollHeight + 'px';
                                                        }
                                                    }}
                                                />
                                                <button onClick={() => removeSubtask(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', padding: 4 }}>
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            {/* Properties */}
            <div className={styles.section} style={{ background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Deadline */}
                <button className={styles.menuItem} onClick={() => setIsCalendarOpen(true)}>
                    <div className={styles.menuIcon}>
                        <Calendar size={20} color="var(--color-accent)" />
                        <span>{formData.deadline ? formatDate(formData.deadline, locale) : (t('deadline') || 'Дедлайн')}</span>
                    </div>
                    <ChevronDown size={16} className={styles.menuRightIcon} />
                </button>

                {/* Priority */}
                <button className={styles.menuItem} onClick={togglePriority}>
                    <div className={styles.menuIcon}>
                        <AlertTriangle size={20} className={getIconClass(formData.priority || 'low')} />
                        <span style={{ flex: 1 }}>{t('priority') || 'Приоритет'}: {t(formData.priority || 'low')}</span>
                    </div>
                </button>

                {/* Project / List */}
                <div className={styles.menuItem}>
                    <List size={20} color="var(--color-accent)" className={styles.menuLeftIcon} />
                    <span style={{ flex: 1, paddingRight: 8 }}>
                        {formData.projectId
                            ? (projects.find(p => p.id === formData.projectId)?.title || t('list'))
                            : (t('list') || 'Список')}
                    </span>
                    <select
                        className={styles.rowSelect}
                        value={formData.projectId || ''}
                        onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                        style={{ opacity: 0 }}
                    >
                        <option value="">{t('selectList') || 'Выбрать список'}</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className={styles.menuRightIcon} />
                </div>

                {/* Status */}
                <div className={styles.menuItem} onClick={() => setIsStatusSheetOpen(true)}>
                    <div className={styles.menuLeftIcon}>
                        {formData.status ? getStatusIcon(formData.status as Status, 20) : <Circle size={20} color="var(--color-accent)" />}
                    </div>
                    <span style={{ flex: 1, paddingRight: 8 }}>
                        {formData.status ? getStatusLabel(formData.status as Status, t) : (t('noStatus') || 'Нет статуса')}
                    </span>
                    <ChevronDown size={16} className={styles.menuRightIcon} />
                </div>
            </div>

            {/* Client Section (Moved to Bottom) - Horizontal Scroll */}
            <div className={styles.clientSection}>
                <div className={styles.sectionTitle}>{t('client') || 'Клиент'}</div>
                <div className={styles.clientScrollList}>
                    {/* Removed None option */}

                    {clients.map(c => (
                        <div
                            key={c.id}
                            className={`${styles.clientCard} ${formData.client === c.name ? styles.selectedClient : ''}`}
                            onClick={() => setFormData(prev => ({ ...prev, client: prev.client === c.name ? '' : c.name }))}
                        >
                            {c.avatar_url ? (
                                <div className={styles.clientAvatarLarge} style={{ backgroundImage: `url(${c.avatar_url})` }} />
                            ) : (
                                <div className={styles.clientAvatarLarge} style={{ background: generateAvatarColor(c.name) }}>
                                    {getInitials(c.name)}
                                </div>
                            )}
                            <span className={styles.clientName}>{c.name}</span>
                        </div>
                    ))}
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
                    removeDateLabel={t('removeDate') || 'Убрать дату'}
                />
            )}

            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title={t('status') || 'Status'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <input
                        className={styles.input}
                        value={customStatusText}
                        onChange={(e) => setCustomStatusText(e.target.value)}
                        placeholder={t('enterStatus') || "Введите статус..."}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (customStatusText.trim()) {
                                    addCustomStatus(customStatusText.trim());
                                    setFormData({ ...formData, status: customStatusText.trim() as Status });
                                }
                                setIsStatusModalOpen(false);
                            }
                        }}
                    />
                    <button
                        className={styles.input}
                        style={{ background: 'var(--color-accent)', color: 'white', fontWeight: 600, textAlign: 'center', justifyContent: 'center' }}
                        onClick={() => {
                            if (customStatusText.trim()) {
                                addCustomStatus(customStatusText.trim());
                                setFormData({ ...formData, status: customStatusText.trim() as Status });
                            }
                            setIsStatusModalOpen(false);
                        }}
                    >
                        {t('add') || 'Add'}
                    </button>
                </div>
            </Modal>

            <BottomSheet
                isOpen={isStatusSheetOpen}
                onClose={() => setIsStatusSheetOpen(false)}
                title={t('taskStatus') || 'Task Status'}
            >
                {/* No Status */}
                <button className={sheetStyles.option} onClick={() => { setFormData({ ...formData, status: '' }); setIsStatusSheetOpen(false); }}>
                    <Circle size={20} color="var(--color-text-secondary)" />
                    {t('noStatus') || 'No Status'}
                    {!formData.status && <Check size={16} style={{ marginLeft: 'auto', color: 'var(--color-accent)' }} />}
                </button>

                {/* Available Statuses */}
                {availableStatuses.map(s => (
                    <button key={s} className={sheetStyles.option} onClick={() => { setFormData({ ...formData, status: s as Status }); setIsStatusSheetOpen(false); }}>
                        {getStatusIcon(s as Status, 20)}
                        {getStatusLabel(s as Status, t)}
                        {formData.status === s && <Check size={16} style={{ marginLeft: 'auto', color: 'var(--color-accent)' }} />}
                    </button>
                ))}

                <div className={sheetStyles.separator} />

                {/* Add New */}
                <button className={sheetStyles.option} onClick={() => { setIsStatusSheetOpen(false); setTimeout(() => { setCustomStatusText(''); setIsStatusModalOpen(true); }, 200); }}>
                    <Plus size={20} color="var(--color-accent)" />
                    {t('add') || 'Add'}
                </button>
            </BottomSheet>
        </div>
    );
};
