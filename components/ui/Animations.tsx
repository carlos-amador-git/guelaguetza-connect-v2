import React, { useRef, useEffect, useState, useCallback, createContext, useContext } from 'react';
import { usePrefersReducedMotion } from '../../utils/accessibility';

// ============================================
// Parallax Effect
// ============================================

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
  className?: string;
  disabled?: boolean;
}

/**
 * Parallax - Scroll-based parallax effect
 *
 * Usage:
 * <Parallax speed={0.5}>
 *   <img src="background.jpg" />
 * </Parallax>
 */
export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  direction = 'up',
  className = '',
  disabled = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (disabled || prefersReducedMotion) return;

    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate how far element is from center of viewport
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distanceFromCenter = elementCenter - viewportCenter;

      // Calculate parallax offset
      const parallaxOffset = distanceFromCenter * speed * (direction === 'up' ? -1 : 1);
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, direction, disabled, prefersReducedMotion]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <div
        style={{
          transform: prefersReducedMotion || disabled ? 'none' : `translateY(${offset}px)`,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================
// Shared Element Transition Context
// ============================================

interface SharedElement {
  id: string;
  rect: DOMRect;
  element: HTMLElement;
}

interface SharedTransitionContextType {
  registerElement: (id: string, element: HTMLElement) => void;
  unregisterElement: (id: string) => void;
  getElement: (id: string) => SharedElement | undefined;
  startTransition: (id: string) => void;
  elements: Map<string, SharedElement>;
}

const SharedTransitionContext = createContext<SharedTransitionContextType | null>(null);

export const SharedTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const elementsRef = useRef<Map<string, SharedElement>>(new Map());
  const [, forceUpdate] = useState({});

  const registerElement = useCallback((id: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    elementsRef.current.set(id, { id, rect, element });
    forceUpdate({});
  }, []);

  const unregisterElement = useCallback((id: string) => {
    elementsRef.current.delete(id);
    forceUpdate({});
  }, []);

  const getElement = useCallback((id: string) => {
    return elementsRef.current.get(id);
  }, []);

  const startTransition = useCallback((id: string) => {
    const element = elementsRef.current.get(id);
    if (element) {
      // Update rect before transition
      element.rect = element.element.getBoundingClientRect();
    }
  }, []);

  return (
    <SharedTransitionContext.Provider
      value={{
        registerElement,
        unregisterElement,
        getElement,
        startTransition,
        elements: elementsRef.current,
      }}
    >
      {children}
    </SharedTransitionContext.Provider>
  );
};

export const useSharedTransition = () => {
  const context = useContext(SharedTransitionContext);
  if (!context) {
    throw new Error('useSharedTransition must be used within SharedTransitionProvider');
  }
  return context;
};

// ============================================
// SharedElement Component
// ============================================

interface SharedElementProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const SharedElement: React.FC<SharedElementProps> = ({ id, children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { registerElement, unregisterElement, getElement } = useSharedTransition();
  const [animating, setAnimating] = useState(false);
  const [initialRect, setInitialRect] = useState<DOMRect | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!ref.current) return;

    // Check if there's a previous element with same ID
    const previousElement = getElement(id);

    if (previousElement && !prefersReducedMotion) {
      // Start animation from previous position
      setInitialRect(previousElement.rect);
      setAnimating(true);

      // End animation after duration
      const timeout = setTimeout(() => {
        setAnimating(false);
        setInitialRect(null);
      }, 300);

      return () => clearTimeout(timeout);
    }

    // Register this element
    registerElement(id, ref.current);

    return () => {
      unregisterElement(id);
    };
  }, [id, registerElement, unregisterElement, getElement, prefersReducedMotion]);

  const getAnimationStyle = (): React.CSSProperties => {
    if (!animating || !initialRect || !ref.current) return {};

    const currentRect = ref.current.getBoundingClientRect();

    const translateX = initialRect.left - currentRect.left;
    const translateY = initialRect.top - currentRect.top;
    const scaleX = initialRect.width / currentRect.width;
    const scaleY = initialRect.height / currentRect.height;

    return {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
      transformOrigin: 'top left',
    };
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...getAnimationStyle(),
        transition: animating ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// Stagger Animation
// ============================================

interface StaggerProps {
  children: React.ReactNode[];
  delay?: number;
  duration?: number;
  className?: string;
}

export const Stagger: React.FC<StaggerProps> = ({
  children,
  delay = 50,
  duration = 300,
  className = '',
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          style={{
            opacity: prefersReducedMotion ? 1 : 0,
            transform: prefersReducedMotion ? 'none' : 'translateY(20px)',
            animation: prefersReducedMotion
              ? 'none'
              : `staggerFadeIn ${duration}ms ease-out ${index * delay}ms forwards`,
          }}
        >
          {child}
        </div>
      ))}
      <style>{`
        @keyframes staggerFadeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================
// Morph Animation
// ============================================

interface MorphProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  duration?: number;
}

export const Morph: React.FC<MorphProps> = ({
  isActive,
  children,
  className = '',
  activeClassName = '',
  duration = 300,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={`${className} ${isActive ? activeClassName : ''}`}
      style={{
        transition: prefersReducedMotion ? 'none' : `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// Reveal on Scroll
// ============================================

interface RevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 500,
  threshold = 0.1,
  className = '',
  once = true,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, once, prefersReducedMotion]);

  const getTransform = () => {
    if (isVisible || prefersReducedMotion) return 'none';

    switch (direction) {
      case 'up':
        return 'translateY(40px)';
      case 'down':
        return 'translateY(-40px)';
      case 'left':
        return 'translateX(40px)';
      case 'right':
        return 'translateX(-40px)';
      default:
        return 'none';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// Spring Animation
// ============================================

interface SpringProps {
  children: React.ReactNode;
  isActive: boolean;
  from?: React.CSSProperties;
  to?: React.CSSProperties;
  config?: {
    tension?: number;
    friction?: number;
  };
  className?: string;
}

export const Spring: React.FC<SpringProps> = ({
  children,
  isActive,
  from = { opacity: 0, transform: 'scale(0.9)' },
  to = { opacity: 1, transform: 'scale(1)' },
  config = { tension: 300, friction: 20 },
  className = '',
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Convert spring config to CSS timing
  const duration = Math.round(1000 / Math.sqrt(config.tension / config.friction));

  return (
    <div
      className={className}
      style={{
        ...(isActive ? to : from),
        transition: prefersReducedMotion
          ? 'none'
          : `all ${duration}ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// Pulse Animation
// ============================================

interface PulseProps {
  children: React.ReactNode;
  isActive?: boolean;
  scale?: number;
  duration?: number;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  isActive = true,
  scale = 1.05,
  duration = 1000,
  className = '',
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion || !isActive) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      style={{
        animation: `pulse ${duration}ms ease-in-out infinite`,
      }}
    >
      {children}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(${scale}); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// Shake Animation
// ============================================

interface ShakeProps {
  children: React.ReactNode;
  isActive: boolean;
  intensity?: number;
  duration?: number;
  className?: string;
}

export const Shake: React.FC<ShakeProps> = ({
  children,
  isActive,
  intensity = 10,
  duration = 500,
  className = '',
}) => {
  const [shaking, setShaking] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (isActive && !prefersReducedMotion) {
      setShaking(true);
      const timeout = setTimeout(() => setShaking(false), duration);
      return () => clearTimeout(timeout);
    }
  }, [isActive, duration, prefersReducedMotion]);

  return (
    <div
      className={className}
      style={{
        animation: shaking ? `shake ${duration}ms ease-in-out` : 'none',
      }}
    >
      {children}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-${intensity}px); }
          20%, 40%, 60%, 80% { transform: translateX(${intensity}px); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// Number Counter Animation
// ============================================

interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  duration = 1000,
  formatter = (v) => Math.round(v).toString(),
  className = '',
}) => {
  const [value, setValue] = useState(from);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(to);
      return;
    }

    const startTime = Date.now();
    const difference = to - from;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(from + difference * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [from, to, duration, prefersReducedMotion]);

  return <span className={className}>{formatter(value)}</span>;
};

// ============================================
// Typing Animation
// ============================================

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 50,
  delay = 0,
  className = '',
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(text);
      onComplete?.();
      return;
    }

    let index = 0;
    setDisplayedText('');

    const startTyping = setTimeout(() => {
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTyping);
  }, [text, speed, delay, onComplete, prefersReducedMotion]);

  return (
    <span className={className}>
      {displayedText}
      {displayedText.length < text.length && !prefersReducedMotion && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

export default {
  Parallax,
  SharedTransitionProvider,
  SharedElement,
  Stagger,
  Morph,
  Reveal,
  Spring,
  Pulse,
  Shake,
  Counter,
  Typewriter,
};
