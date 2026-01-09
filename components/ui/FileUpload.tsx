import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  Plus,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
  previewUrl?: string;
}

type AcceptType = 'image' | 'video' | 'audio' | 'document' | 'all';

interface FileUploadProps {
  accept?: AcceptType | AcceptType[] | string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onUpload: (file: File, onProgress: (progress: number) => void) => Promise<string>;
  onComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
  value?: string[];
  onChange?: (urls: string[]) => void;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  variant?: 'dropzone' | 'button' | 'compact';
  label?: string;
  hint?: string;
}

// ============================================
// Utilities
// ============================================

const getAcceptString = (accept: AcceptType | AcceptType[] | string): string => {
  if (typeof accept === 'string') return accept;

  const types = Array.isArray(accept) ? accept : [accept];
  const acceptMap: Record<AcceptType, string> = {
    image: 'image/*',
    video: 'video/*',
    audio: 'audio/*',
    document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
    all: '*/*',
  };

  return types.map((t) => acceptMap[t] || t).join(',');
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon size={20} />;
  if (type.startsWith('video/')) return <Film size={20} />;
  if (type.startsWith('audio/')) return <Music size={20} />;
  if (type.includes('pdf') || type.includes('document')) return <FileText size={20} />;
  return <File size={20} />;
};

const createPreviewUrl = (file: File): string | null => {
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
    return URL.createObjectURL(file);
  }
  return null;
};

// ============================================
// FileUpload Component
// ============================================

/**
 * FileUpload - File upload with progress and preview
 *
 * Features:
 * - Drag and drop
 * - Progress tracking
 * - Image/video preview
 * - Multiple files
 * - Size validation
 *
 * Usage:
 * <FileUpload
 *   accept="image"
 *   maxFiles={5}
 *   maxSize={5 * 1024 * 1024}
 *   onUpload={uploadToServer}
 * />
 */
const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'all',
  multiple = false,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUpload,
  onComplete,
  onError,
  value = [],
  onChange,
  className = '',
  disabled = false,
  showPreview = true,
  variant = 'dropzone',
  label = 'Subir archivos',
  hint,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);

  // Generate file ID
  const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `El archivo excede el tamaño máximo de ${formatFileSize(maxSize)}`;
    }
    return null;
  };

  // Process files
  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles: UploadFile[] = [];

      for (const file of Array.from(fileList)) {
        if (files.length + newFiles.length >= maxFiles) {
          onError?.(`Máximo ${maxFiles} archivos permitidos`);
          break;
        }

        const error = validateFile(file);
        const previewUrl = createPreviewUrl(file);

        const uploadFile: UploadFile = {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: error ? 'error' : 'pending',
          error: error || undefined,
          previewUrl: previewUrl || undefined,
        };

        newFiles.push(uploadFile);
      }

      setFiles((prev) => [...prev, ...newFiles]);
      triggerHaptic('selection');

      // Start uploading valid files
      for (const uploadFile of newFiles) {
        if (uploadFile.status === 'pending') {
          uploadFileToServer(uploadFile);
        }
      }
    },
    [files.length, maxFiles, maxSize, onError]
  );

  // Upload file to server
  const uploadFileToServer = async (uploadFile: UploadFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
      )
    );

    try {
      const url = await onUpload(uploadFile.file, (progress) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f))
        );
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'success' as const, progress: 100, url }
            : f
        )
      );

      triggerHaptic('success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al subir archivo';

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        )
      );

      triggerHaptic('error');
      onError?.(errorMessage);
    }
  };

  // Retry upload
  const retryUpload = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'pending' as const, error: undefined, progress: 0 } : f
        )
      );
      uploadFileToServer(file);
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
    triggerHaptic('light');
  };

  // Update parent when files change
  useEffect(() => {
    const successUrls = files
      .filter((f) => f.status === 'success' && f.url)
      .map((f) => f.url!);

    onChange?.(successUrls);

    if (
      files.length > 0 &&
      files.every((f) => f.status === 'success' || f.status === 'error')
    ) {
      onComplete?.(successUrls);
    }
  }, [files, onChange, onComplete]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  // Drag handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Render file item
  const renderFileItem = (file: UploadFile) => (
    <div
      key={file.id}
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
    >
      {/* Preview/Icon */}
      <div className="relative w-12 h-12 flex-shrink-0">
        {file.previewUrl && file.type.startsWith('image/') ? (
          <img
            src={file.previewUrl}
            alt={file.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
            {getFileIcon(file.type)}
          </div>
        )}

        {/* Status overlay */}
        {file.status === 'uploading' && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <Loader2 size={20} className="text-white animate-spin" />
          </div>
        )}
        {file.status === 'success' && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle size={12} className="text-white" />
          </div>
        )}
        {file.status === 'error' && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle size={12} className="text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
          {file.error && (
            <span className="text-red-500 ml-2">{file.error}</span>
          )}
        </p>

        {/* Progress bar */}
        {file.status === 'uploading' && (
          <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-oaxaca-pink transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {file.previewUrl && (
          <button
            onClick={() => setPreviewFile(file)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Eye size={16} />
          </button>
        )}
        {file.status === 'error' && (
          <button
            onClick={() => retryUpload(file.id)}
            className="p-1.5 text-gray-400 hover:text-oaxaca-pink"
          >
            <RefreshCw size={16} />
          </button>
        )}
        <button
          onClick={() => removeFile(file.id)}
          className="p-1.5 text-gray-400 hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  // Dropzone variant
  if (variant === 'dropzone') {
    return (
      <div className={className}>
        {/* Dropzone */}
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-oaxaca-pink bg-oaxaca-pink/5'
              : 'border-gray-300 dark:border-gray-600 hover:border-oaxaca-pink'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload
            size={40}
            className={`mx-auto mb-4 ${
              isDragging ? 'text-oaxaca-pink' : 'text-gray-400'
            }`}
          />
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          {hint && (
            <p className="text-xs text-gray-400 mt-2">{hint}</p>
          )}
        </div>

        {/* File list */}
        {files.length > 0 && showPreview && (
          <div className="mt-4 space-y-2">
            {files.map(renderFileItem)}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={getAcceptString(accept)}
          multiple={multiple}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {/* Preview modal */}
        {previewFile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setPreviewFile(null)}
          >
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
            >
              <X size={24} />
            </button>
            {previewFile.type.startsWith('image/') && (
              <img
                src={previewFile.previewUrl}
                alt={previewFile.name}
                className="max-w-full max-h-full object-contain"
              />
            )}
            {previewFile.type.startsWith('video/') && (
              <video
                src={previewFile.previewUrl}
                controls
                className="max-w-full max-h-full"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <div className={className}>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-oaxaca-pink text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Upload size={18} />
          {label}
        </button>

        {files.length > 0 && showPreview && (
          <div className="mt-4 space-y-2">
            {files.map(renderFileItem)}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={getAcceptString(accept)}
          multiple={multiple}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  // Compact variant (for avatar, etc.)
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {files.map((file) => (
        <div key={file.id} className="relative w-20 h-20">
          {file.previewUrl ? (
            <img
              src={file.previewUrl}
              alt={file.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              {getFileIcon(file.type)}
            </div>
          )}

          {file.status === 'uploading' && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="text-white text-xs">{file.progress}%</div>
            </div>
          )}

          <button
            onClick={() => removeFile(file.id)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {files.length < maxFiles && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:border-oaxaca-pink hover:text-oaxaca-pink transition-colors disabled:opacity-50"
        >
          <Plus size={24} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={getAcceptString(accept)}
        multiple={multiple}
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default FileUpload;
