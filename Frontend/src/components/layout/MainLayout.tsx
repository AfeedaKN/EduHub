import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export interface MainLayoutProps {
  children: ReactNode;
  onRefreshHealth?: () => void;
  isRefreshing?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  onRefreshHealth,
  isRefreshing,
}) => {
  return (
    <div className="app-layout">
      <Header onRefreshHealth={onRefreshHealth} isRefreshing={isRefreshing} />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};
