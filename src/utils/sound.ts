// Simple sound utility using Web Audio API

// Cache audio context to comply with browser autoplay policies (resumes on user interaction)
let audioContext: AudioContext | null = null;

export const playSuccessSound = () => {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const ctx = audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Connect
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Settings for a "Ding" / "Chime"
        // E5 (659.25), G#5 (830.61), B5 (987.77) - E Major Chord
        // But let's keep it simple: High C (C6) = 1046.50 Hz for success?
        // Or nicer "ding": 
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        // Adding a slight frequency drop simulating a real bell could be nice, but pure sine is cleaner.

        // Envelope
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01); // Quick attack, low volume (quiet)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); // Decay

        // Play
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);

    } catch (e) {
        console.error('Audio playback failed', e);
    }
};
