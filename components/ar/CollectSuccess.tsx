import React from 'react';

// ============================================================================
// COMPONENT: CollectSuccess
// CSS-only confetti celebration shown after collecting an AR point.
// Auto-dismisses after 2 seconds.
// ============================================================================

interface CollectSuccessProps {
  pointsEarned?: number;
  onDismiss?: () => void;
}

// 8 colored circles at different positions + velocities, all pure CSS
const CONFETTI_DOTS = [
  { color: '#E63946', tx: '-60px', ty: '-80px', delay: '0ms' },
  { color: '#F4A261', tx: '50px',  ty: '-90px', delay: '40ms' },
  { color: '#2A9D8F', tx: '-40px', ty: '-50px', delay: '80ms' },
  { color: '#E9C46A', tx: '70px',  ty: '-60px', delay: '20ms' },
  { color: '#264653', tx: '-70px', ty: '-40px', delay: '60ms' },
  { color: '#A8DADC', tx: '55px',  ty: '-75px', delay: '100ms' },
  { color: '#E76F51', tx: '-50px', ty: '-65px', delay: '30ms' },
  { color: '#457B9D', tx: '65px',  ty: '-45px', delay: '70ms' },
];

export function CollectSuccess({ pointsEarned = 25, onDismiss }: CollectSuccessProps) {
  // Auto-dismiss after 2 s
  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss?.(), 2000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <>
      <style>{`
        @keyframes cs-burst {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--cs-tx), var(--cs-ty)) scale(0); opacity: 0; }
        }
        @keyframes cs-pop {
          0%   { transform: scale(0); opacity: 0; }
          50%  { transform: scale(1.25); opacity: 1; }
          80%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        .cs-dot {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: cs-burst 0.9s ease-out forwards;
        }
        .cs-label {
          animation: cs-pop 2s ease-in-out forwards;
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        aria-label={`+${pointsEarned} puntos ganados`}
        data-testid="collect-success"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        {/* Confetti dots */}
        <div style={{ position: 'relative', width: 0, height: 0 }}>
          {CONFETTI_DOTS.map((dot, i) => (
            <span
              key={i}
              className="cs-dot"
              style={{
                backgroundColor: dot.color,
                // CSS custom properties consumed by the keyframe
                ['--cs-tx' as string]: dot.tx,
                ['--cs-ty' as string]: dot.ty,
                animationDelay: dot.delay,
                top: '-6px',
                left: '-6px',
              }}
              aria-hidden="true"
            />
          ))}

          {/* Points label */}
          <div
            className="cs-label"
            style={{
              position: 'absolute',
              top: '-48px',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: '28px',
              fontWeight: 900,
              color: '#16a34a',
              textShadow: '0 2px 8px rgba(0,0,0,0.18)',
              letterSpacing: '-0.5px',
            }}
          >
            +{pointsEarned} pts
          </div>
        </div>
      </div>
    </>
  );
}

export default CollectSuccess;
