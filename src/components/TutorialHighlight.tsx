import React, { useEffect, useState, useRef } from 'react';
import './TutorialHighlight.css';

interface TutorialHighlightProps {
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  show?: boolean;
}

export function TutorialHighlight({ targetSelector, position = 'bottom', show = true }: TutorialHighlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateTarget = () => {
      let element: Element | null = null;
      
      if (targetSelector === '.list-item-name' || targetSelector === '.list-item') {
        const selected = document.querySelector('.list-item.selected');
        if (selected) {
          if (targetSelector === '.list-item-name') {
            element = selected.querySelector('.list-item-name');
          } else {
            element = selected;
          }
        } else {
          element = document.querySelector(targetSelector);
        }
      } else if (targetSelector === '.list-item-visibility') {
        const selected = document.querySelector('.list-item.selected');
        if (selected) {
          element = selected.querySelector('.list-item-visibility');
        } else {
          element = document.querySelector(targetSelector);
        }
      } else {
        element = document.querySelector(targetSelector);
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
        }
      }
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    const interval = setInterval(updateTarget, 200);

    return () => {
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
      clearInterval(interval);
    };
  }, [targetSelector, show]);

  if (!show || !targetRect) {
    return null;
  }

  const padding = 8;
  const highlightRect = {
    x: targetRect.left - padding,
    y: targetRect.top - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  let arrowStyle: React.CSSProperties = {};
  const arrowSize = 12;

  switch (position) {
    case 'top':
      arrowStyle = {
        bottom: -arrowSize * 2,
        left: '50%',
        transform: 'translateX(-50%)',
        borderTopColor: 'var(--accent)',
        borderBottom: 'none',
        borderLeft: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid transparent`,
        borderTop: `${arrowSize}px solid var(--accent)`,
      };
      break;
    case 'bottom':
      arrowStyle = {
        top: -arrowSize * 2,
        left: '50%',
        transform: 'translateX(-50%)',
        borderBottomColor: 'var(--accent)',
        borderTop: 'none',
        borderLeft: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid var(--accent)`,
      };
      break;
    case 'left':
      arrowStyle = {
        right: -arrowSize * 2,
        top: '50%',
        transform: 'translateY(-50%)',
        borderLeftColor: 'var(--accent)',
        borderRight: 'none',
        borderTop: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid transparent`,
        borderLeft: `${arrowSize}px solid var(--accent)`,
      };
      break;
    case 'right':
      arrowStyle = {
        left: -arrowSize * 2,
        top: '50%',
        transform: 'translateY(-50%)',
        borderRightColor: 'var(--accent)',
        borderLeft: 'none',
        borderTop: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid var(--accent)`,
      };
      break;
  }

  const maskId = `tutorial-mask-${targetSelector?.replace(/[^a-zA-Z0-9]/g, '-') || 'default'}`;

  return (
    <div ref={overlayRef} className="tutorial-overlay">
      <svg className="tutorial-spotlight" width="100%" height="100%">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="black" />
            <rect
              x={highlightRect.x}
              y={highlightRect.y}
              width={highlightRect.width}
              height={highlightRect.height}
              fill="white"
              rx="8"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.3)" mask={`url(#${maskId})`} />
      </svg>
      <div
        className="tutorial-highlight-box"
        style={{
          left: `${highlightRect.x}px`,
          top: `${highlightRect.y}px`,
          width: `${highlightRect.width}px`,
          height: `${highlightRect.height}px`,
        }}
      >
        <div className="tutorial-highlight-glow" />
        <div className="tutorial-arrow" style={arrowStyle} />
      </div>
    </div>
  );
}
