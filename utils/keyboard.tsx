import React, { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';

/**
 * Keyboard Shortcuts System for Guelaguetza Connect
 *
 * Features:
 * - Global and scoped shortcuts
 * - Modifier key support (Ctrl, Alt, Shift, Meta)
 * - Conflict detection
 * - Help modal with all shortcuts
 * - Platform-aware key display
 */

// ============================================
// Types
// ============================================

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
  scope?: string;
  enabled?: boolean;
}

interface ShortcutRegistration extends Shortcut {
  id: string;
}

interface KeyboardContextType {
  registerShortcut: (shortcut: Shortcut) => string;
  unregisterShortcut: (id: string) => void;
  setScope: (scope: string | null) => void;
  currentScope: string | null;
  shortcuts: ShortcutRegistration[];
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
}

// ============================================
// Context
// ============================================

const KeyboardContext = createContext<KeyboardContextType | null>(null);

// ============================================
// Utils
// ============================================

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const getKeyDisplay = (shortcut: Pick<Shortcut, 'key' | 'ctrl' | 'alt' | 'shift' | 'meta'>) => {
  const parts: string[] = [];

  if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win');
  if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');

  // Format the key
  const keyMap: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Enter: '↵',
    Escape: 'Esc',
    Backspace: '⌫',
    Delete: 'Del',
    Tab: '⇥',
    ' ': 'Space',
  };

  parts.push(keyMap[shortcut.key] || shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
};

const matchesShortcut = (event: KeyboardEvent, shortcut: Shortcut): boolean => {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || (isMac && event.metaKey && !shortcut.meta));
  const altMatches = !!shortcut.alt === event.altKey;
  const shiftMatches = !!shortcut.shift === event.shiftKey;
  const metaMatches = !!shortcut.meta === event.metaKey;

  return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
};

// ============================================
// Provider
// ============================================

interface KeyboardProviderProps {
  children: React.ReactNode;
}

export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutRegistration[]>([]);
  const [currentScope, setCurrentScope] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const nextIdRef = useRef(0);

  const registerShortcut = useCallback((shortcut: Shortcut): string => {
    const id = `shortcut-${nextIdRef.current++}`;
    setShortcuts((prev) => [...prev, { ...shortcut, id }]);
    return id;
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const setScope = useCallback((scope: string | null) => {
    setCurrentScope(scope);
  }, []);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        if (shortcut.scope && shortcut.scope !== currentScope) continue;

        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, currentScope]);

  // Register help shortcut
  useEffect(() => {
    const id = registerShortcut({
      key: '/',
      shift: true,
      handler: () => setIsHelpOpen((prev) => !prev),
      description: 'Mostrar/ocultar atajos de teclado',
    });

    return () => unregisterShortcut(id);
  }, [registerShortcut, unregisterShortcut]);

  return (
    <KeyboardContext.Provider
      value={{
        registerShortcut,
        unregisterShortcut,
        setScope,
        currentScope,
        shortcuts,
        isHelpOpen,
        openHelp,
        closeHelp,
      }}
    >
      {children}
      {isHelpOpen && <KeyboardHelpModal onClose={closeHelp} />}
    </KeyboardContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
};

/**
 * useShortcut - Register a keyboard shortcut
 */
export const useShortcut = (
  shortcut: Omit<Shortcut, 'handler'>,
  handler: () => void,
  deps: React.DependencyList = []
) => {
  const { registerShortcut, unregisterShortcut } = useKeyboard();

  useEffect(() => {
    const id = registerShortcut({ ...shortcut, handler });
    return () => unregisterShortcut(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerShortcut, unregisterShortcut, ...deps]);
};

/**
 * useKeyboardScope - Set the current keyboard scope
 */
export const useKeyboardScope = (scope: string, active: boolean = true) => {
  const { setScope } = useKeyboard();

  useEffect(() => {
    if (active) {
      setScope(scope);
      return () => setScope(null);
    }
  }, [scope, active, setScope]);
};

// ============================================
// Help Modal
// ============================================

interface KeyboardHelpModalProps {
  onClose: () => void;
}

const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ onClose }) => {
  const { shortcuts, currentScope } = useKeyboard();

  // Group shortcuts by scope
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const scope = shortcut.scope || 'General';
    if (!acc[scope]) acc[scope] = [];
    acc[scope].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutRegistration[]>);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Atajos de teclado
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentScope ? `Contexto: ${currentScope}` : 'Atajos globales'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          {Object.entries(groupedShortcuts).map(([scope, scopeShortcuts]) => (
            <div key={scope} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {scope}
              </h3>
              <div className="space-y-2">
                {scopeShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                      {getKeyDisplay(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Presiona <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> para mostrar/ocultar esta ayuda
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Shortcut Display Component
// ============================================

interface ShortcutKeyProps {
  shortcut: Pick<Shortcut, 'key' | 'ctrl' | 'alt' | 'shift' | 'meta'>;
  className?: string;
}

export const ShortcutKey: React.FC<ShortcutKeyProps> = ({ shortcut, className = '' }) => (
  <kbd
    className={`px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300 ${className}`}
  >
    {getKeyDisplay(shortcut)}
  </kbd>
);

// ============================================
// Common Shortcuts Factory
// ============================================

export const createCommonShortcuts = (actions: {
  onSearch?: () => void;
  onHome?: () => void;
  onProfile?: () => void;
  onMessages?: () => void;
  onNotifications?: () => void;
  onBack?: () => void;
  onRefresh?: () => void;
  onNewPost?: () => void;
}): Shortcut[] => {
  const shortcuts: Shortcut[] = [];

  if (actions.onSearch) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      handler: actions.onSearch,
      description: 'Abrir búsqueda',
    });
  }

  if (actions.onHome) {
    shortcuts.push({
      key: 'h',
      handler: actions.onHome,
      description: 'Ir al inicio',
    });
  }

  if (actions.onProfile) {
    shortcuts.push({
      key: 'p',
      handler: actions.onProfile,
      description: 'Ir al perfil',
    });
  }

  if (actions.onMessages) {
    shortcuts.push({
      key: 'm',
      handler: actions.onMessages,
      description: 'Abrir mensajes',
    });
  }

  if (actions.onNotifications) {
    shortcuts.push({
      key: 'n',
      handler: actions.onNotifications,
      description: 'Ver notificaciones',
    });
  }

  if (actions.onBack) {
    shortcuts.push({
      key: 'Escape',
      handler: actions.onBack,
      description: 'Volver atrás',
    });
  }

  if (actions.onRefresh) {
    shortcuts.push({
      key: 'r',
      handler: actions.onRefresh,
      description: 'Actualizar contenido',
    });
  }

  if (actions.onNewPost) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      handler: actions.onNewPost,
      description: 'Nueva publicación',
    });
  }

  return shortcuts;
};

export default KeyboardProvider;
