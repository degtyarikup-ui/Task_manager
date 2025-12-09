import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Типы для базы данных
export type DatabaseTask = {
    id: string;
    user_id: number;
    title: string;
    description?: string;
    status: string;
    priority: string;
    deadline?: string;
    project_id?: string;
    client?: string;
    created_at: string;
};

export type DatabaseProject = {
    id: string;
    user_id: number;
    title: string;
    description?: string;
    status: string;
    created_at: string;
};

export type DatabaseClient = {
    id: string;
    user_id: number;
    name: string;
    contact?: string;
    created_at: string;
};
