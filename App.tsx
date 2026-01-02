import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import TransportView from './components/TransportView';
import StoriesView from './components/StoriesView';
import ChatAssistant from './components/ChatAssistant';
import ProgramView from './components/ProgramView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ProfileView from './components/ProfileView';
import UserProfileView from './components/UserProfileView';
import BadgesView from './components/BadgesView';
import LeaderboardView from './components/LeaderboardView';
import DirectMessagesView from './components/DirectMessagesView';
import DirectChatView from './components/DirectChatView';
import SearchView from './components/SearchView';
import EventsView from './components/EventsView';
import EventDetailView from './components/EventDetailView';
import OfflineIndicator from './components/OfflineIndicator';
import UpdatePrompt from './components/UpdatePrompt';
import NotificationPrompt from './components/NotificationPrompt';
import Onboarding from './components/Onboarding';
import { ViewState } from './types';
import { Participant } from './services/dm';

// Lazy load ARScanner for code splitting
const ARScanner = lazy(() => import('./components/ARScanner'));

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>(ViewState.HOME);

  // DM state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Events state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleViewUserProfile = (userId: string) => {
    setSelectedUserId(userId);
    setPreviousView(currentView);
    setCurrentView(ViewState.USER_PROFILE);
  };

  const handleOpenChat = (conversationId: string, participant: Participant) => {
    setSelectedConversationId(conversationId);
    setSelectedParticipant(participant);
    setCurrentView(ViewState.DIRECT_CHAT);
  };

  const handleEventDetail = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView(ViewState.EVENT_DETAIL);
  };

  // Check if onboarding has been completed
  useEffect(() => {
    const completed = localStorage.getItem('guelaguetza_onboarding_completed');
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView setView={setCurrentView} />;
      case ViewState.TRANSPORT:
        return <TransportView />;
      case ViewState.AR_SCANNER:
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando AR...</div>}>
            <ARScanner />
          </Suspense>
        );
      case ViewState.STORIES:
        return <StoriesView onUserProfile={handleViewUserProfile} />;
      case ViewState.USER_PROFILE:
        return selectedUserId ? (
          <UserProfileView
            userId={selectedUserId}
            onBack={() => setCurrentView(previousView)}
            onOpenChat={handleOpenChat}
          />
        ) : (
          <StoriesView onUserProfile={handleViewUserProfile} />
        );
      case ViewState.CHAT:
        return <ChatAssistant />;
      case ViewState.PROGRAM:
        return <ProgramView />;
      case ViewState.LOGIN:
        return <LoginView setView={setCurrentView} />;
      case ViewState.REGISTER:
        return <RegisterView setView={setCurrentView} />;
      case ViewState.PROFILE:
        return <ProfileView setView={setCurrentView} />;
      case ViewState.BADGES:
        return <BadgesView onBack={() => setCurrentView(ViewState.PROFILE)} />;
      case ViewState.LEADERBOARD:
        return (
          <LeaderboardView
            onBack={() => setCurrentView(ViewState.PROFILE)}
            onUserProfile={handleViewUserProfile}
          />
        );
      case ViewState.DIRECT_MESSAGES:
        return (
          <DirectMessagesView
            onBack={() => setCurrentView(ViewState.PROFILE)}
            onOpenChat={handleOpenChat}
          />
        );
      case ViewState.DIRECT_CHAT:
        return selectedConversationId && selectedParticipant ? (
          <DirectChatView
            conversationId={selectedConversationId}
            participant={selectedParticipant}
            onBack={() => setCurrentView(ViewState.DIRECT_MESSAGES)}
            onUserProfile={handleViewUserProfile}
          />
        ) : (
          <DirectMessagesView
            onBack={() => setCurrentView(ViewState.PROFILE)}
            onOpenChat={handleOpenChat}
          />
        );
      case ViewState.SEARCH:
        return (
          <SearchView
            onBack={() => setCurrentView(ViewState.HOME)}
            onUserProfile={handleViewUserProfile}
          />
        );
      case ViewState.EVENTS:
        return (
          <EventsView
            onBack={() => setCurrentView(ViewState.HOME)}
            onEventDetail={handleEventDetail}
          />
        );
      case ViewState.EVENT_DETAIL:
        return selectedEventId ? (
          <EventDetailView
            eventId={selectedEventId}
            onBack={() => setCurrentView(ViewState.EVENTS)}
          />
        ) : (
          <EventsView
            onBack={() => setCurrentView(ViewState.HOME)}
            onEventDetail={handleEventDetail}
          />
        );
      default:
        return <HomeView setView={setCurrentView} />;
    }
  };

  // Hide navigation on auth screens, user profile, gamification views, and new feature views
  const hideNav = [
    ViewState.LOGIN,
    ViewState.REGISTER,
    ViewState.USER_PROFILE,
    ViewState.BADGES,
    ViewState.LEADERBOARD,
    ViewState.DIRECT_MESSAGES,
    ViewState.DIRECT_CHAT,
    ViewState.SEARCH,
    ViewState.EVENTS,
    ViewState.EVENT_DETAIL,
  ].includes(currentView);

  return (
    <div className="max-w-md mx-auto h-screen bg-white dark:bg-gray-900 relative shadow-2xl overflow-hidden flex flex-col font-sans transition-colors">
      {/* Onboarding */}
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      {/* PWA Offline Indicator */}
      <OfflineIndicator />

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        {renderView()}
      </div>
      {!hideNav && <Navigation currentView={currentView} setView={setCurrentView} onUserProfile={handleViewUserProfile} />}

      {/* PWA Prompts */}
      <NotificationPrompt />
      <UpdatePrompt />
    </div>
  );
};

export default App;
