import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qysfycmynplwylnbnskw.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZikJgvMJx7lj9c7OmICtNg_ctMzFDDu';

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
    avatar_url?: string;
    telegram_id?: number;
    notes?: string;
    created_at: string;
};
