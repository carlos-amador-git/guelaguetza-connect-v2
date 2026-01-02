import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getMessages,
  sendMessage as sendDMMessage,
  DirectMessage,
  Participant,
  connectDMWebSocket,
  disconnectDMWebSocket,
  onMessage,
  markConversationAsRead,
} from '../services/dm';
import MessageBubble from './ui/MessageBubble';

interface DirectChatViewProps {
  conversationId: string;
  participant: Participant;
  onBack: () => void;
  onUserProfile?: (userId: string) => void;
}

const DirectChatView: React.FC<DirectChatViewProps> = ({
  conversationId,
  participant,
  onBack,
  onUserProfile,
}) => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;

    loadMessages();

    // Connect WebSocket
    connectDMWebSocket(token);

    // Listen for new messages
    const unsubMessage = onMessage((message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [message, ...prev]);
        scrollToBottom();
        // Mark as read
        markConversationAsRead(conversationId);
      }
    });

    return () => {
      unsubMessage();
    };
  }, [token, conversationId]);

  const loadMessages = async (pageNum: number = 1) => {
    if (!token) return;

    if (pageNum === 1) {
      setLoading(true);
    }

    try {
      const data = await getMessages(conversationId, pageNum, 30, token);
      if (pageNum === 1) {
        setMessages(data.messages);
      } else {
        setMessages((prev) => [...prev, ...data.messages]);
      }
      setHasMore(data.hasMore);
      setPage(pageNum);

      // Mark as read
      markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadMessages(page + 1);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!token || !inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const message = await sendDMMessage(conversationId, content, token);
      setMessages((prev) => [message, ...prev]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(content); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check if we should show avatar (first message or different sender)
  const shouldShowAvatar = (index: number): boolean => {
    const message = messages[index];
    const nextMessage = messages[index + 1];

    if (!nextMessage) return true;
    return message.senderId !== nextMessage.senderId;
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

          <button
            onClick={() => onUserProfile?.(participant.id)}
            className="flex items-center gap-3 flex-1"
          >
            <img
              src={
                participant.avatar ||
                `https://ui-avatars.com/api/?name=${participant.nombre}&background=random`
              }
              alt={participant.nombre}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="text-left">
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {participant.nombre} {participant.apellido}
              </h1>
            </div>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col-reverse"
      >
        <div ref={messagesEndRef} />

        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No hay mensajes aún. Envía el primero.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                showAvatar={shouldShowAvatar(index)}
              />
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                className="mx-auto my-4 px-4 py-2 text-sm text-oaxaca-pink hover:bg-oaxaca-pink/10 rounded-full transition-colors"
              >
                Cargar mensajes anteriores
              </button>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-oaxaca-pink resize-none max-h-32"
            style={{
              minHeight: '40px',
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="p-3 bg-oaxaca-pink text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-oaxaca-pink/90 transition-colors"
          >
            {sending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectChatView;
