
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { haptic } from '../utils/haptics';
import { playSuccessSound } from '../utils/sound';
import { Modal } from '../components/Modal';
import { Plus } from 'lucide-react';
import type { Status, Project } from '../types';

import styles from './Tasks.module.css';
import formStyles from '../components/ui/Form.module.css';

import { ru, enUS } from 'date-fns/locale';

import { ConfirmModal } from '../components/ConfirmModal'; // Import custom modal
import { Tooltip } from '../components/Tooltip';

import { TaskItem } from '../components/TaskItem';
import { ProjectMembersHeader } from '../components/ProjectMembersHeader';
import { UndoToast } from '../components/UndoToast';
import { ProjectToolbar } from '../components/ProjectToolbar';







export const Tasks: React.FC = () => {
    const { tasks, updateTask, deleteTask, projects, addProject, updateProject, deleteProject, clients, language, isLoading, getUserInfo } = useStore();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const locale = language === 'ru' ? ru : enUS;
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const hasSeenTooltip = localStorage.getItem('hasSeenOnboardingTooltip');
        if (!hasSeenTooltip && tasks.length === 0) {
            // Show after a short delay for effect
            const timer = setTimeout(() => setShowTooltip(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [tasks.length]);

    const handleDismissTooltip = () => {
        setShowTooltip(false);
        localStorage.setItem('hasSeenOnboardingTooltip', 'true');
    };

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



    const toggleTask = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            haptic.impact('light');
            if (task.status !== 'completed') {
                playSuccessSound();
            }
            updateTask(id, {
                status: task.status === 'completed' ? 'in-progress' : 'completed'
            });
        }
    };

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const [now] = useState(Date.now());
    const [pendingDeletes, setPendingDeletes] = useState<Map<string, any>>(new Map());

    const undoDelete = (id: string) => {
        const timer = pendingDeletes.get(id);
        if (timer) clearTimeout(timer);
        setPendingDeletes(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    };

    const handleDelete = (id: string) => {
        // Prevent double delete
        if (pendingDeletes.has(id)) return;

        haptic.impact('medium');

        // Optimistically hide
        const timer = setTimeout(() => {
            deleteTask(id);
            setPendingDeletes(prev => {
                const next = new Map(prev);
                next.delete(id);
                return next;
            });
        }, 5000);

        setPendingDeletes(prev => {
            const next = new Map(prev);
            next.set(id, timer);
            return next;
        });
    };

    const filteredTasks = tasks.filter(t => {
        // 0. Filter pending deletes
        if (pendingDeletes.has(t.id)) return false;

        // 1. Filter by Project Tab
        if (activeTab !== 'all' && t.projectId !== activeTab) return false;

        // 2. Hide completed tasks older than 24h (updatedAt)
        if (t.status === 'completed') {
            const lastUpdate = t.updatedAt || t.createdAt;
            if (now - lastUpdate > ONE_DAY_MS) return false;
        }

        // 3. Hide Premium License System Task
        if (t.title === '⭐️ Premium License') return false;

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



    const handleSubtaskToggle = (taskId: string, subId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            const updatedSubtasks = task.subtasks.map(s =>
                s.id === subId ? { ...s, completed: !s.completed } : s
            );
            updateTask(taskId, { subtasks: updatedSubtasks });
            haptic.impact('light');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.fixedTop}>
                <header className={styles.header}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <h1 className={styles.title} style={{ marginBottom: 0, textAlign: 'left', flex: 1, padding: 0 }}>{t('tasks')}</h1>
                        {activeTab !== 'all' && (() => {
                            const project = projects.find(p => p.id === activeTab);
                            if (project) return <ProjectMembersHeader project={project} t={t as any} />;
                        })()}
                    </div>
                </header>

                <div className={styles.stickyHeader}>
                    <ProjectToolbar
                        projects={projects}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onAddList={handleAddList}
                        onEditList={handleEditList}
                        t={t}
                    />
                </div>
            </div>


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
                        onEdit={(tToEdit) => navigate(`/tasks/${tToEdit.id}`)}
                        isDeleting={false}
                        onSubtaskToggle={handleSubtaskToggle}
                        locale={locale}
                        t={t}
                        owner={getUserInfo ? getUserInfo(task.userId) : undefined}
                        clientAvatar={clients.find(c => c.name === task.client)?.avatar_url}
                    />)
                )}
            </div>



            <button className={styles.fab} onClick={() => {
                navigate('/tasks/new', { state: { projectId: activeTab === 'all' ? undefined : activeTab } });
                if (showTooltip) handleDismissTooltip();
            }}>
                <Plus size={28} />
            </button>

            {showTooltip && (
                <Tooltip
                    message={t('onboardingTooltip') || 'Щелкните здесь, чтобы создать свою первую задачу.'}
                    onDismiss={handleDismissTooltip}
                />
            )}

            {/* Undo Notification Stack */}
            <div style={{
                position: 'fixed',
                bottom: 90, // Above FAB (FAB is usually bottom 24 + size)
                left: 16,
                right: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                zIndex: 2000,
                pointerEvents: 'none' // Allow clicks through transparent areas
            }}>
                {Array.from(pendingDeletes.keys()).map(id => (
                    <UndoToast
                        key={id}
                        onUndo={() => undoDelete(id)}
                        label={t('taskDeleted')}
                        undoLabel={t('undo')}
                        duration={5000}
                    />
                ))}
            </div>

            {/* Task Edit/Create Modal */}


            {/* New List Modal */}
            < Modal
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
            </Modal >


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
