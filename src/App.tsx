import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import styles from './App.module.css';
import { Tasks } from './pages/Tasks';
import { Clients } from './pages/Clients';
import { BottomNav } from './components/BottomNav';
import { Profile } from './pages/Profile';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'clients' | 'profile'>('tasks');
  const { theme } = useStore();

  useEffect(() => {
    // @ts-ignore
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.expand();
      setTimeout(() => tg.expand(), 100);
      tg.ready();
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Cast to any to avoid TypeScript errors with incomplete definitions
    // @ts-ignore
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      // Set header color to match app background
      const color = theme === 'dark' ? '#000000' : '#F5F5F7';

      // We set the header color. If it's light, Telegram automatically makes status bar icons dark.
      if (tg.setHeaderColor) tg.setHeaderColor(color);
      if (tg.setBackgroundColor) tg.setBackgroundColor(color);

      // Expand to full height if needed, though viewport meta handles it mostly
      if (tg.expand) tg.expand();
    }
  }, [theme]);

  return (
    <div className={styles.appContainer}>
      <main className={styles.mainContent}>
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'clients' && <Clients />}
        {activeTab === 'profile' && <Profile />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
