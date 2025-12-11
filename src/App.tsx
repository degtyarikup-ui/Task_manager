
import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import styles from './App.module.css';
import { Tasks } from './pages/Tasks';
import { Clients } from './pages/Clients';
import { Profile } from './pages/Profile';
import { ClientDetails } from './pages/ClientDetails';
import { Premium } from './pages/Premium';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';

function TelegramThemeHandler() {
  const { theme, joinProject } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Platform class
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.platform) {
      document.body.classList.add(`platform-${tg.platform}`);
      tg.expand();
    }

    // Header Color
    if (tg) {
      const color = theme === 'dark' ? '#000000' : '#F5F5F7';
      if (tg.setHeaderColor) tg.setHeaderColor(color);
      if (tg.setBackgroundColor) tg.setBackgroundColor(color);
      if (tg.setBottomBarColor) tg.setBottomBarColor(color);
    }

    // Start Param Handling
    const startParam = tg?.initDataUnsafe?.start_param;
    if (startParam) {
      if (startParam.startsWith('invite_')) {
        joinProject(startParam);
      } else if (startParam === 'premium') {
        navigate('/premium');
      }
    }

  }, [theme, joinProject, navigate]);

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
  // Show Nav on main tabs and client details
  const showBottomNav = ['/tasks', '/profile'].includes(location.pathname) || location.pathname.startsWith('/clients') || location.pathname === '/';

  return (
    <div className={styles.appContainer}>
      <div className={styles.topGradient} />
      <main className={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:clientId" element={<ClientDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </main>
      <div className={styles.bottomGradient} />
      {showBottomNav && <BottomNavWrapper />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <Router>
          <TelegramThemeHandler />
          <Layout />
        </Router>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
