import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image,
  Quote,
  Code,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Type,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

type FormatType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'h1'
  | 'h2'
  | 'ul'
  | 'ol'
  | 'quote'
  | 'code'
  | 'link'
  | 'image'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight';

interface ToolbarButton {
  format: FormatType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  disabled?: boolean;
  showToolbar?: boolean;
  toolbarPosition?: 'top' | 'bottom';
  onImageUpload?: (file: File) => Promise<string>;
  autoFocus?: boolean;
}

// ============================================
// Toolbar Buttons Configuration
// ============================================

const toolbarGroups: ToolbarButton[][] = [
  [
    { format: 'bold', icon: <Bold size={18} />, label: 'Negrita', shortcut: '⌘B' },
    { format: 'italic', icon: <Italic size={18} />, label: 'Cursiva', shortcut: '⌘I' },
    { format: 'underline', icon: <Underline size={18} />, label: 'Subrayado', shortcut: '⌘U' },
    { format: 'strikethrough', icon: <Strikethrough size={18} />, label: 'Tachado' },
  ],
  [
    { format: 'h1', icon: <Heading1 size={18} />, label: 'Título 1' },
    { format: 'h2', icon: <Heading2 size={18} />, label: 'Título 2' },
  ],
  [
    { format: 'ul', icon: <List size={18} />, label: 'Lista con viñetas' },
    { format: 'ol', icon: <ListOrdered size={18} />, label: 'Lista numerada' },
    { format: 'quote', icon: <Quote size={18} />, label: 'Cita' },
    { format: 'code', icon: <Code size={18} />, label: 'Código' },
  ],
  [
    { format: 'alignLeft', icon: <AlignLeft size={18} />, label: 'Alinear izquierda' },
    { format: 'alignCenter', icon: <AlignCenter size={18} />, label: 'Centrar' },
    { format: 'alignRight', icon: <AlignRight size={18} />, label: 'Alinear derecha' },
  ],
  [
    { format: 'link', icon: <LinkIcon size={18} />, label: 'Insertar enlace' },
    { format: 'image', icon: <Image size={18} />, label: 'Insertar imagen' },
  ],
];

// ============================================
// RichTextEditor Component
// ============================================

/**
 * RichTextEditor - WYSIWYG rich text editor
 *
 * Features:
 * - Basic text formatting (bold, italic, underline)
 * - Headings and lists
 * - Text alignment
 * - Links and images
 * - Keyboard shortcuts
 * - Undo/redo
 *
 * Usage:
 * <RichTextEditor
 *   value={content}
 *   onChange={setContent}
 *   placeholder="Escribe aquí..."
 * />
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Escribe aquí...',
  minHeight = 150,
  maxHeight = 400,
  className = '',
  disabled = false,
  showToolbar = true,
  toolbarPosition = 'top',
  onImageUpload,
  autoFocus = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // Check active formats
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();

    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikethrough')) formats.add('strikethrough');
    if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
    if (document.queryCommandState('insertOrderedList')) formats.add('ol');
    if (document.queryCommandState('justifyLeft')) formats.add('alignLeft');
    if (document.queryCommandState('justifyCenter')) formats.add('alignCenter');
    if (document.queryCommandState('justifyRight')) formats.add('alignRight');

    setActiveFormats(formats);
  }, []);

  // Execute format command
  const execFormat = useCallback(
    (format: FormatType) => {
      if (disabled) return;

      editorRef.current?.focus();
      triggerHaptic('selection');

      switch (format) {
        case 'bold':
          document.execCommand('bold');
          break;
        case 'italic':
          document.execCommand('italic');
          break;
        case 'underline':
          document.execCommand('underline');
          break;
        case 'strikethrough':
          document.execCommand('strikethrough');
          break;
        case 'h1':
          document.execCommand('formatBlock', false, 'h1');
          break;
        case 'h2':
          document.execCommand('formatBlock', false, 'h2');
          break;
        case 'ul':
          document.execCommand('insertUnorderedList');
          break;
        case 'ol':
          document.execCommand('insertOrderedList');
          break;
        case 'quote':
          document.execCommand('formatBlock', false, 'blockquote');
          break;
        case 'code':
          document.execCommand('formatBlock', false, 'pre');
          break;
        case 'alignLeft':
          document.execCommand('justifyLeft');
          break;
        case 'alignCenter':
          document.execCommand('justifyCenter');
          break;
        case 'alignRight':
          document.execCommand('justifyRight');
          break;
        case 'link':
          saveSelection();
          setShowLinkModal(true);
          break;
        case 'image':
          fileInputRef.current?.click();
          break;
      }

      updateActiveFormats();
      handleChange();
    },
    [disabled, updateActiveFormats]
  );

  // Save current selection
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  // Restore saved selection
  const restoreSelection = () => {
    const selection = window.getSelection();
    if (selection && savedSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
    }
  };

  // Insert link
  const insertLink = useCallback(() => {
    if (!linkUrl) return;

    restoreSelection();
    editorRef.current?.focus();

    const selection = window.getSelection();
    if (selection && selection.toString()) {
      document.execCommand('createLink', false, linkUrl);
    } else {
      document.execCommand('insertHTML', false, `<a href="${linkUrl}" target="_blank">${linkUrl}</a>`);
    }

    setShowLinkModal(false);
    setLinkUrl('');
    handleChange();
  }, [linkUrl]);

  // Handle image upload
  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload) return;

      try {
        const imageUrl = await onImageUpload(file);
        editorRef.current?.focus();
        document.execCommand('insertImage', false, imageUrl);
        handleChange();
        triggerHaptic('success');
      } catch (error) {
        console.error('Image upload failed:', error);
        triggerHaptic('error');
      }

      e.target.value = '';
    },
    [onImageUpload]
  );

  // Handle content change
  const handleChange = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            execFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            execFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            execFormat('underline');
            break;
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              document.execCommand('redo');
            }
            break;
        }
      }
    },
    [execFormat]
  );

  // Handle paste - clean up pasted content
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();

    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleChange();
  }, [handleChange]);

  // Render toolbar
  const renderToolbar = () => (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      {toolbarGroups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {groupIndex > 0 && (
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          )}
          {group.map((button) => (
            <button
              key={button.format}
              onClick={() => execFormat(button.format)}
              disabled={disabled}
              title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
              className={`p-2 rounded transition-colors ${
                activeFormats.has(button.format)
                  ? 'bg-oaxaca-pink text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {button.icon}
            </button>
          ))}
        </React.Fragment>
      ))}

      {/* Undo/Redo */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button
        onClick={() => {
          document.execCommand('undo');
          handleChange();
        }}
        disabled={disabled}
        title="Deshacer (⌘Z)"
        className="p-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={() => {
          document.execCommand('redo');
          handleChange();
        }}
        disabled={disabled}
        title="Rehacer (⌘⇧Z)"
        className="p-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Redo size={18} />
      </button>
    </div>
  );

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 ${
        isFocused ? 'ring-2 ring-oaxaca-pink' : ''
      } ${className}`}
    >
      {/* Toolbar - Top */}
      {showToolbar && toolbarPosition === 'top' && renderToolbar()}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSelect={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        data-placeholder={placeholder}
        className={`p-4 outline-none overflow-auto prose prose-sm dark:prose-invert max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400
          [&_a]:text-oaxaca-pink [&_a]:underline
          [&_blockquote]:border-l-4 [&_blockquote]:border-oaxaca-pink [&_blockquote]:pl-4 [&_blockquote]:italic
          [&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-900 [&_pre]:p-3 [&_pre]:rounded-lg
          [&_img]:max-w-full [&_img]:rounded-lg
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        `}
        style={{ minHeight, maxHeight }}
      />

      {/* Toolbar - Bottom */}
      {showToolbar && toolbarPosition === 'bottom' && renderToolbar()}

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowLinkModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Insertar enlace
            </h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://ejemplo.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-oaxaca-pink"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  insertLink();
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-oaxaca-pink text-white rounded-lg hover:opacity-90"
              >
                Insertar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SimpleTextEditor - Markdown-style editor
// ============================================

interface SimpleTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  showFormatHints?: boolean;
}

export const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Escribe aquí...',
  rows = 4,
  className = '',
  showFormatHints = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newValue =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange?.(newValue);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);

    triggerHaptic('selection');
  };

  return (
    <div className={className}>
      {/* Quick format buttons */}
      <div className="flex items-center gap-1 mb-2">
        <button
          onClick={() => insertFormat('**')}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Negrita"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => insertFormat('*')}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Cursiva"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => insertFormat('[', '](url)')}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Enlace"
        >
          <LinkIcon size={16} />
        </button>
        <button
          onClick={() => insertFormat('`')}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Código"
        >
          <Code size={16} />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-oaxaca-pink resize-none"
      />

      {/* Format hints */}
      {showFormatHints && (
        <p className="text-xs text-gray-400 mt-1">
          **negrita** *cursiva* `código` [enlace](url)
        </p>
      )}
    </div>
  );
};

// ============================================
// Character Counter
// ============================================

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max,
  className = '',
}) => {
  const remaining = max - current;
  const isOverLimit = remaining < 0;
  const isNearLimit = remaining >= 0 && remaining <= 20;

  return (
    <span
      className={`text-xs ${
        isOverLimit
          ? 'text-red-500'
          : isNearLimit
          ? 'text-yellow-500'
          : 'text-gray-400'
      } ${className}`}
    >
      {current}/{max}
    </span>
  );
};

export default RichTextEditor;
