import { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import styles from './App.module.css';
import { Tasks } from './pages/Tasks';
import { Clients } from './pages/Clients';
import { BottomNav } from './components/BottomNav';
import { Profile } from './pages/Profile';

function App() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'clients' | 'profile'>('tasks');

  return (
    <StoreProvider>
      <div className={styles.appContainer}>
        <main className={styles.mainContent}>
          {activeTab === 'tasks' && <Tasks />}
          {activeTab === 'clients' && <Clients />}
          {activeTab === 'profile' && <Profile />}
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </StoreProvider>
  );
}

export default App;
