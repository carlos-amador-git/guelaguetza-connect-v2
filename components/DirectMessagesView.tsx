import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getConversations,
  Conversation,
  timeAgo,
  connectDMWebSocket,
  disconnectDMWebSocket,
  onMessage,
  onDMUnreadCount,
} from '../services/dm';
import { ViewState } from '../types';

interface DirectMessagesViewProps {
  onBack: () => void;
  onOpenChat: (conversationId: string, participant: Conversation['otherParticipant']) => void;
}

const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  onBack,
  onOpenChat,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    loadConversations();

    // Connect WebSocket for real-time messages
    connectDMWebSocket(token);

    // Listen for new messages
    const unsubMessage = onMessage((message) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: {
                content: message.content,
                senderId: message.senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
              unreadCount: conv.unreadCount + 1,
            };
          }
          return conv;
        });

        // Sort by lastMessageAt
        return updated.sort((a, b) => {
          if (!a.lastMessageAt) return 1;
          if (!b.lastMessageAt) return -1;
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });
      });
    });

    const unsubUnread = onDMUnreadCount((count) => {
      setTotalUnread(count);
    });

    return () => {
      unsubMessage();
      unsubUnread();
      disconnectDMWebSocket();
    };
  }, [isAuthenticated, token]);

  const loadConversations = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await getConversations(1, 50, token);
      setConversations(data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mensajes</h1>
            {totalUnread > 0 && (
              <p className="text-xs text-oaxaca-pink">{totalUnread} sin leer</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <MessageCircle size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No tienes conversaciones
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Inicia una conversación desde el perfil de otro usuario
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onOpenChat(conv.id, conv.otherParticipant)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={
                      conv.otherParticipant.avatar ||
                      `https://ui-avatars.com/api/?name=${conv.otherParticipant.nombre}&background=random`
                    }
                    alt={conv.otherParticipant.nombre}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-oaxaca-pink text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-semibold truncate ${
                        conv.unreadCount > 0
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {conv.otherParticipant.nombre}{' '}
                      {conv.otherParticipant.apellido && conv.otherParticipant.apellido}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400 ml-2">
                        {timeAgo(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p
                      className={`text-sm truncate mt-1 ${
                        conv.unreadCount > 0
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessagesView;
