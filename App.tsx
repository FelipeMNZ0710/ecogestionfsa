
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
import CanjearPage from './pages/CanjearPage';
import NotificacionesPage from './pages/NotificacionesPage';
import PoliticaPrivacidadPage from './pages/PoliticaPrivacidadPage';
import TerminosUsoPage from './pages/TerminosUsoPage';
import PoliticaCookiesPage from './pages/PoliticaCookiesPage';
import SobreNosotrosPage from './pages/SobreNosotrosPage';
import type { Page, User, Notification, GamificationAction } from './types';

const App: React.FC = () => {
  const [currentPage, _setCurrentPage] = useState<Page>('home');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUserStr = localStorage.getItem('ecoUser');
      if (!savedUserStr) return null;
      
      const savedUser = JSON.parse(savedUserStr);
      
      // FIX: Migrate legacy snake_case properties to camelCase for frontend compatibility immediately on load
      if (savedUser) {
         if (savedUser.profile_picture_url && !savedUser.profilePictureUrl) {
             savedUser.profilePictureUrl = savedUser.profile_picture_url;
         }
         if (savedUser.banner_url && !savedUser.bannerUrl) {
             savedUser.bannerUrl = savedUser.banner_url;
         }
      }
      return savedUser;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const setCurrentPage = (page: Page, params?: { userId?: string }) => {
    if (page === 'perfil' && params?.userId) {
      setViewingProfileId(params.userId);
    } else {
      setViewingProfileId(null);
    }
    _setCurrentPage(page);
    window.scrollTo(0,0);
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/unread-count/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.totalUnread);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // NEW: Refresh user data in background on mount to ensure consistency (image, points, etc.)
  useEffect(() => {
      const refreshUser = async () => {
          if (user?.id) {
              try {
                  const response = await fetch(`http://localhost:3001/api/users/profile/${user.id}`);
                  if (response.ok) {
                      const freshData = await response.json();
                      setUser(prev => {
                          // Only update if data changed to avoid unnecessary re-renders
                          if (JSON.stringify(prev) !== JSON.stringify(freshData)) {
                              return freshData;
                          }
                          return prev;
                      });
                  }
              } catch (e) {
                  console.error("Background user refresh failed", e);
              }
          }
      };
      refreshUser();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


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
    if (!user) return; 

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
    setUser(newUser); // Set user immediately
    if (!newUser) {
      setUnreadCount(0);
      return;
    }
    
    // Defer side-effects until after state update
    setTimeout(() => {
      fetchUnreadCount(); // Fetch unread count for the new user
      const today = new Date().toISOString().split('T')[0];
      if (newUser.lastLogin !== today) {
          handleUserAction('daily_login');
      }
    }, 0);
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
        return <ComunidadPage user={user} onUserAction={handleUserAction} onNewMessage={fetchUnreadCount} onViewProfile={(userId) => setCurrentPage('perfil', { userId })} />;
      case 'contacto':
        return <ContactoPage />;
      case 'perfil':
        return <PerfilPage user={user} updateUser={updateUser} setCurrentPage={setCurrentPage} viewingProfileId={viewingProfileId} />;
      case 'admin':
        return isAdminMode ? <AdminPage user={user} updateUser={updateUser} /> : <HomePage setCurrentPage={setCurrentPage} user={user} isAdminMode={isAdminMode} />;
      case 'canjear':
        return <CanjearPage user={user} onUserUpdate={updateUser} addNotification={addNotification} isAdminMode={isAdminMode} />;
      case 'notificaciones':
        return <NotificacionesPage user={user} setCurrentPage={setCurrentPage} onNotificationsViewed={fetchUnreadCount} />;
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
          unreadCount={unreadCount}
        >
          {renderPage()}
        </Layout>
    </div>
  );
};

export default App;
