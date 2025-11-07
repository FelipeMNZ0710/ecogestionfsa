import React from 'react';
import Header from './Header';
import Footer from './Footer';
import NotificationToaster from './NotificationToaster';
import ChatAssistantWidget from './ChatAssistantWidget';
import type { Page, User, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  notifications: Notification[];
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage, user, setUser, notifications }) => {
  return (
    <div className="bg-background min-h-screen flex flex-col antialiased text-text-main">
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        user={user} 
        setUser={setUser}
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