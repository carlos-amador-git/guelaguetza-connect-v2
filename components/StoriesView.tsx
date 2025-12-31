import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, MapPin, Loader2 } from 'lucide-react';
import { fetchStories, Story } from '../services/api';
import { STORIES } from '../constants';

const StoriesView: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchStories()
      .then(setStories)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Fallback to static data if API fails
  const displayStories = error || stories.length === 0
    ? STORIES.map(s => ({
        id: s.id,
        description: s.description,
        mediaUrl: s.mediaUrl,
        location: s.location,
        views: 0,
        createdAt: new Date().toISOString(),
        user: { id: '1', nombre: s.user, avatar: s.avatar },
        _count: { likes: s.likes, comments: 0 }
      }))
    : stories;

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-oaxaca-pink" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md px-4 py-3 flex justify-between items-center text-white border-b border-white/10">
        <h2 className="font-bold text-xl">Historias</h2>
        <button className="text-sm bg-oaxaca-pink px-3 py-1 rounded-full font-medium">
          + Subir
        </button>
      </div>

      {/* Stories Feed */}
      <div className="flex flex-col gap-1 snap-y snap-mandatory h-[calc(100vh-130px)] overflow-y-scroll no-scrollbar">
        {displayStories.map((story) => (
          <div key={story.id} className="relative w-full aspect-[9/16] shrink-0 snap-start bg-gray-900">
            <img
              src={story.mediaUrl}
              alt={story.description}
              className="w-full h-full object-cover opacity-90"
            />

            {/* Overlay Elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 flex flex-col justify-between p-4">

              {/* Top: User Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={story.user.avatar || '/default-avatar.png'} alt={story.user.nombre} className="w-8 h-8 rounded-full border border-white" />
                  <span className="text-white font-semibold text-sm shadow-sm">{story.user.nombre}</span>
                </div>
                <MoreVertical className="text-white" size={20} />
              </div>

              {/* Bottom: Interaction & Caption */}
              <div className="mb-4">
                 {/* Geo Tag */}
                 <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md mb-2">
                    <MapPin size={12} className="text-oaxaca-yellow" />
                    <span className="text-white text-xs font-medium">{story.location}</span>
                 </div>

                 <p className="text-white text-sm mb-4 leading-relaxed">
                   {story.description}
                 </p>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <button className="flex flex-col items-center gap-1">
                          <Heart className="text-white hover:text-red-500 transition" size={26} />
                          <span className="text-white text-xs">{story._count.likes}</span>
                       </button>
                       <button className="flex flex-col items-center gap-1">
                          <MessageCircle className="text-white" size={26} />
                          <span className="text-white text-xs">Comentar</span>
                       </button>
                       <button className="flex flex-col items-center gap-1">
                          <Share2 className="text-white" size={26} />
                          <span className="text-white text-xs">Compartir</span>
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesView;
