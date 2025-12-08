import React from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import type { Project } from '../types';
import styles from './ProjectCard.module.css';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ProjectCardProps {
    project: Project;
    onClick: (project: Project) => void;
}

const statusLabels: Record<string, string> = {
    'in-progress': 'В работе',
    'on-hold': 'На паузе',
    'completed': 'Завершен',
    'awaiting-payment': 'Ждет оплаты',
    'paid': 'Оплачен'
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
    return (
        <div className={styles.card} onClick={() => onClick(project)}>
            <div className={styles.header}>
                <h3 className={styles.title}>{project.title}</h3>
                <span className={`${styles.badge} ${styles[`status_${project.status}`]}`}>
                    {statusLabels[project.status] || project.status}
                </span>
            </div>

            {project.description && (
                <p className={styles.description}>{project.description}</p>
            )}

            <div className={styles.meta}>
                {project.deadline && (
                    <div className={styles.metaItem}>
                        <Calendar size={14} />
                        <span>{format(new Date(project.deadline), 'd MMM', { locale: ru })}</span>
                    </div>
                )}

                {project.cost && (
                    <div className={styles.metaItem}>
                        <DollarSign size={14} />
                        <span className={styles.cost}>{project.cost.toLocaleString('ru-RU')} ₽</span>
                    </div>
                )}
            </div>
        </div>
    );
};
