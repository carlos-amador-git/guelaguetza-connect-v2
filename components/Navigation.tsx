import React, { useState } from 'react';
import { Home, Bus, Camera, Search, User } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import haptics from '../services/haptics';
import NotificationBell from './ui/NotificationBell';
import NotificationsDropdown from './NotificationsDropdown';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onUserProfile?: (userId: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, onUserProfile }) => {
  const { isAuthenticated, user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { view: ViewState.HOME, icon: Home, label: 'Inicio' },
    { view: ViewState.TRANSPORT, icon: Bus, label: 'BinniBus' },
    { view: ViewState.AR_SCANNER, icon: Camera, label: 'AR' },
    { view: ViewState.SEARCH, icon: Search, label: 'Buscar' },
    { view: ViewState.PROFILE, icon: User, label: 'Perfil' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe z-50 transition-colors">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            const isProfile = item.view === ViewState.PROFILE;

            return (
              <button
                key={item.view}
                onClick={() => {
                  haptics.tap(); // Haptic feedback on navigation
                  setView(item.view);
                }}
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
