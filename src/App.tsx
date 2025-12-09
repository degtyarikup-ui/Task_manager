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
    const tg = window.Telegram?.WebApp;
    if (tg) {
      // Set header color to match app background
      const color = theme === 'dark' ? '#000000' : '#F5F5F7';

      // We set the header color. If it's light, Telegram automatically makes status bar icons dark.
      tg.setHeaderColor(color);
      tg.setBackgroundColor(color);

      // Expand to full height if needed, though viewport meta handles it mostly
      tg.expand();
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
