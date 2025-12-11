// Telegram Web App TypeScript definitions
declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                ready: () => void;
                expand: () => void;
                close: () => void;
                MainButton: {
                    show: () => void;
                    hide: () => void;
                    setText: (text: string) => void;
                    onClick: (callback: () => void) => void;
                    offClick: (callback: () => void) => void;
                    showProgress: () => void;
                    hideProgress: () => void;
                    enable: () => void;
                    disable: () => void;
                };
                BackButton: {
                    show: () => void;
                    hide: () => void;
                    onClick: (callback: () => void) => void;
                    offClick: (callback: () => void) => void;
                };
                themeParams: {
                    bg_color?: string;
                    text_color?: string;
                    hint_color?: string;
                    link_color?: string;
                    button_color?: string;
                    button_text_color?: string;
                };
                initData: string;
                initDataUnsafe: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                        language_code?: string;
                        photo_url?: string;
                    };
                };
                colorScheme: 'light' | 'dark';
                isExpanded: boolean;
                viewportHeight: number;
                viewportStableHeight: number;
            };
        };
    }
}

export const tg = window.Telegram?.WebApp;

// Initialize Telegram Web App
export const initTelegramApp = () => {
    if (!tg) {
        console.warn('Telegram WebApp not available. Running in standalone mode.');
        return false;
    }

    // Notify Telegram that the app is ready
    tg.ready();

    // Expand to full height
    tg.expand();

    return true;
};

// Check if running inside Telegram
export const isTelegramWebApp = (): boolean => {
    return !!window.Telegram?.WebApp;
};

// Get user data from Telegram
export const getTelegramUser = () => {
    return tg?.initDataUnsafe?.user;
};

// Get Telegram theme
export const getTelegramTheme = (): 'light' | 'dark' => {
    return tg?.colorScheme || 'light';
};

// Get Telegram theme colors
export const getTelegramColors = () => {
    return tg?.themeParams || {};
};

export default tg;
