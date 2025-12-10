import { useEffect, useState, useRef } from 'react';
import './TutorialHighlight.css';

interface TutorialHighlightProps {
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  show?: boolean;
}

export function TutorialHighlight({ targetSelector, show = true }: TutorialHighlightProps) {
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
  const minPadding = 4; // Padding minimum par rapport aux bords de la fenêtre
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculer le rectangle du highlight avec padding
  let highlightX = targetRect.left - padding;
  let highlightY = targetRect.top - padding;
  let highlightWidth = targetRect.width + padding * 2;
  let highlightHeight = targetRect.height + padding * 2;

  // Clamp pour rester dans le viewport avec un minimum de padding
  // Ajuster X
  if (highlightX < minPadding) {
    const overflow = minPadding - highlightX;
    highlightX = minPadding;
    highlightWidth = Math.max(targetRect.width, highlightWidth - overflow);
  }
  if (highlightX + highlightWidth > viewportWidth - minPadding) {
    highlightWidth = viewportWidth - minPadding - highlightX;
  }

  // Ajuster Y
  if (highlightY < minPadding) {
    const overflow = minPadding - highlightY;
    highlightY = minPadding;
    highlightHeight = Math.max(targetRect.height, highlightHeight - overflow);
  }
  if (highlightY + highlightHeight > viewportHeight - minPadding) {
    highlightHeight = viewportHeight - minPadding - highlightY;
  }

  // Assurer des dimensions minimales
  highlightWidth = Math.max(40, highlightWidth);
  highlightHeight = Math.max(30, highlightHeight);

  const highlightRect = {
    x: highlightX,
    y: highlightY,
    width: highlightWidth,
    height: highlightHeight,
  };

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
        <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.4)" mask={`url(#${maskId})`} />
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
      </div>
    </div>
  );
}
