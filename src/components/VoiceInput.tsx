import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles } from 'lucide-react';
import { haptic } from '../utils/haptics';
import { parseTaskFromVoice } from '../services/aiService';
import { useStore } from '../context/StoreContext';
import styles from './VoiceInput.module.css';

interface VoiceInputProps {
    onTaskCreated: (task: any) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTaskCreated }) => {
    const { clients } = useStore();
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'ru-RU'; // Default to Russian as per user preference

            recognitionRef.current.onresult = async (event: any) => {
                const transcript = event.results[0][0].transcript;
                await processVoiceCommand(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setError('Ошибка распознавания');
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                if (!isProcessing) setIsListening(false);
            };
        } else {
            console.warn('Browser does not support Speech Recognition');
        }
    }, []);

    const processVoiceCommand = async (text: string) => {
        setIsListening(false);
        setIsProcessing(true);
        setError(null);
        haptic.impact('medium');

        try {
            // Get API Key from Environment Variables (set by developer)
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                console.error('Gemini API Key is missing is environment variables');
                alert('Голосовой ввод не настроен администратором (API Key missing).');
                setIsProcessing(false);
                return;
            }

            const taskData = await parseTaskFromVoice(text, clients, apiKey);
            onTaskCreated(taskData);
            haptic.notification('success');
        } catch (err) {
            console.error(err);
            setError('Ошибка AI обработки');
            haptic.notification('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Ваш браузер не поддерживает голосовой ввод');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setError(null);
            recognitionRef.current.start();
            setIsListening(true);
            haptic.impact('light');
        }
    };

    return (
        <div className={styles.container}>
            {error && <div className={styles.errorTooltip}>{error}</div>}

            <button
                className={`${styles.voiceBtn} ${isListening ? styles.listening : ''} ${isProcessing ? styles.processing : ''}`}
                onClick={toggleListening}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <Loader2 className={styles.spinner} size={24} />
                ) : isListening ? (
                    <Square size={20} fill="currentColor" />
                ) : (
                    <Mic size={24} />
                )}
            </button>

            {isProcessing && (
                <div className={styles.statusLabel}>
                    <Sparkles size={14} />
                    <span>AI думает...</span>
                </div>
            )}
        </div>
    );
};
