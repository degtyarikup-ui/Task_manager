
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { generateAvatarColor, getInitials } from '../utils/colors';
import { haptic } from '../utils/haptics';
import { Modal } from '../components/Modal';
import { Check, Plus, Trash2, Calendar, AlertTriangle, Loader, User, Pause, List } from 'lucide-react';
import type { Task, Status, Priority, Project } from '../types';
import styles from './Tasks.module.css';
import extraStyles from './TasksExtra.module.css';
import formStyles from '../components/ui/Form.module.css';
import { format, isSameYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar as CustomCalendar } from '../components/Calendar'; // Alias to avoid conflict if any

import { ConfirmModal } from '../components/ConfirmModal'; // Import custom modal

// ... logic ...



const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: any = { locale: ru };
    if (!isSameYear(date, new Date())) {
        return format(date, 'd MMM yyyy', options);
    }
    return format(date, 'd MMM', options);
};

// Priority Helpers
const getIconClass = (p: Priority) => {
    switch (p) {
        case 'high': return extraStyles.priorityHigh;
        case 'medium': return extraStyles.priorityMedium;
        case 'low': return extraStyles.priorityLow;
        default: return extraStyles.priorityLow;
    }
};

const getStatusIcon = (s: Status, size = 14) => {
    switch (s) {
        case 'in-progress': return <Loader size={size} className={extraStyles.toolIcon} />;
        case 'on-hold': return <Pause size={size} className={extraStyles.toolIcon} />;
        case 'completed': return <Check size={size} className={extraStyles.toolIcon} />;
        default: return <Loader size={size} className={extraStyles.toolIcon} />;
    }
};

const getStatusLabel = (s: Status) => {
    const map: Record<string, string> = {
        'in-progress': 'В работе',
        'on-hold': 'Пауза',
        'completed': 'Готово',
        'archive': 'Архив'
    };
    return map[s] || s;
}

// Simple Task Card Component
const TaskItem = ({ task, onToggle, onDelete, onEdit, isDeleting }: { task: Task, onToggle: (id: string) => void, onDelete: (id: string) => void, onEdit: (task: Task) => void, isDeleting?: boolean }) => {
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
                            <span className={extraStyles.metaBadge}>
                                <Calendar size={10} />
                                {formatDate(task.deadline)}
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
                            {getStatusLabel(task.status)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Tasks: React.FC = () => {
    const { tasks, addTask, updateTask, deleteTask, projects, addProject, updateProject, deleteProject, clients, addClient } = useStore();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Default to 'all'
    const [activeTab, setActiveTab] = useState<string>('all');

    // Validate activeTab exists (if it's not 'all' and project was deleted externally/unexpectedly)
    useEffect(() => {
        if (activeTab !== 'all' && !projects.find(p => p.id === activeTab)) {
            setActiveTab('all');
        }
    }, [projects, activeTab]);

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        isAlert: false
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        haptic.notification('warning');
        setDeletingId(id);
        setTimeout(() => {
            deleteTask(id);
            setDeletingId(null);
        }, 300); // Wait for animation
    };

    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        status: 'in-progress',
        priority: 'low',
        deadline: '',
        client: ''
    });

    const [activeTool, setActiveTool] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title) {
            // If in 'all' view, use the first project as default for new tasks, or empty string if no projects exist
            const targetProjectId = activeTab === 'all' ? (projects[0]?.id || '') : activeTab;

            if (editingId) {
                // Update existing
                updateTask(editingId, {
                    title: formData.title,
                    description: formData.description || '',
                    status: (formData.status as Status) || 'in-progress',
                    priority: formData.priority || 'low',
                    projectId: formData.projectId, // Allow moving lists
                    deadline: formData.deadline,
                    client: formData.client
                });
            } else {
                // Create new
                addTask({
                    title: formData.title,
                    description: formData.description || '',
                    status: (formData.status as Status) || 'in-progress',
                    priority: formData.priority || 'low',
                    projectId: targetProjectId,
                    deadline: formData.deadline,
                    client: formData.client
                });
            }
            setIsModalOpen(false);
            resetForm();
        }
    };

    const resetForm = () => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setFormData({ title: '', description: '', status: 'in-progress', priority: 'low', deadline: todayStr, client: '' });
        setEditingId(null);
        setActiveTool(null);
        setIsCalendarOpen(false); // Close calendar on form reset
    }



    const togglePriority = () => {
        const cycle: Priority[] = ['low', 'medium', 'high'];
        const currentIdx = cycle.indexOf(formData.priority || 'low');
        const nextIdx = (currentIdx + 1) % cycle.length;
        setFormData(prev => ({ ...prev, priority: cycle[nextIdx] }));
    }

    const toggleTask = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            haptic.impact('light');
            updateTask(id, {
                status: task.status === 'completed' ? 'in-progress' : 'completed'
            });
        }
    };

    const filteredTasks = tasks.filter(t => {
        if (activeTab === 'all') return true;
        return t.projectId === activeTab;
    });

    const toggleTool = (tool: string) => {
        setActiveTool(activeTool === tool ? null : tool);
    };

    const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [editingList, setEditingList] = useState<Project | null>(null);
    const [listStatus, setListStatus] = useState<Status>('in-progress');

    const handleAddList = () => {
        setEditingList(null);
        setNewListName('');
        setListStatus('in-progress');
        setIsNewListModalOpen(true);
    };

    const handleEditList = (project: Project) => {
        setEditingList(project);
        setNewListName(project.title);
        setListStatus(project.status);
        setIsNewListModalOpen(true);
    };

    const handleSaveList = (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            if (editingList) {
                updateProject(editingList.id, {
                    title: newListName.trim(),
                    status: listStatus
                });
            } else {
                addProject({
                    title: newListName.trim(),
                    description: '',
                    status: 'in-progress'
                });
            }
            setIsNewListModalOpen(false);
        }
    };

    const handleDeleteList = (id?: string) => {
        const targetId = id || activeTab;
        if (!targetId || targetId === 'all') return;

        const projectToDelete = projects.find(p => p.id === targetId);
        setConfirmConfig({
            isOpen: true,
            title: t('deleteList'),
            message: `${t('deleteListConfirm')} "${projectToDelete?.title}"? ${t('deleteListMessage')}`,
            onConfirm: () => {
                deleteProject(targetId);
                setActiveTab('all');
            },
            isDestructive: true,
            isAlert: false
        });
    };

    const longPressTimer = React.useRef<any>(null);
    const isLongPress = React.useRef(false);

    const handleTouchStart = (project: Project) => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            haptic.impact('medium');
            handleEditList(project);
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
            <header className={styles.header}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <h1 className={styles.title}>{t('tasks')}</h1>
                    {/* Buttons removed from header */}
                </div>

                <div className={extraStyles.toolbar} style={{ marginTop: 12, padding: 0 }}>
                    {/* Fixed 'All' tab */}
                    <button
                        className={`${styles.filterChip} ${activeTab === 'all' ? styles.activeChip : ''} `}
                        onClick={() => setActiveTab('all')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {t('all')}
                    </button>

                    {/* Project Tabs */}
                    {projects.map(p => (
                        <button
                            key={p.id}
                            className={`${styles.filterChip} ${activeTab === p.id ? styles.activeChip : ''} `}
                            onClick={() => {
                                if (!isLongPress.current) {
                                    setActiveTab(p.id);
                                }
                            }}
                            onTouchStart={() => handleTouchStart(p)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchEnd}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ whiteSpace: 'nowrap', userSelect: 'none' }}
                        >
                            {p.title}
                        </button>
                    ))}
                    <button
                        className={styles.filterChip}
                        onClick={handleAddList}
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--color-text-primary)',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {t('createList')}
                    </button>
                </div>
            </header>

            <div className={styles.taskList}>
                {filteredTasks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>{t('noTasks')}</p>
                        <small>{t('clickToAdd')}</small>
                    </div>
                ) : (
                    filteredTasks.map(task => <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={handleDelete}
                        onEdit={(t) => {
                            setFormData(t);
                            setEditingId(t.id);
                            setIsModalOpen(true);
                        }}
                        isDeleting={deletingId === task.id}
                    />)
                )}
            </div>

            <button className={styles.fab} onClick={() => { resetForm(); setIsModalOpen(true); }}>
                <Plus size={28} />
            </button>

            {/* Task Edit/Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={editingId ? "Редактировать" : "Новая задача"}
            >
                <form onSubmit={handleSubmit}>
                    <div className={formStyles.inputGroup}>
                        <input
                            className={formStyles.input}
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Название задачи"
                            autoFocus={!editingId} // Don't autofocus on edit to avoid jarring jump, or maybe yes? Let's keep it typical mobile behavior, maybe false on edit.
                            required
                        />
                    </div>

                    {/* Toolbar */}
                    <div className={extraStyles.toolbar}>
                        <div className={extraStyles.dateInputWrapper} style={{ position: 'relative' }}>
                            <button type="button"
                                className={extraStyles.toolBtn}
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            >
                                <Calendar size={18} className={extraStyles.toolIcon} />
                                {formData.deadline ? formatDate(formData.deadline) : 'Срок'}
                            </button>

                            {isCalendarOpen && (
                                <CustomCalendar
                                    selectedDate={formData.deadline || null}
                                    onChange={(date) => setFormData({ ...formData, deadline: date })}
                                    onClose={() => setIsCalendarOpen(false)}
                                />
                            )}
                        </div>

                        <button type="button"
                            className={`${extraStyles.toolBtn} ${extraStyles.priorityBtn} ${getIconClass(formData.priority || 'low')} ${formData.priority !== 'low' ? extraStyles.active : ''} `}
                            onClick={togglePriority}
                        >
                            <AlertTriangle size={18} className={extraStyles.toolIcon} />
                        </button>

                        <button type="button"
                            className={extraStyles.toolBtn}
                            onClick={() => toggleTool('status')}
                        >
                            {getStatusIcon((formData.status as Status) || 'in-progress', 18)}
                            {getStatusLabel((formData.status as Status) || 'in-progress')}
                        </button>

                        <button type="button"
                            className={`${extraStyles.toolBtn} ${activeTool === 'client' ? extraStyles.active : ''} `}
                            onClick={() => toggleTool('client')}
                        >
                            {formData.client ? (
                                <div style={{
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: generateAvatarColor(formData.client),
                                    color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginRight: 6, fontWeight: 'bold', flexShrink: 0
                                }}>
                                    {getInitials(formData.client)}
                                </div>
                            ) : (
                                <User size={18} className={extraStyles.toolIcon} />
                            )}
                            {formData.client || 'Клиент'}
                        </button>

                        {projects.length > 0 && (
                            <button type="button"
                                className={`${extraStyles.toolBtn} ${activeTool === 'list' ? extraStyles.active : ''} `}
                                onClick={() => toggleTool('list')}
                            >
                                <List size={18} className={extraStyles.toolIcon} />
                                {projects.find(p => p.id === (formData.projectId || activeTab))?.title || 'Список'}
                            </button>
                        )}
                    </div>

                    {/* Dynamic Details Area */}

                    {activeTool === 'status' && (
                        <div style={{ marginTop: 24 }}>
                            <label className={formStyles.label}>Статус задачи</label>
                            <div className={extraStyles.statusContainer} style={{ marginTop: 8 }}>
                                {['in-progress', 'on-hold', 'completed'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`${styles.filterChip} ${formData.status === s ? styles.activeChip : ''}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            paddingRight: '16px'
                                        }}
                                        onClick={() => {
                                            setFormData({ ...formData, status: s as Status });
                                            setActiveTool(null);
                                        }}
                                    >
                                        {getStatusIcon(s as Status, 16)}
                                        {getStatusLabel(s as Status)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTool === 'client' && (
                        <div style={{ marginTop: 24 }}>
                            <label className={formStyles.label}>Клиент</label>

                            {/* Existing Clients List */}
                            <div className={extraStyles.statusContainer} style={{ marginTop: 8, flexWrap: 'wrap' }}>
                                {clients.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, client: c.name });
                                            setActiveTool(null);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '4px 16px 4px 4px',
                                            borderRadius: 100,
                                            border: formData.client === c.name ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                                            backgroundColor: 'transparent',
                                            color: 'var(--color-text-primary)',
                                            fontSize: 15,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            flexShrink: 0
                                        }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: generateAvatarColor(c.name),
                                            color: 'white', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            fontWeight: 'bold'
                                        }}>
                                            {getInitials(c.name)}
                                        </div>
                                        {c.name}
                                    </button>
                                ))}
                            </div>

                            {/* Add New Client Inline */}
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    className={formStyles.input}
                                    placeholder="Новый клиент..."
                                    id="new-client-input"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const target = e.currentTarget;
                                            const val = target.value.trim();
                                            if (val) {
                                                addClient({ name: val, contact: '' });
                                                setFormData({ ...formData, client: val });
                                                target.value = '';
                                                setActiveTool(null);
                                            }
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        background: 'var(--color-accent)',
                                        color: 'white',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}
                                    onClick={() => {
                                        const input = document.getElementById('new-client-input') as HTMLInputElement;
                                        if (input) {
                                            const val = input.value.trim();
                                            if (val) {
                                                addClient({ name: val, contact: '' });
                                                setFormData({ ...formData, client: val });
                                                input.value = '';
                                                setActiveTool(null);
                                            }
                                        }
                                    }}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTool === 'list' && (
                        <div style={{ marginTop: 24 }}>
                            <label className={formStyles.label}>Список</label>
                            <div className={extraStyles.statusContainer} style={{ marginTop: 8 }}>
                                {projects.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className={styles.filterChip}
                                        style={{
                                            backgroundColor: (formData.projectId === p.id) || (!formData.projectId && activeTab === p.id) ? 'black' : '#f2f2f7',
                                            color: (formData.projectId === p.id) || (!formData.projectId && activeTab === p.id) ? 'white' : 'black',
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

                    <div className={formStyles.inputGroup} style={{ marginTop: 24 }}>
                        <textarea
                            className={formStyles.textarea}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Описание"
                            style={{ minHeight: 80 }}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        Сохранить
                    </button>
                </form>
            </Modal>

            {/* New List Modal */}
            <Modal
                isOpen={isNewListModalOpen}
                onClose={() => setIsNewListModalOpen(false)}
                title={editingList ? 'Редактировать список' : 'Новый список'}
            >
                <form onSubmit={handleSaveList}>
                    <div className={formStyles.inputGroup}>
                        <input
                            className={formStyles.input}
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="Название списка"
                            autoFocus
                            required
                        />
                    </div>

                    {editingList && (
                        <div style={{ marginTop: 20 }}>
                            <label className={formStyles.label} style={{ marginBottom: 10, display: 'block' }}>Статус</label>
                            <div className={extraStyles.statusContainer} style={{ marginTop: 0 }}>
                                {['in-progress', 'on-hold', 'completed'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`${styles.filterChip} ${listStatus === s ? styles.activeChip : ''}`}
                                        style={{ padding: '8px 12px', fontSize: 13 }}
                                        onClick={() => setListStatus(s as Status)}
                                    >
                                        {getStatusLabel(s as Status)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                        <button type="submit" className={formStyles.submitBtn}>
                            {editingList ? 'Сохранить' : 'Создать'}
                        </button>

                        {editingList && (
                            <button
                                type="button"
                                style={{
                                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                                    color: '#FF3B30',
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: 600,
                                    fontSize: '16px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setIsNewListModalOpen(false);
                                    handleDeleteList(editingList.id);
                                }}
                            >
                                Удалить список
                            </button>
                        )}
                    </div>
                </form>
            </Modal>


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
        </div >
    );
};
