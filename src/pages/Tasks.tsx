
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { generateAvatarColor, getInitials } from '../utils/colors';
import { haptic } from '../utils/haptics';
import { Modal } from '../components/Modal';
import { Plus, Calendar, AlertTriangle, User, List } from 'lucide-react';
import type { Task, Status, Priority, Project } from '../types';
import styles from './Tasks.module.css';
import extraStyles from './TasksExtra.module.css';
import formStyles from '../components/ui/Form.module.css';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Calendar as CustomCalendar } from '../components/Calendar'; // Alias to avoid conflict if any

import { ConfirmModal } from '../components/ConfirmModal'; // Import custom modal
import { TaskItem } from '../components/TaskItem';
import { formatDate, getStatusIcon, getStatusLabel, getIconClass } from '../utils/taskHelpers';

// ... logic ...





export const Tasks: React.FC = () => {
    const { tasks, addTask, updateTask, deleteTask, projects, addProject, updateProject, deleteProject, clients, addClient, availableStatuses, addCustomStatus, deleteCustomStatus, language, isLoading } = useStore();
    const { t } = useTranslation();

    const locale = language === 'ru' ? ru : enUS;
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
        // 1. Filter by Project Tab
        if (activeTab !== 'all' && t.projectId !== activeTab) return false;

        // 2. Hide completed tasks older than 24h (updatedAt)
        if (t.status === 'completed') {
            const lastUpdate = t.updatedAt || t.createdAt;
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;
            if (Date.now() - lastUpdate > ONE_DAY_MS) return false;
        }

        return true;
    }).sort((a, b) => {
        // 1. Completed to bottom
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;

        // 2. Sort by date (asc)
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if (a.deadline && !b.deadline) return -1; // With deadline first
        if (!a.deadline && b.deadline) return 1;

        return 0;
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
                {isLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={styles.skeletonItem}>
                                <div className={styles.skeletonRow}>
                                    <div className={styles.skeletonCircle} />
                                    <div className={styles.skeletonLine} style={{ width: '60%' }} />
                                </div>
                                <div className={styles.skeletonRow} style={{ marginTop: 8, paddingLeft: 36 }}>
                                    <div className={styles.skeletonLine} style={{ width: '30%' }} />
                                    <div className={styles.skeletonLine} style={{ width: '20%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTasks.length === 0 ? (
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
                        onEdit={(tToEdit) => {
                            setEditingId(tToEdit.id);
                            setFormData({
                                title: tToEdit.title,
                                description: tToEdit.description || '',
                                status: tToEdit.status,
                                priority: tToEdit.priority,
                                projectId: tToEdit.projectId,
                                deadline: tToEdit.deadline,
                                client: tToEdit.client
                            });
                            setIsModalOpen(true);
                        }}
                        isDeleting={deletingId === task.id}
                        locale={locale}
                        t={t}
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
                title={editingId ? t('editTask') : t('newTask')}
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
                            {formData.client || t('client')}
                        </button>

                        {projects.length > 0 && (
                            <button type="button"
                                className={`${extraStyles.toolBtn} ${activeTool === 'list' ? extraStyles.active : ''} `}
                                onClick={() => toggleTool('list')}
                            >
                                <List size={18} className={extraStyles.toolIcon} />
                                {projects.find(p => p.id === (formData.projectId || activeTab))?.title || t('list')}
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
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (!['in-progress', 'on-hold', 'completed'].includes(s)) {
                                                // Simple confirm for now, or use custom modal
                                                if (window.confirm(`${t('deleteStatusConfirm')} "${s}"?`)) {
                                                    deleteCustomStatus(s);
                                                    if (formData.status === s) setFormData({ ...formData, status: 'in-progress' });
                                                }
                                            }
                                        }}
                                    >
                                        {getStatusIcon(s as Status, 16)}
                                        {getStatusLabel(s as Status, t)}
                                    </button>
                                ))}
                            </div>

                            {/* Add New Status */}
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    className={formStyles.input}
                                    placeholder={t('newStatus') + "..."}
                                    id="new-status-input"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                                addCustomStatus(val);
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    style={{
                                        width: '44px', borderRadius: '12px', background: 'var(--color-accent)',
                                        color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}
                                    onClick={() => {
                                        const input = document.getElementById('new-status-input') as HTMLInputElement;
                                        if (input && input.value.trim()) {
                                            addCustomStatus(input.value.trim());
                                            input.value = '';
                                        }
                                    }}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTool === 'client' && (
                        <div style={{ marginTop: 24 }}>
                            <label className={formStyles.label}>{t('client')}</label>

                            {clients.length > 0 ? (
                                <div style={{ marginBottom: 16 }}>
                                    <div className={extraStyles.statusContainer} style={{ marginTop: 8, flexWrap: 'wrap' }}>
                                        {clients.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                className={`${extraStyles.optionChip} ${formData.client === c.name ? extraStyles.active : ''}`}
                                                onClick={() => {
                                                    const newClient = formData.client === c.name ? '' : c.name;
                                                    setFormData({ ...formData, client: newClient });
                                                    setActiveTool(null);
                                                }}
                                            >
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: generateAvatarColor(c.name),
                                                    color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                    fontWeight: 'bold'
                                                }}>
                                                    {getInitials(c.name)}
                                                </div>
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Add New Client Inline */}
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    className={formStyles.input}
                                    placeholder={t('newClient')}
                                    id="new-client-input-tasks"
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
                                        const input = document.getElementById('new-client-input-tasks') as HTMLInputElement;
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
                            <label className={formStyles.label}>{t('list')}</label>
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

                    <div style={{ marginTop: 24 }}>
                        <textarea
                            className={formStyles.textarea}
                            placeholder={t('description')}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        {t('save')}
                    </button>
                </form>
            </Modal>

            {/* New List Modal */}
            <Modal
                isOpen={isNewListModalOpen}
                onClose={() => setIsNewListModalOpen(false)}
                title={editingList ? t('editList') || 'Редактировать список' : t('newList')}
            >
                <form onSubmit={handleSaveList}>
                    <div className={formStyles.inputGroup}>
                        <input
                            className={formStyles.input}
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder={t('listName') || 'List Name'}
                            autoFocus
                            required
                        />
                    </div>



                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                        <button type="submit" className={formStyles.submitBtn}>
                            {editingList ? t('save') : t('create')}
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
                                {t('deleteList') || 'Delete List'}
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
