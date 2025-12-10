
import { format, isSameYear } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader, Pause, Check, Hash } from 'lucide-react';
import type { Status, Priority } from '../types';
import extraStyles from '../pages/TasksExtra.module.css';

export const formatDate = (dateString: string, locale: any) => {
    const date = new Date(dateString);
    const options: any = { locale: locale || ru };
    if (!isSameYear(date, new Date())) {
        return format(date, 'd MMM yyyy', options);
    }
    return format(date, 'd MMM', options);
};

// Priority Helpers
export const getIconClass = (p: Priority) => {
    switch (p) {
        case 'high': return extraStyles.priorityHigh;
        case 'medium': return extraStyles.priorityMedium;
        case 'low': return extraStyles.priorityLow;
        default: return extraStyles.priorityLow;
    }
};

export const getStatusIcon = (s: Status, size = 14) => {
    switch (s) {
        case 'in-progress': return <Loader size={size} className={extraStyles.toolIcon} />;
        case 'on-hold': return <Pause size={size} className={extraStyles.toolIcon} />;
        case 'completed': return <Check size={size} className={extraStyles.toolIcon} />;
        default: return <Hash size={size} className={extraStyles.toolIcon} />;
    }
};

export const getStatusLabel = (s: Status, t: any) => {
    // Standard statuses
    if (s === 'in-progress') return t('inProgress') || 'В работе';
    if (s === 'on-hold') return t('onHold') || 'Пауза';
    if (s === 'completed') return t('completed') || 'Готово';
    if (s === 'archive') return t('archive') || 'Архив';

    // Custom status or fallback
    return s;
};
