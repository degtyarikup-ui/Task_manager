import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { generateAvatarColor, getInitials } from '../utils/colors';
import { Modal } from './Modal';
import { Trash2, Share2 } from 'lucide-react';
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

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const inviteLink = `https://t.me/track_it1_bot?startapp=invite_${project.id}`;
        const shareText = t('shareMessage').replace('{listName}', project.title);
        const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

        const tg = (window as any).Telegram?.WebApp;
        if (tg && tg.openTelegramLink) {
            tg.openTelegramLink(url);
        } else {
            window.open(url, '_blank');
        }
    };

    return (
        <>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
            }}>
                {/* Members Avatars - Only show if more than 1 member */}
                {members.length > 1 && (
                    <div
                        onClick={() => setIsMembersModalOpen(true)}
                        style={{
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
                                        border: '2px solid var(--bg-app)', // Match background for overlap cut-out
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
                        </div>
                    </div>
                )}

                {/* Share Button - Icon Only */}
                <button
                    onClick={handleShare}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        padding: 4,
                        border: 'none',
                        color: 'var(--color-primary)', // Use primary or text color
                        cursor: 'pointer'
                    }}
                >
                    <Share2 size={24} color="var(--color-text-primary)" />
                </button>
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
                                        {/* Translate role: owner/member */}
                                        {t(m.role)}
                                        {m.role === 'owner' ? ' 👑' : ''}
                                        {m.id === userId ? ` (${t('you')})` : ''}
                                    </div>
                                </div>
                            </div>

                            {/* Show delete button if I am owner AND target is NOT me */}
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
