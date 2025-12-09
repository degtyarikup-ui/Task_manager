import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus } from 'lucide-react';
import styles from './Clients.module.css';
import formStyles from '../components/ui/Form.module.css';
import type { Client } from '../types';

export const Clients: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient, language } = useStore(); // Added updateClient
    const { t } = useTranslation();
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

    const getClientCountLabel = (count: number) => {
        if (language !== 'ru') {
            return count === 1 ? t('clientsCount') : t('clientsCount2');
        }
        // Russian Pluralization
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        if (lastDigit === 1 && lastTwoDigits !== 11) return t('clientsCount');
        if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) return t('clientsCount2');
        return t('clientsCount5');
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
            title: t('deleteClient'),
            message: `${t('deleteClientConfirm')} "${name}"?`,
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
                <h1 className={styles.title}>{t('clients')}</h1>
                <p className={styles.subtitle}>{clients.length} {getClientCountLabel(clients.length)}</p>
            </header>

            <div className={styles.grid}>
                {/* Add Client Card */}
                <div className={`${styles.card} ${styles.addCard}`} onClick={handleCreate}>
                    <div className={`${styles.avatar} ${styles.addAvatar}`}>
                        <Plus size={32} />
                    </div>
                    <div className={styles.name}>{t('addClient')}</div>
                </div>

                {/* Existing Clients */}
                {clients.map(client => (
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
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? t('edit') : t('newClientBtn')}
            >
                <form onSubmit={handleSubmit}>
                    <div className={formStyles.inputGroup}>
                        <label className={formStyles.label}>{t('clientNameCompany')}</label>
                        <input
                            className={formStyles.input}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('newClient')} // "Например..." заменил на "New client..." или можно добавить ключ "example"
                            autoFocus
                            required
                        />
                    </div>
                    <div className={formStyles.inputGroup}>
                        <label className={formStyles.label}>{t('contacts')}</label>
                        <input
                            className={formStyles.input}
                            value={formData.contact}
                            onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            placeholder={t('contactPlaceholder')}
                        />
                    </div>

                    <button type="submit" className={formStyles.submitBtn}>
                        {t('save')}
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
                            {t('deleteClient')}
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
        </div >
    );
};
