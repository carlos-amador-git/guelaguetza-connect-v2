import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

type AccordionType = 'single' | 'multiple';
type AccordionIconType = 'chevron' | 'plus' | 'none';

// ============================================
// Context
// ============================================

interface AccordionContextType {
  openItems: string[];
  toggleItem: (id: string) => void;
  type: AccordionType;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionItem must be used within Accordion');
  }
  return context;
};

// ============================================
// Accordion Component
// ============================================

interface AccordionProps {
  children: React.ReactNode;
  type?: AccordionType;
  defaultOpen?: string[];
  className?: string;
}

/**
 * Accordion - Contenido expandible/colapsable
 *
 * Features:
 * - Modo único o múltiple
 * - Animaciones suaves
 * - Iconos configurables
 * - Accesibilidad completa
 *
 * Usage:
 * <Accordion>
 *   <AccordionItem id="1" title="Pregunta 1">
 *     Respuesta 1
 *   </AccordionItem>
 *   <AccordionItem id="2" title="Pregunta 2">
 *     Respuesta 2
 *   </AccordionItem>
 * </Accordion>
 */
const Accordion: React.FC<AccordionProps> = ({
  children,
  type = 'single',
  defaultOpen = [],
  className = '',
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggleItem = useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        if (type === 'single') {
          return prev.includes(id) ? [] : [id];
        }
        return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      });
      triggerHaptic('selection');
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={`divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// ============================================
// AccordionItem Component
// ============================================

interface AccordionItemProps {
  id: string;
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  iconType?: AccordionIconType;
  disabled?: boolean;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  children,
  subtitle,
  icon,
  iconType = 'chevron',
  disabled = false,
  className = '',
}) => {
  const { openItems, toggleItem } = useAccordionContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const isOpen = openItems.includes(id);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  const handleToggle = () => {
    if (!disabled) {
      toggleItem(id);
    }
  };

  const renderIcon = () => {
    if (iconType === 'none') return null;

    if (iconType === 'plus') {
      return isOpen ? (
        <Minus size={20} className="text-oaxaca-pink" />
      ) : (
        <Plus size={20} className="text-gray-400" />
      );
    }

    return (
      <ChevronDown
        size={20}
        className={`transform transition-transform duration-200 ${
          isOpen ? 'rotate-180 text-oaxaca-pink' : 'text-gray-400'
        }`}
      />
    );
  };

  return (
    <div className={className}>
      <button
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${id}`}
        className={`w-full flex items-center justify-between py-4 text-left transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <div>
            <span
              className={`font-medium ${
                isOpen ? 'text-oaxaca-pink' : 'text-gray-900 dark:text-white'
              }`}
            >
              {title}
            </span>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        {renderIcon()}
      </button>

      <div
        id={`accordion-content-${id}`}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? height : 0 }}
      >
        <div ref={contentRef} className="pb-4 text-gray-600 dark:text-gray-400">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Collapsible Component
// ============================================

interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
  className = '',
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;

  const toggle = useCallback(() => {
    const newValue = !isOpen;
    setInternalOpen(newValue);
    onOpenChange?.(newValue);
    triggerHaptic('selection');
  }, [isOpen, onOpenChange]);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child as React.ReactElement<CollapsibleTriggerProps>, {
              onClick: toggle,
              isOpen,
            });
          }
          if (child.type === CollapsibleContent) {
            return React.cloneElement(child as React.ReactElement<CollapsibleContentProps>, {
              isOpen,
            });
          }
        }
        return child;
      })}
    </div>
  );
};

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  isOpen?: boolean;
  className?: string;
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
  children,
  onClick,
  isOpen,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      aria-expanded={isOpen}
      className={`w-full text-left ${className}`}
    >
      {typeof children === 'function'
        ? (children as (props: { isOpen: boolean }) => React.ReactNode)({ isOpen: !!isOpen })
        : children}
    </button>
  );
};

interface CollapsibleContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
  isOpen,
  className = '',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${className}`}
      style={{ maxHeight: isOpen ? height : 0 }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

// ============================================
// FAQ Component
// ============================================

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FAQProps {
  items: FAQItem[];
  showCategories?: boolean;
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({
  items,
  showCategories = false,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = showCategories
    ? [...new Set(items.map((item) => item.category).filter(Boolean))]
    : [];

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  return (
    <div className={className}>
      {showCategories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-oaxaca-pink text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category || null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-oaxaca-pink text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <Accordion type="single">
        {filteredItems.map((item) => (
          <AccordionItem key={item.id} id={item.id} title={item.question}>
            <p className="text-sm leading-relaxed">{item.answer}</p>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

// ============================================
// ExpandableCard Component
// ============================================

interface ExpandableCardProps {
  title: string;
  preview: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  preview,
  children,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  const toggle = () => {
    setIsExpanded(!isExpanded);
    triggerHaptic('selection');
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{preview}</div>
          </div>
          <button
            onClick={toggle}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronDown
              size={20}
              className={`transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              } text-gray-400`}
            />
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? height : 0 }}
      >
        <div
          ref={contentRef}
          className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ExpandableText Component
// ============================================

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLines = 3,
  expandLabel = 'Ver más',
  collapseLabel = 'Ver menos',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight);
      const maxHeight = lineHeight * maxLines;
      setNeedsExpansion(textRef.current.scrollHeight > maxHeight);
    }
  }, [text, maxLines]);

  const toggle = () => {
    setIsExpanded(!isExpanded);
    triggerHaptic('light');
  };

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={`text-gray-600 dark:text-gray-400 transition-all duration-300 ${
          !isExpanded && needsExpansion ? `line-clamp-${maxLines}` : ''
        }`}
        style={!isExpanded && needsExpansion ? { WebkitLineClamp: maxLines } : undefined}
      >
        {text}
      </p>
      {needsExpansion && (
        <button
          onClick={toggle}
          className="mt-2 text-sm text-oaxaca-pink hover:text-oaxaca-pink/80 font-medium"
        >
          {isExpanded ? collapseLabel : expandLabel}
        </button>
      )}
    </div>
  );
};

// ============================================
// useCollapsible Hook
// ============================================

export const useCollapsible = (defaultOpen = false) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    setIsOpen((v) => !v);
    triggerHaptic('selection');
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    collapsibleProps: {
      open: isOpen,
      onOpenChange: setIsOpen,
    },
  };
};

// ============================================
// CollapsibleSection Component
// ============================================

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  badge,
  actions,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div className={className}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          triggerHaptic('selection');
        }}
        className="w-full flex items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          />
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-oaxaca-pink transition-colors">
            {title}
          </h3>
          {badge}
        </div>
        {actions && (
          <div onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? height : 0 }}
      >
        <div ref={contentRef} className="pl-6 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Details Component (Native-like)
// ============================================

interface DetailsProps {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Details: React.FC<DetailsProps> = ({
  summary,
  children,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          triggerHaptic('selection');
        }}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white">{summary}</span>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? height : 0 }}
      >
        <div ref={contentRef} className="p-4 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TreeView Component
// ============================================

interface TreeNode {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
}

interface TreeViewProps {
  data: TreeNode[];
  defaultExpandedKeys?: string[];
  selectedKey?: string;
  onSelect?: (key: string) => void;
  showLines?: boolean;
  className?: string;
}

export const TreeView: React.FC<TreeViewProps> = ({
  data,
  defaultExpandedKeys = [],
  selectedKey,
  onSelect,
  showLines = true,
  className = '',
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(defaultExpandedKeys));

  const toggleNode = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
    triggerHaptic('selection');
  };

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.key);
    const isSelected = selectedKey === node.key;

    return (
      <div key={node.key}>
        <div
          className={`flex items-center gap-1 py-1.5 ${level > 0 ? 'ml-4' : ''}`}
          style={{ paddingLeft: level > 0 && showLines ? 12 : 0 }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.key)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
              />
            </button>
          ) : (
            <span className="w-5" />
          )}

          <button
            onClick={() => {
              if (!node.disabled && onSelect) {
                onSelect(node.key);
                triggerHaptic('selection');
              }
            }}
            disabled={node.disabled}
            className={`
              flex-1 flex items-center gap-2 px-2 py-1 rounded-lg text-left text-sm
              ${isSelected
                ? 'bg-oaxaca-pink/10 text-oaxaca-pink'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
              ${node.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              transition-colors
            `}
          >
            {node.icon && <span className="w-4 h-4 flex-shrink-0">{node.icon}</span>}
            {node.label}
          </button>
        </div>

        {hasChildren && (
          <div
            className={`overflow-hidden transition-all duration-200 ${
              isExpanded ? 'max-h-[9999px]' : 'max-h-0'
            } ${showLines ? 'border-l border-gray-200 dark:border-gray-700 ml-2' : ''}`}
          >
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {data.map(node => renderNode(node))}
    </div>
  );
};

// ============================================
// Collapse Utility
// ============================================

interface CollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Collapse: React.FC<CollapseProps> = ({
  isOpen,
  children,
  className = '',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${className}`}
      style={{ maxHeight: isOpen ? height : 0 }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default Accordion;
