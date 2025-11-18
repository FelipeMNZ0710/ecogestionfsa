import React from 'react';
import Header from './Header';
import Footer from './Footer';
import NotificationToaster from './NotificationToaster';
import ChatAssistantWidget from './ChatAssistantWidget';
import type { Page, User, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page, params?: { userId?: string }) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  notifications: Notification[];
  unreadCount: number;
}

const pageColors: Partial<Record<Page, { primary: string; dark: string; rgb: string; bg: string; surface: string; }>> = {
    'home': { primary: '#10B981', dark: '#059669', rgb: '16, 185, 129', bg: '#0d261e', surface: '#173027' }, // Dark Emerald
    'como-reciclar': { primary: '#84CC16', dark: '#65A30D', rgb: '132, 204, 22', bg: '#23260d', surface: '#2b3017' }, // Dark Lime
    'puntos-verdes': { primary: '#3B82F6', dark: '#2563EB', rgb: '59, 130, 246', bg: '#0d1a26', surface: '#172630' }, // Dark Blue
    'juegos': { primary: '#14B8A6', dark: '#0D9488', rgb: '20, 184, 166', bg: '#0d2624', surface: '#17302e' }, // Dark Teal
    'noticias': { primary: '#22C55E', dark: '#16A34A', rgb: '34, 197, 94', bg: '#0d2616', surface: '#173021' }, // Dark Green
    'comunidad': { primary: '#6366F1', dark: '#4F46E5', rgb: '99, 102, 241', bg: '#121226', surface: '#1d1d30' }, // Dark Indigo
    'contacto': { primary: '#F59E0B', dark: '#D97706', rgb: '245, 158, 11', bg: '#261c0d', surface: '#302417' }, // Dark Amber
};

const defaultColors = {
    primary: '#10B981', dark: '#059669', rgb: '16, 185, 129', bg: '#0d261e', surface: '#173027'
};


const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage, user, setUser, notifications, unreadCount }) => {
  const colors = pageColors[currentPage] || defaultColors;

  return (
    <div 
      className="bg-background min-h-screen flex flex-col antialiased text-text-main"
      style={{
        '--page-primary-color': colors.primary,
        '--page-primary-dark-color': colors.dark,
        '--page-primary-rgb': colors.rgb,
        '--page-bg-color': colors.bg,
        '--page-surface-color': colors.surface,
        '--page-bg-color-rgb': colors.bg.replace('#', '').match(/.{1,2}/g)?.map(v => parseInt(v, 16)).join(', '),
        '--page-surface-color-rgb': colors.surface.replace('#', '').match(/.{1,2}/g)?.map(v => parseInt(v, 16)).join(', '),
      } as React.CSSProperties}
    >
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        user={user} 
        setUser={setUser}
        unreadCount={unreadCount}
      />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer setCurrentPage={setCurrentPage} />
      <NotificationToaster notifications={notifications} />
      <ChatAssistantWidget user={user} setCurrentPage={setCurrentPage} />
    </div>
  );
};

export default Layout;