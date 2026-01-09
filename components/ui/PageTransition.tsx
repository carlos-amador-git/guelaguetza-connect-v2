import React, { useEffect, useState, useRef } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  type?: 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  duration?: number;
  delay?: number;
}

/**
 * PageTransition - Wrapper component for animated page/view transitions
 *
 * Usage:
 * <PageTransition type="slide-up">
 *   <YourViewContent />
 * </PageTransition>
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  type = 'fade',
  duration = 300,
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransformStyles = () => {
    const baseStyles: React.CSSProperties = {
      transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
    };

    if (!isVisible) {
      switch (type) {
        case 'slide-up':
          return { ...baseStyles, opacity: 0, transform: 'translateY(20px)' };
        case 'slide-left':
          return { ...baseStyles, opacity: 0, transform: 'translateX(20px)' };
        case 'slide-right':
          return { ...baseStyles, opacity: 0, transform: 'translateX(-20px)' };
        case 'scale':
          return { ...baseStyles, opacity: 0, transform: 'scale(0.95)' };
        case 'fade':
          return { ...baseStyles, opacity: 0 };
        case 'none':
          return {};
        default:
          return { ...baseStyles, opacity: 0 };
      }
    }

    return { ...baseStyles, opacity: 1, transform: 'none' };
  };

  return (
    <div ref={elementRef} style={getTransformStyles()} className={className}>
      {children}
    </div>
  );
};

/**
 * AnimatedList - Renders children with staggered animations
 */
interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  type?: 'fade' | 'slide-up' | 'slide-left' | 'scale';
  className?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 50,
  type = 'slide-up',
  className = '',
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <PageTransition key={index} type={type} delay={index * staggerDelay}>
          {child}
        </PageTransition>
      ))}
    </div>
  );
};

/**
 * FadeIn - Simple fade-in animation wrapper
 */
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  className = '',
}) => (
  <PageTransition type="fade" delay={delay} duration={duration} className={className}>
    {children}
  </PageTransition>
);

/**
 * SlideUp - Slide up animation wrapper
 */
export const SlideUp: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  className = '',
}) => (
  <PageTransition type="slide-up" delay={delay} duration={duration} className={className}>
    {children}
  </PageTransition>
);

/**
 * ScaleIn - Scale in animation wrapper
 */
export const ScaleIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 200,
  className = '',
}) => (
  <PageTransition type="scale" delay={delay} duration={duration} className={className}>
    {children}
  </PageTransition>
);

/**
 * useAnimateOnMount - Hook for triggering animations on mount
 */
export const useAnimateOnMount = (delay = 0) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return isAnimated;
};

/**
 * useIntersectionAnimation - Hook for triggering animations when element enters viewport
 */
export const useIntersectionAnimation = (options?: IntersectionObserverInit) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
};

export default PageTransition;
