import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import './header.css';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [time, setTime] = useState<string>('');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__search">
          <svg className="header__search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input type="text" className="header__search-input" placeholder="Search IOCs, CVEs, or entities..." />
        </div>
      </div>
      
      <div className="header__center"></div>
      
      <div className="header__right">
        <div className="header__clock">
          {time}
        </div>
        
        <div className="header__status">
          <span className="header__status-dot"></span>
          <span className="header__status-text">OPERATIONAL</span>
        </div>
        
        <button className="header__notification-btn">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="header__notification-badge">3</span>
        </button>
        
        <div className="header__divider"></div>
        
        <div className="header__profile">
          <div className="header__avatar-mini">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <svg className="header__profile-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        
        <button className="header__logout-btn" onClick={logout} title="Logout">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="header__bottom-line"></div>
    </header>
  );
};
