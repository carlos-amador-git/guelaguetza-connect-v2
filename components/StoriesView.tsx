import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart, MessageCircle, Share2, MoreVertical, MapPin, X, Send,
  Camera, Image, Loader2, Copy, Check, Plus, Trash2, RefreshCw, Video, ArrowLeft
} from 'lucide-react';
import { fetchStories, likeStory, addComment, createStory, Story, Comment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { STORIES } from '../constants';
import { cacheStories, getCachedStories } from '../services/offlineCache';
import { checkOnlineStatus } from '../services/pwa';
import Skeleton, { SkeletonStoryCard } from './ui/Skeleton';
import haptics from '../services/haptics';
import VideoPlayer from './ui/VideoPlayer';

// WhatsApp icon component
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface LocalStory {
  id: string;
  description: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl?: string | null;
  duration?: number | null;
  location: string;
  user: { id: string; nombre: string; avatar: string | null };
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

interface StoriesViewProps {
  onUserProfile?: (userId: string) => void;
  onBack?: () => void;
}

const StoriesView: React.FC<StoriesViewProps> = ({ onUserProfile, onBack }) => {
  const { isAuthenticated, token, user } = useAuth();
  const [stories, setStories] = useState<LocalStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Modals
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Comments
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Upload
  const [uploadData, setUploadData] = useState({ description: '', location: '', mediaUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Share
  const [copied, setCopied] = useState(false);

  // Like animation
  const [likeAnimation, setLikeAnimation] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      // Check if offline, use cache
      if (!checkOnlineStatus()) {
        const cached = getCachedStories();
        if (cached) {
          setStories(cached.map(s => ({
            id: s.id,
            description: s.description,
            mediaUrl: s.mediaUrl,
            mediaType: (s as any).mediaType || 'IMAGE',
            thumbnailUrl: (s as any).thumbnailUrl,
            duration: (s as any).duration,
            location: s.location,
            user: s.user,
            likes: s._count?.likes || 0,
            comments: [],
            isLiked: false,
          })));
          setLoading(false);
          return;
        }
      }

      const data = await fetchStories();
      const mappedStories = data.map(s => ({
        id: s.id,
        description: s.description,
        mediaUrl: s.mediaUrl,
        mediaType: ((s as any).mediaType || 'IMAGE') as 'IMAGE' | 'VIDEO',
        thumbnailUrl: (s as any).thumbnailUrl,
        duration: (s as any).duration,
        location: s.location,
        user: s.user,
        likes: s._count.likes,
        comments: [],
        isLiked: false,
      }));
      setStories(mappedStories);

      // Cache for offline
      cacheStories(data);
    } catch {
      // Try cache first
      const cached = getCachedStories();
      if (cached) {
        setStories(cached.map(s => ({
          id: s.id,
          description: s.description,
          mediaUrl: s.mediaUrl,
          mediaType: ((s as any).mediaType || 'IMAGE') as 'IMAGE' | 'VIDEO',
          thumbnailUrl: (s as any).thumbnailUrl,
          duration: (s as any).duration,
          location: s.location,
          user: s.user,
          likes: s._count?.likes || 0,
          comments: [],
          isLiked: false,
        })));
      } else {
        // Fallback to static data
        setStories(STORIES.map(s => ({
          id: s.id,
          description: s.description,
          mediaUrl: s.mediaUrl,
          mediaType: 'IMAGE' as const,
          location: s.location,
          user: { id: '1', nombre: s.user, avatar: s.avatar },
          likes: s.likes,
          comments: [],
          isLiked: false,
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadStories();
    setIsRefreshing(false);
  }, []);

  const currentStory = stories[currentIndex];

  // Double tap to like
  const handleDoubleTap = async () => {
    if (!currentStory || currentStory.isLiked) return;
    await handleLike();
  };

  const handleLike = async () => {
    if (!currentStory) return;

    // Optimistic update
    setStories(prev => prev.map((s, i) =>
      i === currentIndex
        ? { ...s, isLiked: !s.isLiked, likes: s.isLiked ? s.likes - 1 : s.likes + 1 }
        : s
    ));

    // Show animation and haptic feedback
    if (!currentStory.isLiked) {
      setLikeAnimation(currentStory.id);
      haptics.success(); // Haptic feedback on like
      setTimeout(() => setLikeAnimation(null), 1000);
    }

    // API call if authenticated
    if (isAuthenticated && token) {
      try {
        await likeStory(currentStory.id, token);
      } catch {
        // Revert on error
        setStories(prev => prev.map((s, i) =>
          i === currentIndex
            ? { ...s, isLiked: !s.isLiked, likes: s.isLiked ? s.likes + 1 : s.likes - 1 }
            : s
        ));
      }
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !currentStory) return;

    setSendingComment(true);

    const newComment: Comment = {
      id: Date.now().toString(),
      text: commentText,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || 'guest',
        nombre: user?.nombre || 'Invitado',
        avatar: user?.faceData || null,
      },
    };

    // Optimistic update
    setStories(prev => prev.map((s, i) =>
      i === currentIndex
        ? { ...s, comments: [...s.comments, newComment] }
        : s
    ));
    setCommentText('');

    // API call if authenticated
    if (isAuthenticated && token) {
      try {
        await addComment(currentStory.id, commentText, token);
      } catch {
        // Keep local comment even if API fails
      }
    }

    setSendingComment(false);
  };

  const handleShare = (type: 'whatsapp' | 'copy') => {
    if (!currentStory) return;

    const shareUrl = `https://guelaguetza.app/stories/${currentStory.id}`;
    const shareText = `¡Mira esta historia de ${currentStory.user.nombre} en Guelaguetza Connect! 🎉\n${currentStory.description}`;

    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
    } else {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl);
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        console.error('Failed to copy to clipboard');
      }
    }
  };

  // Camera handling for upload
  useEffect(() => {
    if (!showCamera) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1920 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera error:', err);
        setShowCamera(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [showCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setUploadData(prev => ({ ...prev, mediaUrl: imageData }));
    setShowCamera(false);

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const handleUpload = async () => {
    if (!uploadData.description.trim() || !uploadData.mediaUrl) return;

    setUploading(true);

    const newStory: LocalStory = {
      id: Date.now().toString(),
      description: uploadData.description,
      mediaUrl: uploadData.mediaUrl,
      mediaType: 'IMAGE', // For now, only image uploads supported
      location: uploadData.location || 'Oaxaca',
      user: {
        id: user?.id || 'guest',
        nombre: user?.nombre || 'Tú',
        avatar: user?.faceData || null,
      },
      likes: 0,
      comments: [],
      isLiked: false,
    };

    // Add to beginning of stories
    setStories(prev => [newStory, ...prev]);
    setCurrentIndex(0);

    // API call if authenticated
    if (isAuthenticated && token) {
      try {
        await createStory({
          description: uploadData.description,
          mediaUrl: uploadData.mediaUrl,
          location: uploadData.location || 'Oaxaca',
        }, token);
      } catch {
        // Keep local story even if API fails
      }
    }

    setUploadData({ description: '', location: '', mediaUrl: '' });
    setShowUpload(false);
    setUploading(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < stories.length) {
      setCurrentIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen pb-20">
        {/* Skeleton Header */}
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md px-4 py-3 flex justify-between items-center border-b border-white/10">
          <Skeleton variant="text" width={100} height={24} className="bg-gray-800" />
          <Skeleton variant="rounded" width={80} height={36} className="bg-gray-800" />
        </div>

        {/* Skeleton Story */}
        <div className="relative w-full h-[calc(100vh-130px)] bg-gray-900">
          {/* User info skeleton */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} className="bg-gray-700" />
            <div className="flex-1">
              <Skeleton variant="text" width={120} height={14} className="bg-gray-700 mb-1" />
              <Skeleton variant="text" width={80} height={10} className="bg-gray-700" />
            </div>
          </div>

          {/* Content shimmer */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 animate-pulse" />

          {/* Bottom actions skeleton */}
          <div className="absolute bottom-8 left-4 right-4 z-10">
            <Skeleton variant="text" width="80%" height={16} className="bg-gray-700 mb-4" />
            <div className="flex items-center gap-6">
              <Skeleton variant="circular" width={28} height={28} className="bg-gray-700" />
              <Skeleton variant="circular" width={28} height={28} className="bg-gray-700" />
              <Skeleton variant="circular" width={28} height={28} className="bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md px-4 py-3 flex justify-between items-center text-white border-b border-white/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition">
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="font-bold text-xl">Historias</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 text-sm bg-oaxaca-pink px-4 py-2 rounded-full font-medium"
          >
            <Plus size={16} />
            Subir
          </button>
        </div>
      </div>

      {/* Stories Feed */}
      <div
        className="flex flex-col snap-y snap-mandatory h-[calc(100vh-130px)] overflow-y-scroll no-scrollbar"
        onScroll={handleScroll}
      >
        {stories.map((story, index) => (
          <div
            key={story.id}
            className="relative w-full h-[calc(100vh-130px)] shrink-0 snap-start bg-gray-900"
            onDoubleClick={handleDoubleTap}
          >
            {story.mediaType === 'VIDEO' ? (
              <VideoPlayer
                src={story.mediaUrl}
                poster={story.thumbnailUrl || undefined}
                autoPlay={index === currentIndex}
                muted
                loop
                className="w-full h-full"
              />
            ) : (
              <img
                src={story.mediaUrl}
                alt={story.description}
                className="w-full h-full object-cover"
              />
            )}

            {/* Like Animation */}
            {likeAnimation === story.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart
                  className="text-red-500 fill-red-500 animate-ping"
                  size={100}
                />
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 flex flex-col justify-between p-4">
              {/* Top: User Info */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onUserProfile?.(story.user.id)}
                  className="flex items-center gap-3 active:scale-95 transition-transform"
                >
                  {story.user.avatar ? (
                    <img src={story.user.avatar} alt={story.user.nombre} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-oaxaca-pink flex items-center justify-center">
                      <span className="text-white font-bold">{story.user.nombre.charAt(0)}</span>
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">{story.user.nombre}</p>
                    <div className="flex items-center gap-1 text-white/70 text-xs">
                      <MapPin size={10} />
                      <span>{story.location}</span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShowOptions(true)}
                  className="p-2 rounded-full bg-black/30"
                >
                  <MoreVertical className="text-white" size={20} />
                </button>
              </div>

              {/* Bottom: Caption & Actions */}
              <div className="space-y-4">
                {/* Caption */}
                <p className="text-white text-sm leading-relaxed">
                  {story.description}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Like */}
                    <button
                      onClick={handleLike}
                      className="flex flex-col items-center gap-1 active:scale-110 transition-transform"
                    >
                      <Heart
                        className={`transition-colors ${story.isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`}
                        size={28}
                      />
                      <span className="text-white text-xs">{story.likes}</span>
                    </button>

                    {/* Comment */}
                    <button
                      onClick={() => setShowComments(true)}
                      className="flex flex-col items-center gap-1"
                    >
                      <MessageCircle className="text-white" size={28} />
                      <span className="text-white text-xs">
                        {story.comments.length || 'Comentar'}
                      </span>
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => setShowShare(true)}
                      className="flex flex-col items-center gap-1"
                    >
                      <Share2 className="text-white" size={28} />
                      <span className="text-white text-xs">Compartir</span>
                    </button>
                  </div>

                  {/* Story indicator */}
                  <div className="flex gap-1">
                    {stories.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === index ? 'bg-white w-4' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comments Modal */}
      {showComments && currentStory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[70vh] flex flex-col animate-in slide-in-from-bottom">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Comentarios</h3>
              <button onClick={() => setShowComments(false)} className="p-2">
                <X size={24} />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentStory.comments.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  Sé el primero en comentar
                </p>
              ) : (
                currentStory.comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    {comment.user.avatar ? (
                      <img src={comment.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-bold">{comment.user.nombre.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{comment.user.nombre}</span>{' '}
                        {comment.text}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comment.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isAuthenticated ? "Escribe un comentario..." : "Inicia sesión para comentar"}
                disabled={!isAuthenticated}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:ring-2 focus:ring-oaxaca-pink outline-none disabled:opacity-50"
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || sendingComment}
                className="bg-oaxaca-pink text-white p-3 rounded-full disabled:opacity-50"
              >
                {sendingComment ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-t-3xl w-full p-6 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 text-center">Compartir</h3>

            <div className="flex justify-center gap-8">
              {/* WhatsApp */}
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <WhatsAppIcon />
                </div>
                <span className="text-sm">WhatsApp</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={() => handleShare('copy')}
                className="flex flex-col items-center gap-2"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${copied ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {copied ? <Check className="text-white" size={24} /> : <Copy className="text-gray-600" size={24} />}
                </div>
                <span className="text-sm">{copied ? '¡Copiado!' : 'Copiar link'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowShare(false)}
              className="w-full mt-6 py-3 text-gray-500 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {showCamera ? (
            // Camera View
            <>
              <div className="flex-1 relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={() => setShowCamera(false)}
                  className="p-4 bg-white/20 rounded-full text-white"
                >
                  <X size={24} />
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full border-4 border-oaxaca-pink"
                />
              </div>
            </>
          ) : (
            // Upload Form
            <>
              <div className="flex items-center justify-between p-4 text-white">
                <button onClick={() => setShowUpload(false)}>
                  <X size={24} />
                </button>
                <h3 className="font-bold">Nueva Historia</h3>
                <button
                  onClick={handleUpload}
                  disabled={!uploadData.mediaUrl || !uploadData.description || uploading}
                  className="text-oaxaca-yellow font-bold disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Publicar'}
                </button>
              </div>

              <div className="flex-1 p-4 space-y-4">
                {/* Media Preview or Capture */}
                {uploadData.mediaUrl ? (
                  <div className="relative aspect-[9/16] max-h-[50vh] rounded-xl overflow-hidden">
                    <img src={uploadData.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setUploadData(prev => ({ ...prev, mediaUrl: '' }))}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-full"
                    >
                      <Trash2 className="text-white" size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowCamera(true)}
                      className="flex-1 aspect-square bg-gray-800 rounded-xl flex flex-col items-center justify-center gap-2"
                    >
                      <Camera className="text-white" size={32} />
                      <span className="text-white text-sm">Cámara</span>
                    </button>
                    <label className="flex-1 aspect-square bg-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer">
                      <Image className="text-white" size={32} />
                      <span className="text-white text-sm">Galería</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setUploadData(prev => ({ ...prev, mediaUrl: ev.target?.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}

                {/* Description */}
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Escribe algo sobre tu historia..."
                  className="w-full p-4 bg-gray-800 text-white rounded-xl resize-none h-24 placeholder-gray-500"
                />

                {/* Location */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 rounded-xl">
                  <MapPin className="text-gray-500" size={20} />
                  <input
                    type="text"
                    value={uploadData.location}
                    onChange={(e) => setUploadData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Añade ubicación"
                    className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowOptions(false)}>
          <div className="bg-white rounded-t-3xl w-full p-4 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <button className="w-full py-3 text-left font-medium text-gray-900">
              Reportar
            </button>
            <button className="w-full py-3 text-left font-medium text-gray-900">
              No me interesa
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className="w-full py-3 text-left font-medium text-red-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesView;
