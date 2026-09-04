import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CategoriesView } from './views/CategoriesView';
import { OrdersView } from './views/OrdersView';
import { BotSettingsView } from './views/BotSettingsView';
import { PromoCodesView } from './views/PromoCodesView';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'dashboard' && (
          <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />
        )}
        {currentTab === 'products' && <ProductsView />}
        {currentTab === 'categories' && <CategoriesView />}
        {currentTab === 'promocodes' && <PromoCodesView />}
        {currentTab === 'orders' && <OrdersView />}
        {currentTab === 'bot' && <BotSettingsView />}
      </main>
    </div>
  );
}
