import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTranslation } from '../i18n/useTranslation';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Plus, Camera } from 'lucide-react';
import styles from './Clients.module.css';
import formStyles from '../components/ui/Form.module.css';
import type { Client } from '../types';
import { generateAvatarColor, getInitials } from '../utils/colors';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { haptic } from '../utils/haptics';

export const Clients: React.FC = () => {
    const navigate = useNavigate();
    const { clients, addClient, updateClient, deleteClient, reorderClients, language, uploadClientAvatar } = useStore();

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        if (result.destination.index === 0) return; // Index 0 is reserved

        const sourceIndex = result.source.index - 1;
        const destIndex = result.destination.index - 1;

        if (sourceIndex < 0 || destIndex < 0) return;

        const newOrder = Array.from(clients);
        const [moved] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(destIndex, 0, moved);

        reorderClients(newOrder);
        haptic.selection();
    };
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        contact: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false,
        isAlert: false
    });

    // Removed local getInitials

    const getClientCountLabel = (count: number) => {
        // ...
        // ... inside map
        {
            clients.map(client => (
                <div
                    key={client.id}
                    className={styles.card}
                    onClick={() => handleEdit(client)}
                >
                    <div className={styles.avatar} style={{ background: generateAvatarColor(client.name), color: 'white' }}>
                        {getInitials(client.name)}
                    </div>
                    <div className={styles.name}>{client.name}</div>
                    {client.contact && <div className={styles.contact}>{client.contact}</div>}
                </div>
            ))
        }
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
        setPreviewUrl(client.avatar_url || null);
        setSelectedFile(null);
        setEditingId(client.id);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setFormData({ name: '', contact: '' });
        setPreviewUrl(null);
        setSelectedFile(null);
        setEditingId(null);
        setIsModalOpen(true);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name) {
            let targetId = editingId;
            if (editingId) {
                updateClient(editingId, {
                    name: formData.name,
                    contact: formData.contact || ''
                });
            } else {
                targetId = await addClient({
                    name: formData.name,
                    contact: formData.contact || ''
                }) || null;
            }

            if (selectedFile && targetId) {
                try {
                    await uploadClientAvatar(targetId, selectedFile);
                } catch (error) {
                    console.error('Failed to upload avatar', error);
                }
            }

            setIsModalOpen(false);
            setFormData({ name: '', contact: '' });
            setSelectedFile(null);
            setPreviewUrl(null);
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
            <header className={styles.header} style={{ marginTop: 4, marginBottom: 24 }}>
                <h1 className={styles.title} style={{ textAlign: 'left', width: '100%', padding: 0 }}>{t('clients')}</h1>
                <p className={styles.subtitle} style={{ textAlign: 'left', width: '100%', padding: 0 }}>{clients.length} {getClientCountLabel(clients.length)}</p>
            </header>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="clients-list" direction="horizontal">
                    {(provided) => (
                        <div
                            className={styles.grid}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            <Draggable draggableId="add-btn" index={0} isDragDisabled={true}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`${styles.card} ${styles.addCard}`}
                                        onClick={handleCreate}
                                        style={provided.draggableProps.style}
                                    >
                                        <div className={`${styles.avatar} ${styles.addAvatar}`}>
                                            <Plus size={32} />
                                        </div>
                                        <div className={styles.name}>{t('addClient')}</div>
                                    </div>
                                )}
                            </Draggable>

                            {clients.map((client, index) => (
                                <Draggable key={client.id} draggableId={client.id} index={index + 1}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={styles.card}
                                            onClick={() => {
                                                if (!snapshot.isDragging) navigate(`/clients/${client.id}`);
                                            }}
                                            style={{
                                                ...provided.draggableProps.style,
                                                transform: snapshot.isDragging ? provided.draggableProps.style?.transform : undefined,
                                                opacity: snapshot.isDragging ? 0.8 : 1,
                                                zIndex: snapshot.isDragging ? 1000 : 1,
                                            }}
                                        >
                                            {client.avatar_url ? (
                                                <img
                                                    src={client.avatar_url}
                                                    alt={client.name}
                                                    className={styles.avatar}
                                                    style={{ objectFit: 'cover', background: 'none' }}
                                                />
                                            ) : (
                                                <div className={styles.avatar} style={{ background: generateAvatarColor(client.name) }}>
                                                    {getInitials(client.name)}
                                                </div>
                                            )}
                                            <div className={styles.name}>{client.name}</div>
                                            {client.contact && <div className={styles.contact}>{client.contact}</div>}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? t('edit') : t('newClientBtn')}
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: 80, height: 80, borderRadius: '50%',
                                background: previewUrl ? 'transparent' : (formData.name ? generateAvatarColor(formData.name) : '#f2f2f7'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                formData.name ? (
                                    <div style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{getInitials(formData.name)}</div>
                                ) : (
                                    <Camera size={32} color="var(--color-text-secondary)" />
                                )
                            )}
                        </div>
                    </div>

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
