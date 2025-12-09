// Generate a consistent color from a string
export const generateAvatarColor = (name: string): string => {
    if (!name) return 'linear-gradient(135deg, #8E8E93, #636366)';

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
};

// Generate initials from name (up to 2 characters)
export const getInitials = (name: string): string => {
    if (!name) return '';
    return name
        .split(' ')
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};
