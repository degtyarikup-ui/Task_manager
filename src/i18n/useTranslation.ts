import { useStore } from '../context/StoreContext';
import { translations, type TranslationKey } from './translations';

export const useTranslation = () => {
    const { language } = useStore();

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key;
    };

    return { t, language };
};
