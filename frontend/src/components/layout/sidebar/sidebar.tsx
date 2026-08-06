import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import { UserRole } from '../../../types/auth.types';
import './sidebar.css';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuthStore();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo-container">
          <svg className="sidebar__logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22S4 16.5 4 11V5l8-3 8 3v6c0 5.5-8 11-8 11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {!isCollapsed && <span className="sidebar__brand">CTP</span>}
      </div>

      <div className="sidebar__separator"></div>

      <nav className="sidebar__nav">
        <ul className="sidebar__menu">
          <li className="sidebar__menu-item">
            <NavLink to="/dashboard" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Dashboard">
              <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h7v7H3V3zM14 3h7v7h-7V3zM14 14h7v7h-7v-7zM3 14h7v7H3v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!isCollapsed && <span className="sidebar__label">Dashboard</span>}
            </NavLink>
          </li>
          <li className="sidebar__menu-item">
            <NavLink to="/threats" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Threats">
              <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!isCollapsed && <span className="sidebar__label">Threats</span>}
            </NavLink>
          </li>
          <li className="sidebar__menu-item">
            <NavLink to="/alerts" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Alerts">
              <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!isCollapsed && <span className="sidebar__label">Alerts</span>}
            </NavLink>
          </li>
          <li className="sidebar__menu-item">
            <NavLink to="/ioc" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="IOC Search">
              <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21l-4.35-4.35M11 7v8M7 11h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!isCollapsed && <span className="sidebar__label">IOC Search</span>}
            </NavLink>
          </li>
          <li className="sidebar__menu-item">
            <NavLink to="/investigations" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Investigations">
              <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zM9 14l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!isCollapsed && <span className="sidebar__label">Investigations</span>}
            </NavLink>
          </li>
          <li className="sidebar__menu-item">
            <NavLink to="/cves" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="CVEs">
              <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!isCollapsed && <span className="sidebar__label">CVEs</span>}
            </NavLink>
          </li>
          {user?.role === UserRole.ADMIN && (
            <li className="sidebar__menu-item">
              <NavLink to="/settings" className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Settings">
                <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {!isCollapsed && <span className="sidebar__label">Settings</span>}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__toggle" onClick={toggleSidebar}>
          <svg className={`sidebar__toggle-icon ${isCollapsed ? 'sidebar__toggle-icon--collapsed' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.firstName?.charAt(0) || 'U'}
            <span className="sidebar__status-dot"></span>
          </div>
          {!isCollapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user ? `${user.firstName} ${user.lastName}` : 'Operator'}</span>
              <span className="sidebar__user-role">{user?.role || 'SYSTEM_ADMIN'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
