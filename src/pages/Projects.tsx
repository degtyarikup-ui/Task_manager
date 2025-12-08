import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProjectCard } from '../components/ProjectCard';
import { Modal } from '../components/Modal';
import type { Project, Status } from '../types';
import styles from './Projects.module.css';
import formStyles from '../components/ui/Form.module.css';

export const Projects: React.FC = () => {
    const { projects, addProject } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Project>>({
        title: '',
        description: '',
        status: 'in-progress',
        cost: 0,
        deadline: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title) {
            addProject({
                title: formData.title,
                description: formData.description || '',
                status: (formData.status as Status) || 'in-progress',
                cost: Number(formData.cost) || 0,
                deadline: formData.deadline,
                clientId: '' // Future
            });
            setIsModalOpen(false);
            setFormData({ title: '', description: '', status: 'in-progress', cost: 0, deadline: '' });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Проекты</h1>
                <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    Новый проект
                </button>
            </header>

            {projects.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Нет проектов. Создайте первый!</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={(p) => console.log('Open project', p.id)}
                        />
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Новый проект"
            >
                <form onSubmit={handleSubmit}>
                    <div className={formStyles.inputGroup}>
                        <label className={formStyles.label}>Название</label>
                        <input
                            name="title"
                            className={formStyles.input}
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Например, Редизайн сайта..."
                            autoFocus
                            required
                        />
                    </div>

                    <div className={formStyles.inputGroup}>
                        <label className={formStyles.label}>Описание</label>
                        <textarea
                            name="description"
                            className={formStyles.textarea}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Краткое описание задачи..."
                        />
                    </div>

                    <div className={formStyles.inputGroup}>
                        <label className={formStyles.label}>Статус</label>
                        <select
                            name="status"
                            className={formStyles.select}
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="in-progress">В работе</option>
                            <option value="on-hold">На паузе</option>
                            <option value="completed">Завершен</option>
                            <option value="awaiting-payment">Ждет оплаты</option>
                            <option value="paid">Оплачен</option>
                        </select>
                    </div>

                    <div className={formStyles.row}>
                        <div className={`${formStyles.inputGroup} ${formStyles.col}`}>
                            <label className={formStyles.label}>Бюджет (₽)</label>
                            <input
                                type="number"
                                name="cost"
                                className={formStyles.input}
                                value={formData.cost}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={`${formStyles.inputGroup} ${formStyles.col}`}>
                            <label className={formStyles.label}>Дедлайн</label>
                            <input
                                type="date"
                                name="deadline"
                                className={formStyles.input}
                                value={formData.deadline}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)}>
                            Отмена
                        </button>
                        <button type="submit" className={styles.btnSubmit}>
                            Создать
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
