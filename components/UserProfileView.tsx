import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Grid3X3, Users, Loader2, MessageCircle } from 'lucide-react';
import { getUserProfile, getUserStories, UserProfile, FeedStory } from '../services/social';
import { createConversation, Participant } from '../services/dm';
import { useAuth } from '../contexts/AuthContext';
import FollowButton from './ui/FollowButton';
import Skeleton from './ui/Skeleton';

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
  onStoryClick?: (storyId: string) => void;
  onOpenChat?: (conversationId: string, participant: Participant) => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
  userId,
  onBack,
  onStoryClick,
  onOpenChat,
}) => {
  const { token, user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<FeedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [startingChat, setStartingChat] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const handleStartChat = async () => {
    if (!token || !profile || !onOpenChat) return;

    setStartingChat(true);
    try {
      const conversation = await createConversation(userId, token);
      onOpenChat(conversation.id, {
        id: userId,
        nombre: profile.nombre,
        apellido: profile.apellido,
        avatar: profile.avatar,
      });
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadStories();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile(userId, token || undefined);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async () => {
    try {
      const data = await getUserStories(userId, 1, 50, token || undefined);
      setStories(data.stories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        isFollowing,
        followersCount: isFollowing
          ? profile.followersCount + 1
          : profile.followersCount - 1,
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20">
        {/* Header skeleton */}
        <div className="bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink p-6 pt-8 pb-24">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 text-white">
              <ArrowLeft size={24} />
            </button>
            <Skeleton variant="text" width={150} height={24} className="bg-white/20" />
          </div>
        </div>

        {/* Profile card skeleton */}
        <div className="px-4 -mt-16 relative z-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" width={80} height={80} />
              <div className="flex-1">
                <Skeleton variant="text" width={120} height={20} className="mb-2" />
                <Skeleton variant="text" width={80} height={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20 flex flex-col items-center justify-center">
        <p className="text-gray-500">Usuario no encontrado</p>
        <button onClick={onBack} className="mt-4 text-oaxaca-pink font-medium">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink p-6 pt-8 pb-24 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 text-white hover:bg-white/10 rounded-full">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-white font-bold text-xl">Perfil</h2>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.nombre}
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 bg-oaxaca-yellow rounded-full flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-md">
                <span className="text-2xl font-bold text-oaxaca-purple">
                  {profile.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Info & Follow button */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.nombre} {profile.apellido || ''}
                  </h3>
                  {profile.region && (
                    <div className="flex items-center gap-1 mt-1 text-oaxaca-pink text-sm">
                      <MapPin size={14} />
                      <span>{profile.region}</span>
                    </div>
                  )}
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2">
                    <FollowButton
                      userId={userId}
                      isFollowing={profile.isFollowing || false}
                      onFollowChange={handleFollowChange}
                      size="sm"
                    />
                    {isAuthenticated && onOpenChat && (
                      <button
                        onClick={handleStartChat}
                        disabled={startingChat}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        title="Enviar mensaje"
                      >
                        {startingChat ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <MessageCircle size={18} />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-around mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex flex-col items-center ${
                activeTab === 'posts' ? 'text-oaxaca-pink' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="text-xl font-bold">{profile.storiesCount}</span>
              <span className="text-xs">Historias</span>
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex flex-col items-center ${
                activeTab === 'followers' ? 'text-oaxaca-pink' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="text-xl font-bold">{profile.followersCount}</span>
              <span className="text-xs">Seguidores</span>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex flex-col items-center ${
                activeTab === 'following' ? 'text-oaxaca-pink' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="text-xl font-bold">{profile.followingCount}</span>
              <span className="text-xs">Siguiendo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content tabs */}
      <div className="px-4 mt-4">
        {activeTab === 'posts' && (
          <div>
            {loadingStories ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Grid3X3 size={48} className="mx-auto mb-3 opacity-50" />
                <p>Sin historias aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {stories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => onStoryClick?.(story.id)}
                    className="aspect-square relative overflow-hidden rounded-lg"
                  >
                    {story.mediaType === 'VIDEO' && story.thumbnailUrl ? (
                      <img
                        src={story.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={story.mediaUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    {story.mediaType === 'VIDEO' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-gray-800 ml-0.5" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="text-center py-8 text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>Lista de seguidores</p>
              <p className="text-sm">Próximamente</p>
            </div>
          </div>
        )}

        {activeTab === 'following' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <div className="text-center py-8 text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-50" />
              <p>Lista de siguiendo</p>
              <p className="text-sm">Próximamente</p>
            </div>
          </div>
        )}
      </div>

      {/* Join date */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <Calendar size={14} />
          <span>
            Se unió en {new Date(profile.createdAt).toLocaleDateString('es-MX', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
