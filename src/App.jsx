import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { OrdersView } from './views/OrdersView';
import { BotSettingsView } from './views/BotSettingsView';
import { PromoCodesView } from './views/PromoCodesView';
import { PointsView } from './views/PointsView';
import { AlertsView } from './views/AlertsView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { getSettings } from './services/api';
import { useRealtime } from './hooks/useRealtime';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('admin_token'));
  });
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [storeInfo, setStoreInfo] = useState({
    store_name: 'Mini Shop',
    store_logo: '🛍',
    store_tagline: 'Store Admin',
  });

  // Load store settings on mount
  const loadSettingsData = useCallback(async () => {
    try {
      const data = await getSettings();
      setStoreInfo(data);
    } catch (err) {
      console.warn('Could not fetch settings:', err);
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  // Real-time synchronization for branding
  useRealtime(
    useCallback(
      (event) => {
        if (event.type === 'SETTINGS_UPDATED') {
          setStoreInfo((prev) => ({ ...prev, ...event }));
        }
      },
      []
    )
  );

  const handleLoginSuccess = (loginData) => {
    setIsAuthenticated(true);
    if (loginData.store_name) {
      setStoreInfo((prev) => ({
        ...prev,
        store_name: loginData.store_name,
        store_logo: loginData.store_logo || prev.store_logo,
      }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setIsAuthenticated(false);
  };

  // If not logged in, show Login Screen
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} storeInfo={storeInfo} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        storeInfo={storeInfo}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'dashboard' && (
          <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />
        )}
        {currentTab === 'products' && <ProductsView />}
        {currentTab === 'categories' && <CategoriesView />}
        {currentTab === 'promocodes' && <PromoCodesView />}
        {currentTab === 'points' && <PointsView />}
        {currentTab === 'alerts' && <AlertsView />}
        {currentTab === 'orders' && <OrdersView />}
        {currentTab === 'bot' && <BotSettingsView />}
        {currentTab === 'settings' && (
          <SettingsView
            onSettingsUpdated={(newSettings) => setStoreInfo(newSettings)}
          />
        )}
      </main>
    </div>
  );
}
