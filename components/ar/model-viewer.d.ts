import 'react';

// Extend React's JSX intrinsic elements to include the model-viewer web component
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          'ios-src'?: string;
          poster?: string;
          alt?: string;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          'camera-controls'?: boolean;
          'camera-orbit'?: string;
          'touch-action'?: string;
          'auto-rotate'?: boolean;
          'auto-rotate-delay'?: string;
          'interaction-prompt'?: string;
          'environment-image'?: string;
          'tone-mapping'?: string;
          exposure?: string;
          ar?: boolean;
          'ar-modes'?: string;
          'ar-scale'?: string;
          'ar-placement'?: string;
          loading?: 'auto' | 'lazy' | 'eager';
          reveal?: 'auto' | 'interaction' | 'manual';
        },
        HTMLElement
      >;
    }
  }
}
