import React, { useEffect, useCallback, useRef, useState, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ModalPosition = 'center' | 'top' | 'bottom';

// ============================================
// Modal Context
// ============================================

interface ModalContextType {
  close: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within Modal');
  }
  return context;
};

// ============================================
// Modal Component
// ============================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  position?: ModalPosition;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showClose?: boolean;
  preventScroll?: boolean;
  className?: string;
}

/**
 * Modal - Componente de modal/dialog
 *
 * Features:
 * - Múltiples tamaños
 * - Posiciones configurables
 * - Cierre con overlay/escape
 * - Animaciones suaves
 * - Accesibilidad completa
 *
 * Usage:
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <ModalHeader>Título</ModalHeader>
 *   <ModalBody>Contenido</ModalBody>
 *   <ModalFooter>Acciones</ModalFooter>
 * </Modal>
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  position = 'center',
  closeOnOverlay = true,
  closeOnEscape = true,
  showClose = true,
  preventScroll = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        triggerHaptic('light');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent scroll and manage focus
  useEffect(() => {
    if (!isOpen) return;

    if (preventScroll) {
      document.body.style.overflow = 'hidden';
    }

    previousActiveElement.current = document.activeElement;
    modalRef.current?.focus();

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
      }
      (previousActiveElement.current as HTMLElement)?.focus?.();
    };
  }, [isOpen, preventScroll]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
      triggerHaptic('light');
    }
  };

  const sizes: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  const positions: Record<ModalPosition, string> = {
    center: 'items-center',
    top: 'items-start pt-20',
    bottom: 'items-end pb-20',
  };

  if (!isOpen) return null;

  return createPortal(
    <ModalContext.Provider value={{ close: onClose }}>
      <div
        className={`fixed inset-0 z-50 flex justify-center ${positions[position]} p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200`}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`relative w-full ${sizes[size]} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 ${className}`}
        >
          {showClose && (
            <button
              onClick={() => {
                onClose();
                triggerHaptic('light');
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          )}
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
};

// ============================================
// Modal Parts
// ============================================

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = '' }) => (
  <div className={`px-6 pt-6 pb-4 ${className}`}>
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-8">{children}</h2>
  </div>
);

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 text-gray-600 dark:text-gray-400 ${className}`}>{children}</div>
);

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

// ============================================
// Alert Dialog Component
// ============================================

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => {
  const variants = {
    danger: {
      icon: <AlertTriangle size={24} />,
      iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertCircle size={24} />,
      iconBg: 'bg-oaxaca-yellow-light dark:bg-oaxaca-yellow/20 text-oaxaca-yellow',
      button: 'bg-oaxaca-yellow hover:bg-oaxaca-yellow/90 text-white',
    },
    info: {
      icon: <Info size={24} />,
      iconBg: 'bg-oaxaca-sky-light dark:bg-oaxaca-sky/20 text-oaxaca-sky',
      button: 'bg-oaxaca-sky hover:bg-oaxaca-sky/90 text-white',
    },
    success: {
      icon: <CheckCircle size={24} />,
      iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600',
      button: 'bg-green-600 hover:bg-green-700 text-white',
    },
  };

  const config = variants[variant];

  const handleConfirm = () => {
    onConfirm();
    triggerHaptic('impact');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="p-6 text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${config.iconBg} mb-4`}>
          {config.icon}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>

        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 ${config.button}`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cargando...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================
// Drawer Component
// ============================================

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  showClose?: boolean;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'right',
  size = 'md',
  showClose = true,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const sizes = {
    sm: position === 'left' || position === 'right' ? 'w-64' : 'h-48',
    md: position === 'left' || position === 'right' ? 'w-80' : 'h-64',
    lg: position === 'left' || position === 'right' ? 'w-96' : 'h-80',
    full: position === 'left' || position === 'right' ? 'w-full max-w-md' : 'h-full max-h-96',
  };

  const positionStyles = {
    left: `left-0 top-0 h-full ${sizes[size]} animate-in slide-in-from-left duration-300`,
    right: `right-0 top-0 h-full ${sizes[size]} animate-in slide-in-from-right duration-300`,
    top: `top-0 left-0 w-full ${sizes[size]} animate-in slide-in-from-top duration-300`,
    bottom: `bottom-0 left-0 w-full ${sizes[size]} animate-in slide-in-from-bottom duration-300`,
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={() => {
          onClose();
          triggerHaptic('light');
        }}
      />

      {/* Drawer */}
      <div
        className={`fixed bg-white dark:bg-gray-800 shadow-xl ${positionStyles[position]} ${className}`}
      >
        {showClose && (
          <button
            onClick={() => {
              onClose();
              triggerHaptic('light');
            }}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

// ============================================
// Lightbox Component
// ============================================

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: { src: string; alt?: string; caption?: string }[];
  initialIndex?: number;
}

export const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
      if (e.key === 'ArrowRight') setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
      >
        <X size={24} />
      </button>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
            className="absolute left-4 p-3 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
            className="absolute right-4 p-3 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image */}
      <div className="max-w-full max-h-full p-4">
        <img
          src={currentImage.src}
          alt={currentImage.alt || ''}
          className="max-w-full max-h-[80vh] object-contain"
        />
        {currentImage.caption && (
          <p className="text-center text-white/70 mt-4">{currentImage.caption}</p>
        )}
      </div>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/10 rounded-full text-white/70 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
};

// ============================================
// useModal Hook
// ============================================

export const useModal = (defaultOpen = false) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    triggerHaptic('light');
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((v) => !v);
    triggerHaptic('light');
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    modalProps: {
      isOpen,
      onClose: close,
    },
  };
};

// ============================================
// useConfirmDialog Hook
// ============================================

interface ConfirmDialogOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(false);
  }, []);

  const ConfirmDialogComponent = options ? (
    <AlertDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={options.title}
      description={options.description}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant}
    />
  ) : null;

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
};

export default Modal;
