import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { DirectMessage, timeAgo } from '../../services/dm';

interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  showAvatar?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
}) => {
  return (
    <div className={`flex gap-2 mb-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isOwn && showAvatar && (
        <img
          src={message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.nombre}&background=random`}
          alt={message.sender.nombre}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      )}
      {!isOwn && !showAvatar && <div className="w-8" />}

      {/* Message bubble */}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-oaxaca-pink text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Time and read status */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{timeAgo(message.createdAt)}</span>
          {isOwn && (
            message.read ? (
              <CheckCheck size={14} className="text-oaxaca-pink" />
            ) : (
              <Check size={14} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
