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
                justifyContent: 'center',
                gap: 16,
                paddingBottom: 16,
                marginTop: -8 // Pull up slightly towards title
            }}>
                {/* Members Pill */}
                <div
                    onClick={() => setIsMembersModalOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-card)',
                        padding: '6px 12px',
                        borderRadius: 20,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
                        {members.slice(0, 3).map((m, i) => (
                            <div
                                key={m.id}
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    border: '2px solid var(--bg-card)',
                                    marginLeft: i > 0 ? -8 : 0,
                                    overflow: 'hidden',
                                    backgroundColor: generateAvatarColor(m.name, m.id),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: 9,
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
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                        {members.length > 3 ? `+${members.length - 3}` : t('members')}
                    </span>
                </div>

                {/* Share Button Pill */}
                <button
                    onClick={handleShare}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'var(--bg-card)',
                        padding: '6px 16px',
                        borderRadius: 20,
                        border: 'none',
                        color: 'var(--color-accent)', // Use accent color for action visibility
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <Share2 size={16} />
                    {t('share')}
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
