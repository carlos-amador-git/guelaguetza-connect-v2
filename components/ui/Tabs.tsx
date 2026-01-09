import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { triggerHaptic } from '../../utils/haptics';

// ============================================
// Types
// ============================================

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

// ============================================
// Context
// ============================================

const TabsContext = createContext<TabsContextType | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs');
  }
  return context;
};

// ============================================
// Tabs Component
// ============================================

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'segmented' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Tabs - Tab navigation component
 *
 * Features:
 * - Multiple visual variants
 * - Animated indicator
 * - Badge support
 * - Keyboard navigation
 * - Controlled/uncontrolled modes
 *
 * Usage:
 * <Tabs
 *   tabs={[{ id: 'home', label: 'Inicio' }, { id: 'profile', label: 'Perfil' }]}
 *   onChange={setActiveTab}
 * >
 *   <TabPanel id="home">Contenido de inicio</TabPanel>
 *   <TabPanel id="profile">Contenido de perfil</TabPanel>
 * </Tabs>
 */
const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = controlledActiveTab ?? internalActiveTab;

  // Update indicator position
  useEffect(() => {
    const activeElement = tabRefs.current.get(activeTab);
    if (activeElement && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeElement.getBoundingClientRect();

      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab, tabs]);

  const handleTabClick = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab?.disabled) return;

      setInternalActiveTab(tabId);
      onChange?.(tabId);
      triggerHaptic('selection');
    },
    [tabs, onChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const enabledTabs = tabs.filter((t) => !t.disabled);
      const currentEnabledIndex = enabledTabs.findIndex((t) => t.id === tabs[currentIndex].id);

      let newIndex = currentEnabledIndex;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = enabledTabs.length - 1;
          break;
        default:
          return;
      }

      const newTab = enabledTabs[newIndex];
      handleTabClick(newTab.id);
      tabRefs.current.get(newTab.id)?.focus();
    },
    [tabs, handleTabClick]
  );

  const sizes = {
    sm: 'text-sm py-2 px-3',
    md: 'text-sm py-2.5 px-4',
    lg: 'text-base py-3 px-5',
  };

  const getTabStyles = (tab: Tab, isActive: boolean) => {
    const base = `relative font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-oaxaca-pink ${
      sizes[size]
    } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;

    switch (variant) {
      case 'pills':
        return `${base} rounded-full ${
          isActive
            ? 'bg-oaxaca-pink text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`;
      case 'segmented':
        return `${base} ${
          isActive
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400'
        }`;
      case 'bordered':
        return `${base} border-2 rounded-lg ${
          isActive
            ? 'border-oaxaca-pink text-oaxaca-pink bg-oaxaca-pink/5'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
        }`;
      default: // underline
        return `${base} ${
          isActive
            ? 'text-oaxaca-pink'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`;
    }
  };

  const containerStyles = {
    underline: 'border-b border-gray-200 dark:border-gray-700',
    pills: 'gap-2',
    segmented: 'bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1',
    bordered: 'gap-2',
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabClick }}>
      <div className={className}>
        {/* Tab list */}
        <div
          ref={containerRef}
          role="tablist"
          className={`relative flex ${fullWidth ? 'w-full' : 'inline-flex'} ${containerStyles[variant]}`}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
              }}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={tab.disabled}
              className={`${getTabStyles(tab, activeTab === tab.id)} ${
                fullWidth ? 'flex-1 justify-center' : ''
              } flex items-center gap-2`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? variant === 'pills'
                        ? 'bg-white/20 text-white'
                        : 'bg-oaxaca-pink/10 text-oaxaca-pink'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}

          {/* Animated indicator for underline variant */}
          {variant === 'underline' && (
            <div
              className="absolute bottom-0 h-0.5 bg-oaxaca-pink transition-all duration-200"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
          )}
        </div>

        {/* Tab panels */}
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// ============================================
// TabPanel Component
// ============================================

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  id,
  children,
  className = '',
}) => {
  const { activeTab } = useTabsContext();

  if (activeTab !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={`animate-in fade-in duration-200 ${className}`}
    >
      {children}
    </div>
  );
};

// ============================================
// SegmentedControl Component
// ============================================

interface SegmentedControlProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const activeIndex = options.findIndex((opt) => opt.value === value);
    const buttons = containerRef.current.querySelectorAll('button');
    const activeButton = buttons[activeIndex];

    if (activeButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [value, options]);

  const sizes = {
    sm: 'text-xs py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5',
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {/* Animated background */}
      <div
        className="absolute top-1 bottom-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-all duration-200"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            onChange(option.value);
            triggerHaptic('selection');
          }}
          className={`relative z-10 flex items-center justify-center gap-2 font-medium transition-colors ${
            sizes[size]
          } ${fullWidth ? 'flex-1' : ''} ${
            value === option.value
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// ScrollableTabs Component
// ============================================

interface ScrollableTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const ScrollableTabs: React.FC<ScrollableTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      if (tabRect.left < containerRect.left) {
        container.scrollLeft -= containerRect.left - tabRect.left + 20;
      } else if (tabRect.right > containerRect.right) {
        container.scrollLeft += tabRect.right - containerRect.right + 20;
      }
    }
  }, [activeTab]);

  return (
    <div
      ref={scrollRef}
      className={`flex overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={activeTab === tab.id ? activeTabRef : null}
          onClick={() => {
            onChange(tab.id);
            triggerHaptic('selection');
          }}
          disabled={tab.disabled}
          className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'border-oaxaca-pink text-oaxaca-pink'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                {tab.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// useTabs Hook
// ============================================

export const useTabs = (initialTab: string) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return {
    activeTab,
    setActiveTab: handleChange,
    tabProps: {
      activeTab,
      onChange: handleChange,
    },
  };
};

export default Tabs;
