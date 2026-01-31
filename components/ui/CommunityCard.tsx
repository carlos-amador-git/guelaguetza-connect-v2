import React from 'react';
import { Users, MessageSquare, Lock, CheckCircle } from 'lucide-react';
import { Community } from '../../services/communities';

interface CommunityCardProps {
  community: Community;
  onClick: () => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left"
    >
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink">
          {community.imageUrl ? (
            <img
              src={community.imageUrl}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
              {community.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {community.name}
            </h3>
            {!community.isPublic && (
              <Lock size={14} className="text-gray-400 flex-shrink-0" />
            )}
            {community.isMember && (
              <CheckCircle
                size={14}
                className="text-green-500 flex-shrink-0"
              />
            )}
          </div>

          {community.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
              {community.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users size={12} />
              {community.membersCount} miembros
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare size={12} />
              {community.postsCount} posts
            </span>
          </div>
        </div>

        {/* Member badge */}
        {community.isMember && community.memberRole && (
          <div className="flex-shrink-0">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                community.memberRole === 'ADMIN'
                  ? 'bg-oaxaca-purple/10 text-oaxaca-purple'
                  : community.memberRole === 'MODERATOR'
                  ? 'bg-oaxaca-sky-light text-oaxaca-sky dark:bg-oaxaca-sky/20 dark:text-oaxaca-sky'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {community.memberRole === 'ADMIN'
                ? 'Admin'
                : community.memberRole === 'MODERATOR'
                ? 'Mod'
                : 'Miembro'}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

export default CommunityCard;
