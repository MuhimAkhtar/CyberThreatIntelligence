import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/login/login-page';
import { DashboardPage } from '../pages/dashboard/dashboard-page';
import { AlertsPage } from '../pages/alerts/alerts-page';
import { IocSearchPage } from '../pages/ioc-search/ioc-search-page';
import { ThreatsPage } from '../pages/threats/threats-page';
import { CvesPage } from '../pages/cves/cves-page';
import { InvestigationsPage } from '../pages/investigations/investigations-page';
import { SettingsPage } from '../pages/settings/settings-page';
import { AppLayout } from '../components/layout/app-layout/app-layout';
import { ProtectedRoute } from './protected-route';
import { UserRole } from '../types/auth.types';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Standard operational routes */}
            <Route path="/threats" element={<ThreatsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/ioc" element={<IocSearchPage />} />
            <Route path="/ioc-search" element={<IocSearchPage />} />
            <Route path="/investigations" element={<InvestigationsPage />} />
            <Route path="/cves" element={<CvesPage />} />

            {/* Admin-only route guarded by RBAC */}
            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
