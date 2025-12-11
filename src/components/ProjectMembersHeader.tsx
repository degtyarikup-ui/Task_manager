import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { generateAvatarColor, getInitials } from '../utils/colors';
import { Modal } from './Modal';
import { Trash2 } from 'lucide-react';
import type { Project } from '../types';

interface ProjectMembersHeaderProps {
    project: Project;
    t: (key: string) => string;
}

export const ProjectMembersHeader: React.FC<ProjectMembersHeaderProps> = ({ project, t }) => {
    const { removeMember, userId } = useStore();
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    const members = project.members || [];
    if (members.length === 0) return null;

    // The owner logic is implicit in members, let's find my role
    const myRole = members.find(m => m.id === userId)?.role;
    const canManage = myRole === 'owner';

    return (
        <>
            <div
                onClick={() => setIsMembersModalOpen(true)}
                style={{
                    position: 'absolute',
                    left: 60,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {members.slice(0, 3).map((m, i) => (
                        <div
                            key={m.id}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: '2px solid var(--bg-page)',
                                marginLeft: i > 0 ? -10 : 0,
                                overflow: 'hidden',
                                backgroundColor: generateAvatarColor(m.name, m.id),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 10,
                                fontWeight: 'bold',
                                zIndex: members.length - i
                            }}
                        >
                            {m.avatar ? (
                                <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                getInitials(m.name)
                            )}
                        </div>
                    ))}
                    {members.length > 3 && (
                        <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: '2px solid var(--bg-page)',
                            marginLeft: -10,
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--color-text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 'bold',
                            zIndex: 0
                        }}>
                            +{members.length - 3}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                title={t('members')}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {members.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                                    backgroundColor: generateAvatarColor(m.name, m.id),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 'bold'
                                }}>
                                    {m.avatar ? (
                                        <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        getInitials(m.name)
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{m.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                        {m.role === 'owner' ? t('lists') : m.role}
                                        {m.role === 'owner' ? '👑' : ''}
                                        {m.id === userId ? ` (${t('you') || 'You'})` : ''}
                                    </div>
                                </div>
                            </div>

                            {canManage && m.id !== userId && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(`${t('removeMemberConfirm')} "${m.name}"?`)) {
                                            if (project) removeMember(project.id, m.id);
                                        }
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'rgba(255, 59, 48, 0.1)',
                                        color: 'var(--color-danger)',
                                        padding: 8,
                                        borderRadius: 8,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
};
