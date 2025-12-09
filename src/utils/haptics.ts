// Haptic feedback utility for Telegram Web App
const getHaptic = () => (window as any).Telegram?.WebApp?.HapticFeedback;

export const haptic = {
    // Physical impacts (clicks, bumps)
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
        const h = getHaptic();
        if (h && h.impactOccurred) {
            h.impactOccurred(style);
        }
    },
    // Notifications (success, error, warning)
    notification: (type: 'error' | 'success' | 'warning') => {
        const h = getHaptic();
        if (h && h.notificationOccurred) {
            h.notificationOccurred(type);
        }
    },
    // Selection changes (picker wheels, sliders)
    selection: () => {
        const h = getHaptic();
        if (h && h.selectionChanged) {
            h.selectionChanged();
        }
    }
};
