import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppState, Client, Project, Task, Status, Priority } from '../types';
import type { Language } from '../i18n/translations';
import { initTelegramApp, getTelegramTheme, isTelegramWebApp, getTelegramUser } from '../utils/telegram';
import { supabase, type DatabaseTask, type DatabaseProject, type DatabaseClient } from '../lib/supabase';

interface StoreContextType extends AppState {
    addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
    updateProject: (id: string, data: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    joinProject: (inviteCode: string) => Promise<boolean>;


    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
    updateTask: (id: string, data: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    addClient: (client: Omit<Client, 'id'>) => void;
    updateClient: (id: string, client: Partial<Client>) => void;
    deleteClient: (id: string) => void;
    reorderClients: (clients: Client[]) => void;

    removeMember: (projectId: string, userId: number) => Promise<void>;

    availableStatuses: string[];
    addCustomStatus: (status: string) => void;
    deleteCustomStatus: (status: string) => void;

    toggleTheme: () => void;
    toggleLanguage: () => void;
    isLoading: boolean;
    userId: number;
    deleteAccount: () => Promise<void>;
    getUserInfo: (userId: number) => { name: string; avatar?: string; id: number } | undefined;
    togglePremiumDebug: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);



// Helper to determine initial language
const getInitialLanguage = (): Language => {
    // 1. Saved choice
    try {
        const saved = localStorage.getItem('user_language') as Language;
        if (saved && (saved === 'ru' || saved === 'en')) return saved;
    } catch (e) {
        console.warn('localStorage access failed', e);
    }

    // 2. System detection
    try {
        const tgLang = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
        const navLang = navigator.language;
        const langCode = (tgLang || navLang || 'en').toLowerCase().slice(0, 2);

        if (['ru', 'be', 'uk', 'kk'].includes(langCode)) {
            return 'ru';
        }
    } catch (e) {
        console.error('Language detection failed:', e);
    }
    return 'en';
};

// Initial state for offline/first load
const initialState: AppState = {
    projects: [],
    tasks: [],
    clients: [],
    theme: 'light',
    language: getInitialLanguage(),
    isPremium: false
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<number>(0);
    const profilesCache = React.useRef<Map<number, any>>(new Map());

    // Statuses
    const defaultStatuses = ['in-progress', 'on-hold', 'completed'];
    const [customStatuses, setCustomStatuses] = useState<string[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('custom_statuses');
            if (saved) {
                setCustomStatuses(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load custom statuses', e);
        }
    }, []);

    const availableStatuses = [...defaultStatuses, ...customStatuses];

    const addCustomStatus = (s: string) => {
        if (!s) return;
        if (!availableStatuses.includes(s)) {
            const updated = [...customStatuses, s];
            setCustomStatuses(updated);
            try { localStorage.setItem('custom_statuses', JSON.stringify(updated)); } catch (e) { }
        }
    };

    const deleteCustomStatus = (s: string) => {
        const updated = customStatuses.filter(st => st !== s);
        setCustomStatuses(updated);
        try { localStorage.setItem('custom_statuses', JSON.stringify(updated)); } catch (e) { }
    };

    // 1. Initialize Telegram & Auth
    useEffect(() => {
        initTelegramApp();
        const tgUser = getTelegramUser();
        const uid = tgUser?.id || 1;
        setUserId(uid);

        // Sync Profile
        if (tgUser && uid !== 1) {
            const updates = {
                id: uid,
                username: tgUser.username,
                first_name: tgUser.first_name,
                avatar_url: tgUser.photo_url,
                updated_at: new Date()
            };
            supabase.from('profiles').upsert(updates).then(({ error }) => {
                if (error) console.error('Error syncing profile:', error);
            });
        }

        // Load Language
        let savedLang: Language | null = null;
        try { savedLang = localStorage.getItem('user_language') as Language | null; } catch (e) { }

        if (!savedLang && tgUser?.language_code) {
            const code = tgUser.language_code.toLowerCase();
            if (code === 'ru' || code === 'uk' || code === 'be') {
                savedLang = 'ru';
            } else {
                savedLang = 'en';
            }
        }

        if (savedLang) {
            setState(prev => ({ ...prev, language: savedLang }));
        }

        // Load Theme
        let savedTheme: 'light' | 'dark' | null = null;
        try {
            savedTheme = localStorage.getItem('user_theme') as 'light' | 'dark' | null;
        } catch (e) { }

        if (savedTheme) {
            setState(prev => ({ ...prev, theme: savedTheme }));
        } else if (isTelegramWebApp()) {
            setState(prev => ({ ...prev, theme: getTelegramTheme() }));
        }
    }, []);

    const deleteAccount = async () => {
        if (!userId && userId !== 0) return;

        try {
            // Delete all user data from Supabase
            await supabase.from('tasks').delete().eq('user_id', userId);
            await supabase.from('clients').delete().eq('user_id', userId);
            await supabase.from('project_members').delete().eq('user_id', userId);
            await supabase.from('projects').delete().eq('user_id', userId);
            // Optionally delete profile
            await supabase.from('profiles').delete().eq('id', userId);
        } catch (error) {
            console.error('Error clearing data:', error);
        }

        // Clear local storage
        localStorage.clear();

        // Reset State
        setState(initialState);
        window.location.reload();
    };

    // 2. Load Data from Supabase
    useEffect(() => {
        if (!userId) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Own Projects
                const { data: ownProjects, error: projError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', userId);

                if (projError) console.error('Error fetching projects:', projError);

                // 2. Fetch Shared Projects (where I am a member)
                const { data: memberRows } = await supabase
                    .from('project_members')
                    .select('project_id')
                    .eq('user_id', userId);

                const sharedProjectIds = (memberRows || []).map((r: any) => r.project_id);
                let sharedProjects: any[] = [];

                if (sharedProjectIds.length > 0) {
                    const { data: sharedPrjData } = await supabase
                        .from('projects')
                        .select('*')
                        .in('id', sharedProjectIds);
                    sharedProjects = sharedPrjData || [];
                }

                // Combine projects
                const allProjectsRaw = [...(ownProjects || []), ...sharedProjects];
                const uniqueProjectsMap = new Map();
                allProjectsRaw.forEach(p => uniqueProjectsMap.set(p.id, p));
                const projectsData = Array.from(uniqueProjectsMap.values());
                const allProjectIds = projectsData.map(p => p.id);

                // --- NEW: Fetch Members and Profiles ---
                let projectMembers: any[] = [];
                let profilesMap = new Map();

                if (allProjectIds.length > 0) {
                    const { data: members } = await supabase
                        .from('project_members')
                        .select('project_id, user_id, role')
                        .in('project_id', allProjectIds);
                    // Filter out invalid User 0 members
                    projectMembers = (members || []).filter((m: any) => m.user_id !== 0);

                    const userIds = [...new Set([
                        ...projectMembers.map(m => m.user_id),
                        ...projectsData.map(p => p.user_id) // include owners
                    ])];

                    if (userIds.length > 0) {
                        const { data: profiles } = await supabase
                            .from('profiles')
                            .select('*')
                            .in('id', userIds);
                        (profiles || []).forEach((p: any) => profilesMap.set(p.id, p));
                        profilesCache.current = profilesMap;
                    }
                }
                // ----------------------------------------

                // Fetch Clients
                const { data: clientsData, error: clientError } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('user_id', userId);

                if (clientError) console.error('Error fetching clients:', clientError);

                // Fetch Tasks (Own + In Shared Projects)
                // We fetch tasks that are EITHER created by me OR belong to a project I have access to
                let tasksQuery = supabase
                    .from('tasks')
                    .select('*');

                if (allProjectIds.length > 0) {
                    tasksQuery = tasksQuery.or(`user_id.eq.${userId},project_id.in.(${allProjectIds.join(',')})`);
                } else {
                    tasksQuery = tasksQuery.eq('user_id', userId);
                }

                const { data: tasksData, error: taskError } = await tasksQuery;

                if (taskError) console.error('Error fetching tasks:', taskError);

                // Map DB types to App types
                const projects: Project[] = (projectsData || []).map((p: DatabaseProject) => {
                    // Resolve members
                    const members = projectMembers
                        .filter(m => m.project_id === p.id)
                        .map(m => {
                            // If it's the current user, prefer live Telegram data for consistency with Profile
                            if (m.user_id === userId) {
                                const tgUser = getTelegramUser();
                                if (tgUser) {
                                    return {
                                        id: m.user_id,
                                        name: `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`,
                                        avatar: tgUser.photo_url,
                                        role: (m.user_id === p.user_id ? 'owner' : m.role) as 'member' | 'owner'
                                    };
                                }
                            }

                            const profile = profilesMap.get(m.user_id);
                            return {
                                id: m.user_id,
                                name: profile?.first_name || profile?.username || `User ${m.user_id}`,
                                avatar: profile?.avatar_url,
                                role: (m.user_id === p.user_id ? 'owner' : m.role) as 'member' | 'owner'
                            };
                        });

                    // Add Owner if not in members list (implicitly owner)
                    const ownerProfile = profilesMap.get(p.user_id);
                    const ownerInMembers = members.find(m => m.id === p.user_id);
                    if (!ownerInMembers) {
                        members.unshift({
                            id: p.user_id,
                            name: ownerProfile?.first_name || ownerProfile?.username || `User ${p.user_id}`,
                            avatar: ownerProfile?.avatar_url,
                            role: 'owner'
                        });
                    }

                    return {
                        id: p.id,
                        title: p.title,
                        description: p.description || '',
                        status: p.status as Status,
                        createdAt: new Date(p.created_at).getTime(),
                        members: members
                    };
                });

                const clients: Client[] = (clientsData || []).map((c: DatabaseClient) => ({
                    id: c.id,
                    name: c.name,
                    contact: c.contact || ''
                }));

                const tasks: Task[] = (tasksData || []).map((t: DatabaseTask) => {
                    let subtasks = [];
                    try {
                        if (t.description && t.description.startsWith('[')) {
                            subtasks = JSON.parse(t.description);
                        }
                    } catch (e) { }

                    return {
                        id: t.id,
                        userId: t.user_id,
                        title: t.title,
                        subtasks: subtasks,
                        status: t.status as Status,
                        priority: t.priority as Priority,
                        deadline: t.deadline || '',
                        client: t.client || '',
                        projectId: t.project_id || undefined,
                        createdAt: new Date(t.created_at).getTime(),
                        updatedAt: (t as any).updated_at ? new Date((t as any).updated_at).getTime() : undefined
                    };
                });

                // Check Premium Status
                let isPremium = false;
                const { data: myProfile } = await supabase
                    .from('profiles')
                    .select('subscription_end_date')
                    .eq('id', userId)
                    .single();

                if (myProfile?.subscription_end_date) {
                    isPremium = new Date(myProfile.subscription_end_date) > new Date();
                }

                setState(prev => ({
                    ...prev,
                    projects,
                    clients,
                    tasks,
                    isPremium
                }));

            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [userId]);

    // Apply theme changes to DOM
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', state.theme);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', state.theme === 'dark' ? '#000000' : '#F5F5F7');
        }
    }, [state.theme]);

    const toggleTheme = () => {
        setState(prev => {
            const newTheme = prev.theme === 'light' ? 'dark' : 'light';
            try { localStorage.setItem('user_theme', newTheme); } catch (e) { }
            return {
                ...prev,
                theme: newTheme
            };
        });
    };

    const toggleLanguage = () => {
        setState(prev => {
            const newLang = prev.language === 'ru' ? 'en' : 'ru';
            try { localStorage.setItem('user_language', newLang); } catch (e) { }
            return {
                ...prev,
                language: newLang
            };
        });
    };

    const togglePremiumDebug = async () => {
        const newStatus = !state.isPremium;
        setState(prev => ({ ...prev, isPremium: newStatus }));

        if (userId) {
            // Use upsert to create profile if it doesn't exist
            await supabase.from('profiles').upsert({
                id: userId,
                is_premium: newStatus
            });
        }
    };

    // --- Actions with Supabase Sync ---

    const addProject = async (data: Omit<Project, 'id' | 'createdAt'>) => {
        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const newProject: Project = { ...data, id: tempId, createdAt: Date.now() };
        setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }));

        // DB Insert
        const { data: inserted, error } = await supabase
            .from('projects')
            .insert({
                user_id: userId,
                title: data.title,
                description: data.description,
                status: data.status
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding project:', error);
            // Revert optimistic update handling could be added here
            return;
        }

        // Replace temp ID with real ID
        if (inserted) {
            setState(prev => ({
                ...prev,
                projects: prev.projects.map(p => p.id === tempId ? { ...p, id: inserted.id } : p)
            }));
        }
    };

    const updateProject = async (id: string, data: Partial<Project>) => {
        setState(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === id ? { ...p, ...data } : p)
        }));

        await supabase.from('projects').update({
            title: data.title,
            description: data.description,
            status: data.status
        }).eq('id', id);
    };

    const deleteProject = async (id: string) => {
        setState(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== id),
            tasks: prev.tasks.filter(t => t.projectId !== id)
        }));

        await supabase.from('projects').delete().eq('id', id);
        await supabase.from('projects').delete().eq('id', id);
    };

    const joinProject = async (inviteCode: string): Promise<boolean> => {
        // inviteCode format: "invite_<UUID>"
        if (!inviteCode.startsWith('invite_')) return false;
        const projectId = inviteCode.replace('invite_', '');
        if (!projectId) return false;

        try {
            // Check if already in project or is owner
            const existing = state.projects.find(p => p.id === projectId);
            if (existing) return true; // Already joined

            // Insert into members
            const { error } = await supabase
                .from('project_members')
                .insert({
                    project_id: projectId,
                    user_id: userId,
                    role: 'member'
                });

            if (error) {
                // If unique constraint violation, it means we are already added (maybe data sync lag), so success
                if (error.code === '23505') return true;
                console.error('Join error:', error);
                return false;
            }

            // Reload data to show new project
            // In a better app we would just fetch the single project
            window.location.reload(); // Simple refresh to sync everything
            return true;

        } catch (e) {
            console.error('Join exception', e);
            return false;
        }
    };

    const addTask = async (data: Omit<Task, 'id' | 'createdAt'>) => {
        const tempId = `temp-${Date.now()}`;
        const newTask: Task = { ...data, id: tempId, createdAt: Date.now(), updatedAt: Date.now() };
        setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));

        const { data: inserted, error } = await supabase
            .from('tasks')
            .insert({
                user_id: userId,
                title: data.title,
                description: JSON.stringify(data.subtasks || []),
                status: data.status,
                priority: data.priority,
                deadline: data.deadline,
                client: data.client,
                project_id: data.projectId || null
            })
            .select()
            .single();

        if (error) console.error('Error adding task:', error);

        if (inserted) {
            setState(prev => ({
                ...prev,
                tasks: prev.tasks.map(t => t.id === tempId ? { ...t, id: inserted.id } : t)
            }));
        }
    };

    const updateTask = async (id: string, data: Partial<Task>) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t)
        }));

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.subtasks !== undefined) updateData.description = JSON.stringify(data.subtasks);
        if (data.status !== undefined) updateData.status = data.status;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.deadline !== undefined) updateData.deadline = data.deadline;
        if (data.client !== undefined) updateData.client = data.client;
        if (data.projectId !== undefined) updateData.project_id = data.projectId || null;

        await supabase.from('tasks').update(updateData).eq('id', id);
    };

    const deleteTask = async (id: string) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== id)
        }));

        await supabase.from('tasks').delete().eq('id', id);
    };

    const addClient = async (data: Omit<Client, 'id'>) => {
        const tempId = `temp-${Date.now()}`;
        const newClient: Client = { ...data, id: tempId };
        setState(prev => ({ ...prev, clients: [...prev.clients, newClient] }));

        const { data: inserted, error } = await supabase
            .from('clients')
            .insert({
                user_id: userId,
                name: data.name,
                contact: data.contact
            })
            .select()
            .single();

        if (error) console.error('Error adding client:', error);

        if (inserted) {
            setState(prev => ({
                ...prev,
                clients: prev.clients.map(c => c.id === tempId ? { ...c, id: inserted.id } : c)
            }));
        }
    };

    const updateClient = async (id: string, data: Partial<Client>) => {
        setState(prev => ({
            ...prev,
            clients: prev.clients.map(c => c.id === id ? { ...c, ...data } : c)
        }));

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.contact !== undefined) updateData.contact = data.contact;

        await supabase.from('clients').update(updateData).eq('id', id);
    };

    const deleteClient = async (id: string) => {
        setState(prev => ({
            ...prev,
            clients: prev.clients.filter(c => c.id !== id)
        }));

        await supabase.from('clients').delete().eq('id', id);
    };

    const reorderClients = (newOrder: Client[]) => {
        setState(prev => ({ ...prev, clients: newOrder }));
    };

    const removeMember = async (projectId: string, memberId: number) => {
        // Update local state first to remove member visually
        setState(prev => ({
            ...prev,
            projects: prev.projects.map(p => {
                if (p.id !== projectId) return p;
                return {
                    ...p,
                    members: (p.members || []).filter(m => m.id !== memberId)
                };
            })
        }));

        const { error } = await supabase
            .from('project_members')
            .delete()
            .match({ project_id: projectId, user_id: memberId });

        if (error) {
            console.error('Error removing member:', error);
            // Revert state if needed, but for simplicity assuming success or reload on error
        }
    };

    const getUserInfo = (uid: number) => {
        if (uid === userId) {
            const mys = getTelegramUser();
            if (mys) return { name: mys.first_name, avatar: mys.photo_url, id: uid };
        }
        const p = profilesCache.current.get(uid);
        if (p) return { name: p.first_name || p.username || `User ${uid}`, avatar: p.avatar_url, id: uid };
        return undefined;
    };

    return (
        <StoreContext.Provider value={{
            ...state,
            getUserInfo,
            addProject,
            updateProject,
            deleteProject,
            joinProject,
            addTask,
            updateTask,
            deleteTask,
            addClient,
            updateClient,
            deleteClient,
            reorderClients,
            removeMember,
            availableStatuses,
            addCustomStatus,
            deleteCustomStatus,
            toggleTheme,
            toggleLanguage,
            isLoading,
            userId,
            deleteAccount,
            togglePremiumDebug
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within StoreProvider');
    return context;
};
