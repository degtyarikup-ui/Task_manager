// Beautiful gradient presets
const GRADIENTS = [
    'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',   // Sunset Orange
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',   // Malibu Blue
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',   // Mint Green
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',   // Pink Lemonade
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',   // Lavender Dreams
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',   // Ocean Blue
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',   // Peach Purple
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',   // Soft Violet
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',   // Rose Pink
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',   // Aqua Purple
    'linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)',   // Silver (Cloud)
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',   // Deep Purple
];

// Generate a consistent gradient from a string using predetermined palettes
export const generateAvatarColor = (name: string): string => {
    if (!name) return GRADIENTS[10]; // Default silver

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Ensure positive index
    const index = Math.abs(hash) % GRADIENTS.length;

    return GRADIENTS[index];
};

// Generate initials from name (up to 2 characters)
export const getInitials = (name: string): string => {
    if (!name) return '';
    // Handle email or @username
    const cleanName = name.startsWith('@') ? name.substring(1) : name;

    return cleanName
        .split(/[\s_-]+/) // Split by space, underscore or dash
        .filter(part => part.length > 0)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};
