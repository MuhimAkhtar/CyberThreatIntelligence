import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import './app-layout.css';

export const AppLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <Header />
        <main className="app-layout__content">
          <div className="app-layout__grid-bg"></div>
          <div className="app-layout__scroll-area">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
