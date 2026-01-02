import React, { useState } from 'react';
import { Home, Bus, Camera, Search, User, ShoppingBag, Radio, Map, Ticket, MessageCircle, Users } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import haptics from '../services/haptics';
import NotificationBell from './ui/NotificationBell';
import NotificationsDropdown from './NotificationsDropdown';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onUserProfile?: (userId: string) => void;
  variant?: 'bottom' | 'sidebar';
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, onUserProfile, variant = 'bottom' }) => {
  const { isAuthenticated, user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const mainNavItems = [
    { view: ViewState.HOME, icon: Home, label: 'Inicio' },
    { view: ViewState.TRANSPORT, icon: Bus, label: 'BinniBus' },
    { view: ViewState.AR_SCANNER, icon: Camera, label: 'AR' },
    { view: ViewState.SEARCH, icon: Search, label: 'Buscar' },
    { view: ViewState.PROFILE, icon: User, label: 'Perfil' },
  ];

  const extraNavItems = [
    { view: ViewState.TIENDA, icon: ShoppingBag, label: 'Tienda' },
    { view: ViewState.STREAMS, icon: Radio, label: 'En Vivo' },
    { view: ViewState.AR_MAP, icon: Map, label: 'Mapa' },
    { view: ViewState.EXPERIENCES, icon: Ticket, label: 'Tours' },
    { view: ViewState.COMMUNITIES, icon: Users, label: 'Comunidad' },
    { view: ViewState.CHAT, icon: MessageCircle, label: 'GuelaBot' },
  ];

  const handleNavClick = (view: ViewState) => {
    haptics.tap();
    setView(view);
  };

  // Sidebar variant for tablet/desktop
  if (variant === 'sidebar') {
    return (
      <>
        <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-xl font-bold text-oaxaca-pink">Guelaguetza</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Connect 2025</p>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Principal</p>
            {mainNavItems.map((item) => {
              const isActive = currentView === item.view;
              const isProfile = item.view === ViewState.PROFILE;

              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-oaxaca-pink/10 text-oaxaca-pink font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {isProfile && isAuthenticated && user?.faceData ? (
                    <img
                      src={user.faceData}
                      alt="Perfil"
                      className={`w-5 h-5 rounded-full object-cover ${isActive ? 'ring-2 ring-oaxaca-pink' : ''}`}
                    />
                  ) : (
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}

            <div className="my-4 border-t border-gray-100 dark:border-gray-800" />

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Explorar</p>
            {extraNavItems.map((item) => {
              const isActive = currentView === item.view;

              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-oaxaca-pink/10 text-oaxaca-pink font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Info & Notifications */}
          {isAuthenticated && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-oaxaca-pink/20 flex items-center justify-center">
                    {user?.faceData ? (
                      <img src={user.faceData} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User size={20} className="text-oaxaca-pink" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user?.nombre}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <NotificationBell onClick={() => setShowNotifications(true)} />
              </div>
            </div>
          )}
        </aside>

        {/* Notifications Dropdown */}
        <NotificationsDropdown
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onUserProfile={onUserProfile}
        />
      </>
    );
  }

  // Bottom variant for mobile
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe z-50 transition-colors">
        <div className="flex justify-around items-center h-16">
          {mainNavItems.map((item) => {
            const isActive = currentView === item.view;
            const isProfile = item.view === ViewState.PROFILE;

            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                  isActive ? 'text-oaxaca-pink' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {isProfile && isAuthenticated && user?.faceData ? (
                  <div className="relative">
                    <img
                      src={user.faceData}
                      alt="Perfil"
                      className={`w-6 h-6 rounded-full object-cover ${isActive ? 'ring-2 ring-oaxaca-pink' : ''}`}
                    />
                  </div>
                ) : isProfile ? (
                  <div className="relative">
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                ) : (
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                )}
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notification Bell - floating above nav */}
        {isAuthenticated && (
          <div className="absolute -top-10 right-4">
            <NotificationBell onClick={() => setShowNotifications(true)} />
          </div>
        )}
      </nav>

      {/* Notifications Dropdown */}
      <NotificationsDropdown
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUserProfile={onUserProfile}
      />
    </>
  );
};

export default Navigation;
