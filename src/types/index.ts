export type Priority = 'low' | 'medium' | 'high';
export type Status = 'in-progress' | 'on-hold' | 'completed' | 'awaiting-payment' | 'paid' | string;

export interface Project {
    id: string;
    title: string;
    description: string;
    status: Status;
    deadline?: string;
    cost?: number;
    clientId?: string;
    createdAt: number;
    members?: {
        id: number;
        name: string;
        avatar?: string;
        role: 'owner' | 'member';
    }[];
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    // description removed
    subtasks: Subtask[];
    projectId?: string; // Optional if task is not in a list
    status: Status;
    priority: Priority;
    deadline?: string;
    client?: string;
    createdAt: number;
    updatedAt?: number;
}

export interface Client {
    id: string;
    name: string;
    contact: string;
}

import type { Language } from '../i18n/translations';

export interface AppState {
    projects: Project[];
    tasks: Task[];
    clients: Client[];
    theme: 'light' | 'dark';
    language: Language;
}
