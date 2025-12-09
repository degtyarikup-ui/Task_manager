
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { Modal } from '../components/Modal';
import { Check, Plus, Trash2, Calendar, AlertTriangle, Loader, User, Pause, List } from 'lucide-react';
import type { Task, Status, Priority } from '../types';
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
const TaskItem = ({ task, onToggle, onDelete, onEdit, isDeleting }: { task: Task, onToggle: (id: string) => void, onDelete: (id: string) => void, onEdit: (task: Task) => void, isDeleting?: boolean }) => (
    <div className={`${styles.taskCard} ${isDeleting ? styles.deleting : ''}`} onClick={() => onEdit(task)}>
        <button
            className={`${styles.checkbox} ${task.status === 'completed' ? styles.checked : ''} `}
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        >
            {task.status === 'completed' && <Check size={14} color="white" />}
        </button>
        <div className={styles.taskContent}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                {task.priority !== 'low' && (
                    <AlertTriangle
                        size={16}
                        className={getIconClass(task.priority)}
                        style={{ flexShrink: 0, marginTop: 3 }}
                    />
                )}
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

                {/* Priority Badge Removed */}

                {task.client && (
                    <span className={extraStyles.metaBadge}>
                        <User size={10} />
                        {task.client}
                    </span>
                )}
                <span className={extraStyles.metaBadge}>
                    {getStatusIcon(task.status, 10)}
                    {getStatusLabel(task.status)}
                </span>
            </div>
        </div>
        <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
            <Trash2 size={18} />
        </button>
    </div>
);

export const Tasks: React.FC = () => {
    const { tasks, addTask, updateTask, deleteTask, projects, addProject, deleteProject, clients, addClient } = useStore();
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

    const handleAddList = () => {
        setNewListName('');
        setIsNewListModalOpen(true);
    };

    const handleCreateList = (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            addProject({
                title: newListName.trim(),
                description: '',
                status: 'in-progress'
            });
            setIsNewListModalOpen(false);
        }
    };

    const handleDeleteList = () => {
        if (!activeTab || activeTab === 'all') return;



        const projectToDelete = projects.find(p => p.id === activeTab);
        setConfirmConfig({
            isOpen: true,
            title: t('deleteList'),
            message: `${t('deleteListConfirm')} "${projectToDelete?.title}"? ${t('deleteListMessage')}`,
            onConfirm: () => {
                deleteProject(activeTab);
                setActiveTab('all');
            },
            isDestructive: true,
            isAlert: false
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <h1 className={styles.title}>{t('tasks')}</h1>
                    {activeTab !== 'all' && (
                        <button onClick={handleDeleteList} style={{ color: '#FF3B30', opacity: 0.8, position: 'absolute', right: 0 }}>
                            <Trash2 size={20} />
                        </button>
                    )}
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
                            onClick={() => setActiveTab(p.id)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {p.title}
                        </button>
                    ))}
                    <button
                        className={styles.filterChip}
                        onClick={handleAddList}
                        style={{ whiteSpace: 'nowrap' }}
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
                            <User size={18} className={extraStyles.toolIcon} />
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
                                        className={`${styles.filterChip} ${formData.client === c.name ? styles.activeChip : ''}`}
                                        onClick={() => {
                                            setFormData({ ...formData, client: c.name });
                                            setActiveTool(null);
                                        }}
                                    >
                                        <User size={14} style={{ marginRight: 6 }} />
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                                addClient({ name: val, contact: '' });
                                                setFormData({ ...formData, client: val });
                                                e.currentTarget.value = ''; // Clear input
                                                // Don't close tool so they can see it added, or close it? Let's close it for efficiency.
                                                setActiveTool(null);
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <small style={{ color: '#86868b', marginTop: 4, display: 'block' }}>
                                Нажмите Enter чтобы добавить
                            </small>
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
                title="Новый список"
            >
                <form onSubmit={handleCreateList}>
                    <div className={formStyles.inputGroup}>
                        <input
                            className={formStyles.input}
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="Название списка, например 'Работа'"
                            autoFocus
                            required
                        />
                    </div>
                    <button type="submit" className={formStyles.submitBtn} style={{ marginTop: 16 }}>
                        Создать список
                    </button>
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
