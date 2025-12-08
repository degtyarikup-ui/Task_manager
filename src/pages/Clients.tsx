import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus } from 'lucide-react';
import styles from './Clients.module.css';
import formStyles from '../components/ui/Form.module.css';
import type { Client } from '../types';

export const Clients: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient } = useStore(); // Added updateClient
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        contact: ''
    });

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        isAlert: false
    });

    // Generate initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const handleEdit = (client: Client) => {
        setFormData({
            name: client.name,
            contact: client.contact
        });
        setEditingId(client.id);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setFormData({ name: '', contact: '' });
        setEditingId(null);
        setIsModalOpen(true);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name) {
            if (editingId) {
                updateClient(editingId, {
                    name: formData.name,
                    contact: formData.contact || ''
                });
            } else {
                addClient({
                    name: formData.name,
                    contact: formData.contact || ''
                });
            }
            setIsModalOpen(false);
            setFormData({ name: '', contact: '' });
            setEditingId(null);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Удалить клиента?',
            message: `Вы уверены, что хотите удалить клиента "${name}"?`,
            onConfirm: () => {
                deleteClient(id);
                // If we were editing this one, close modal
                if (editingId === id) setIsModalOpen(false);
            },
            isDestructive: true,
            isAlert: false
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Клиенты</h1>
                <p className={styles.subtitle}>{clients.length} {clients.length === 1 ? 'клиент' : 'клиентов'}</p>
            </header>

            <div className={styles.grid}>
                {clients.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Нет клиентов</p>
                        <small>Нажмите +, чтобы добавить</small>
                    </div>
                ) : (
                    clients.map(client => (
                        <div
                            key={client.id}
                            className={styles.card}
                            onClick={() => handleEdit(client)}
                        >
                            <div className={styles.avatar}>
                                {getInitials(client.name)}
                            </div>
                            <div className={styles.name}>{client.name}</div>
                            {client.contact && <div className={styles.contact}>{client.contact}</div>}
                        </div>
                    ))
                )}
            </div>

            <button className={styles.fab} onClick={handleCreate}>
                <Plus size={28} />
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Редактировать" : "Новый клиент"}
            >
                <form onSubmit={handleSubmit}>
                    <div className={formStyles.inputGroup}>
                        <label className={formStyles.label}>Имя / Компания</label>
                        <input
                            className={formStyles.input}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Например: ООО Ромашка"
                            autoFocus
                            required
                        />
                    </div>
                    <div className={formStyles.inputGroup}>
                        <label className={formStyles.label}>Контакты</label>
                        <input
                            className={formStyles.input}
                            value={formData.contact}
                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            placeholder="Телефон, email или telegram"
                        />
                    </div>

                    <button type="submit" className={formStyles.submitBtn}>
                        Сохранить
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            style={{
                                width: '100%',
                                padding: 14,
                                marginTop: 12,
                                background: 'transparent',
                                border: 'none',
                                color: '#FF3B30',
                                fontSize: 16
                            }}
                            onClick={() => handleDelete(editingId, formData.name || '')}
                        >
                            Удалить клиента
                        </button>
                    )}
                </form>
            </Modal>

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
        </div>
    );
};
