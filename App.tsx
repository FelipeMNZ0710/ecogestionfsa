import React, { useState, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ComoReciclarPage from './pages/ComoReciclarPage';
import PuntosVerdesPage from './pages/PuntosVerdesPage';
import JuegosPage from './pages/JuegosPage';
import NoticiasPage from './pages/NoticiasPage';
import ComunidadPage from './pages/ComunidadPage';
import ContactoPage from './pages/ContactoPage';
import PerfilPage from './pages/PerfilPage';
import AdminPage from './pages/AdminPage';
import PoliticaPrivacidadPage from './pages/PoliticaPrivacidadPage';
import TerminosUsoPage from './pages/TerminosUsoPage';
import PoliticaCookiesPage from './pages/PoliticaCookiesPage';
import SobreNosotrosPage from './pages/SobreNosotrosPage';
import type { Page, User, Notification, GamificationAction } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('ecoUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('ecoUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('ecoUser');
      }
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
  }, [user]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const newNotification = { ...notification, id: Date.now() + Math.random() };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const handleUserAction = useCallback(async (action: GamificationAction, payload?: any) => {
    if (!user || user.role === 'dueño') return;

    // Daily login check remains on client to prevent unnecessary API calls
    if (action === 'daily_login') {
        const today = new Date().toISOString().split('T')[0];
        if (user.lastLogin === today) return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/user-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, action, payload })
        });
        if (!response.ok) throw new Error('Server error during user action.');
        
        const result: { updatedUser: User; notifications: Omit<Notification, 'id'>[] } = await response.json();
        
        setUser(result.updatedUser);
        result.notifications.forEach(addNotification);

    } catch (error) {
        console.error("Error processing user action:", error);
        addNotification({
            type: 'achievement',
            title: 'Error de Sincronización',
            message: 'No se pudo guardar tu progreso. Revisa tu conexión.',
            icon: '⚠️'
        });
    }
  }, [user, addNotification]);
  
  const handleLogin = (newUser: User | null) => {
    if (!newUser) {
      setUser(null);
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (newUser.lastLogin !== today && newUser.role !== 'dueño') {
        handleUserAction('daily_login');
        // The user object will be updated by the response from handleUserAction
    } else {
        setUser(newUser);
    }
  };

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const renderPage = () => {
    const isAdminMode = user?.role === 'dueño' || user?.role === 'moderador';
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} user={user} isAdminMode={isAdminMode} />;
      case 'como-reciclar':
        return <ComoReciclarPage user={user} onUserAction={handleUserAction} isAdminMode={isAdminMode} />;
      case 'puntos-verdes':
        return <PuntosVerdesPage user={user} updateUser={updateUser} onUserAction={handleUserAction} isAdminMode={isAdminMode} />;
      case 'juegos':
        return <JuegosPage user={user} onUserAction={handleUserAction} isAdminMode={isAdminMode} />;
      case 'noticias':
        return <NoticiasPage user={user} isAdminMode={isAdminMode} />;
      case 'comunidad':
        return <ComunidadPage user={user} onUserAction={handleUserAction} />;
      case 'contacto':
        return <ContactoPage />;
      case 'perfil':
        return <PerfilPage user={user} updateUser={updateUser} setCurrentPage={setCurrentPage} />;
      case 'admin':
        return isAdminMode ? <AdminPage user={user} updateUser={updateUser} /> : <HomePage setCurrentPage={setCurrentPage} user={user} isAdminMode={isAdminMode} />;
      case 'politica-privacidad':
        return <PoliticaPrivacidadPage />;
      case 'terminos-uso':
        return <TerminosUsoPage />;
      case 'politica-cookies':
        return <PoliticaCookiesPage />;
      case 'sobre-nosotros':
        return <SobreNosotrosPage />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} user={user} isAdminMode={isAdminMode} />;
    }
  };

  return (
    <div>
        <Layout 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          user={user}
          setUser={handleLogin}
          notifications={notifications}
        >
          {renderPage()}
        </Layout>
    </div>
  );
};

export default App;