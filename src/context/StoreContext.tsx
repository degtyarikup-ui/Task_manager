import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppState, Client, Project, Task, Status, Priority } from '../types';
import type { Language } from '../i18n/translations';
import { initTelegramApp, getTelegramTheme, isTelegramWebApp, getTelegramUser } from '../utils/telegram';
import { supabase, type DatabaseTask, type DatabaseProject, type DatabaseClient } from '../lib/supabase';

interface StoreContextType extends AppState {
    addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
    updateProject: (id: string, data: Partial<Project>) => void;
    deleteProject: (id: string) => void;

    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
    updateTask: (id: string, data: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    addClient: (client: Omit<Client, 'id'>) => void;
    updateClient: (id: string, client: Partial<Client>) => void;
    deleteClient: (id: string) => void;
    reorderClients: (clients: Client[]) => void;

    availableStatuses: string[];
    addCustomStatus: (status: string) => void;
    deleteCustomStatus: (status: string) => void;

    toggleTheme: () => void;
    toggleLanguage: () => void;
    isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);



// Helper to determine initial language
const getInitialLanguage = (): Language => {
    // 1. Saved choice
    const saved = localStorage.getItem('user_language') as Language;
    if (saved && (saved === 'ru' || saved === 'en')) return saved;

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
    language: getInitialLanguage()
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<number>(0);

    // Statuses
    const defaultStatuses = ['in-progress', 'on-hold', 'completed'];
    const [customStatuses, setCustomStatuses] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('custom_statuses');
        if (saved) {
            try { setCustomStatuses(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const availableStatuses = [...defaultStatuses, ...customStatuses];

    const addCustomStatus = (s: string) => {
        if (!s) return;
        if (!availableStatuses.includes(s)) {
            const updated = [...customStatuses, s];
            setCustomStatuses(updated);
            localStorage.setItem('custom_statuses', JSON.stringify(updated));
        }
    };

    const deleteCustomStatus = (s: string) => {
        const updated = customStatuses.filter(st => st !== s);
        setCustomStatuses(updated);
        localStorage.setItem('custom_statuses', JSON.stringify(updated));
    };

    // 1. Initialize Telegram & Auth
    useEffect(() => {
        initTelegramApp();
        const tgUser = getTelegramUser();
        // Use Telegram ID or fallback to a demo ID (e.g., 1 for dev)
        // In production, you might want to force Telegram auth
        const uid = tgUser?.id || 1;
        setUserId(uid);

        // Load Theme
        const savedTheme = localStorage.getItem('user_theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setState(prev => ({ ...prev, theme: savedTheme }));
        } else if (isTelegramWebApp()) {
            setState(prev => ({ ...prev, theme: getTelegramTheme() }));
        }
    }, []);

    // 2. Load Data from Supabase
    useEffect(() => {
        if (!userId) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch Projects
                const { data: projectsData, error: projError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', userId);

                if (projError) console.error('Error fetching projects:', projError);

                // Fetch Clients
                const { data: clientsData, error: clientError } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('user_id', userId);

                if (clientError) console.error('Error fetching clients:', clientError);

                // Fetch Tasks
                const { data: tasksData, error: taskError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userId);

                if (taskError) console.error('Error fetching tasks:', taskError);

                // Map DB types to App types
                const projects: Project[] = (projectsData || []).map((p: DatabaseProject) => ({
                    id: p.id,
                    title: p.title,
                    description: p.description || '',
                    status: p.status as Status,
                    createdAt: new Date(p.created_at).getTime()
                }));

                const clients: Client[] = (clientsData || []).map((c: DatabaseClient) => ({
                    id: c.id,
                    name: c.name,
                    contact: c.contact || ''
                }));

                const tasks: Task[] = (tasksData || []).map((t: DatabaseTask) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || '',
                    status: t.status as Status,
                    priority: t.priority as Priority,
                    deadline: t.deadline || '',
                    client: t.client || '',
                    projectId: t.project_id || undefined,
                    createdAt: new Date(t.created_at).getTime(),
                    updatedAt: (t as any).updated_at ? new Date((t as any).updated_at).getTime() : undefined
                }));

                setState(prev => ({
                    ...prev,
                    projects,
                    clients,
                    tasks
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
            localStorage.setItem('user_theme', newTheme);
            return {
                ...prev,
                theme: newTheme
            };
        });
    };

    const toggleLanguage = () => {
        setState(prev => {
            const newLang = prev.language === 'ru' ? 'en' : 'ru';
            localStorage.setItem('user_language', newLang);
            return {
                ...prev,
                language: newLang
            };
        });
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
                description: data.description,
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
        if (data.description !== undefined) updateData.description = data.description;
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

    return (
        <StoreContext.Provider value={{
            ...state,
            addProject,
            updateProject,
            deleteProject,
            addTask,
            updateTask,
            deleteTask,
            addClient,
            updateClient,
            deleteClient,
            reorderClients,
            availableStatuses,
            addCustomStatus,
            deleteCustomStatus,
            toggleTheme,
            toggleLanguage,
            isLoading
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
