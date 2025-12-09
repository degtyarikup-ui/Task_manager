// Generate a consistent gradient from a string
export const generateAvatarColor = (name: string): string => {
    if (!name) return 'linear-gradient(135deg, #8E8E93, #636366)';

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 40) % 360; // Shift hue for gradient effect

    // Increased saturation and lightness for vibrant iOS-like look
    return `linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 50%))`;
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
