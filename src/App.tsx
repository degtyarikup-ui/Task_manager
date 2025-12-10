import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import styles from './App.module.css';
import { Tasks } from './pages/Tasks';
import { Clients } from './pages/Clients';
import { Profile } from './pages/Profile';
import { ClientDetails } from './pages/ClientDetails';
import { BottomNav } from './components/BottomNav';

function TelegramThemeHandler() {
  const { theme } = useStore();

  useEffect(() => {
    // @ts-ignore
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      if (tg.platform) {
        document.body.classList.add(`platform-${tg.platform}`);
      }
      tg.expand();
      setTimeout(() => tg.expand(), 100);
      tg.ready();
    }
  }, []); // Run once on mount

  useEffect(() => {
    // @ts-ignore
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      const color = theme === 'dark' ? '#000000' : '#F5F5F7';
      if (tg.setHeaderColor) tg.setHeaderColor(color);
      if (tg.setBackgroundColor) tg.setBackgroundColor(color);
      if (tg.expand) tg.expand();
    }
  }, [theme]);

  return null;
}

function BottomNavWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  let activeTab: 'tasks' | 'clients' | 'profile' = 'tasks';
  if (location.pathname.startsWith('/clients')) activeTab = 'clients';
  if (location.pathname.startsWith('/profile')) activeTab = 'profile';

  return <BottomNav activeTab={activeTab} onTabChange={(tab) => navigate('/' + tab)} />;
}

function Layout() {
  const location = useLocation();
  // Show Nav on main pages only
  const showBottomNav = ['/tasks', '/clients', '/profile'].includes(location.pathname) || location.pathname === '/';

  return (
    <div className={styles.appContainer}>
      <main className={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:clientId" element={<ClientDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {showBottomNav && <BottomNavWrapper />}
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <TelegramThemeHandler />
      <Router>
        <Layout />
      </Router>
    </StoreProvider>
  );
}

export default App;
