import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppState, Client, Project, Task } from '../types';
import { initTelegramApp, getTelegramTheme, isTelegramWebApp } from '../utils/telegram';

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

    toggleTheme: () => void;
    toggleLanguage: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'crm_data_v1';

const initialState: AppState = {
    projects: [],
    tasks: [],
    clients: [],
    theme: 'light',
    language: 'ru'
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : initialState;

        // If running in Telegram, use Telegram theme
        if (isTelegramWebApp()) {
            const telegramTheme = getTelegramTheme();
            parsed.theme = telegramTheme;
        } else {
            if (!parsed.theme) parsed.theme = 'light';
        }

        if (!parsed.language) parsed.language = 'ru';
        return parsed;
    });

    // Initialize Telegram Web App
    useEffect(() => {
        const isTelegram = initTelegramApp();
        if (isTelegram) {
            console.log('Running as Telegram Mini App');
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', state.theme);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', state.theme === 'dark' ? '#000000' : '#F5F5F7');
        }
    }, [state.theme]);

    const toggleTheme = () => {
        setState(prev => ({
            ...prev,
            theme: prev.theme === 'light' ? 'dark' : 'light'
        }));
    };

    const toggleLanguage = () => {
        setState(prev => ({
            ...prev,
            language: prev.language === 'ru' ? 'en' : 'ru'
        }));
    };

    const addProject = (data: Omit<Project, 'id' | 'createdAt'>) => {
        const newProject: Project = {
            ...data,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now()
        };
        setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
    };

    const updateProject = (id: string, data: Partial<Project>) => {
        setState(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === id ? { ...p, ...data } : p)
        }));
    };

    const deleteProject = (id: string) => {
        setState(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== id),
            tasks: prev.tasks.filter(t => t.projectId !== id)
        }));
    };

    const addTask = (data: Omit<Task, 'id' | 'createdAt'>) => {
        const newTask: Task = {
            ...data,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now()
        };
        setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    };

    const updateTask = (id: string, data: Partial<Task>) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === id ? { ...t, ...data } : t)
        }));
    };

    const deleteTask = (id: string) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== id)
        }));
    };

    const updateClient = (id: string, data: Partial<Client>) => {
        setState(prev => ({
            ...prev,
            clients: prev.clients.map(c => c.id === id ? { ...c, ...data } : c)
        }));
    };

    const addClient = (data: Omit<Client, 'id'>) => {
        const newClient: Client = {
            ...data,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        setState(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
    };

    const deleteClient = (id: string) => {
        setState(prev => ({
            ...prev,
            clients: prev.clients.filter(c => c.id !== id)
        }));
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
            toggleTheme,
            toggleLanguage
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
