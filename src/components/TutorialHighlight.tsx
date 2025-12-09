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
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Calculer la position et la taille de l'encadrement en s'assurant qu'il reste dans la fenêtre
  let x = targetRect.left - padding;
  let y = targetRect.top - padding;
  let width = targetRect.width + padding * 2;
  let height = targetRect.height + padding * 2;
  
  // Ajuster si l'encadrement dépasse à gauche
  if (x < 0) {
    width += x; // Réduire la largeur
    x = 0;
  }
  
  // Ajuster si l'encadrement dépasse en haut
  if (y < 0) {
    height += y; // Réduire la hauteur
    y = 0;
  }
  
  // Ajuster si l'encadrement dépasse à droite
  if (x + width > viewportWidth) {
    width = viewportWidth - x;
  }
  
  // Ajuster si l'encadrement dépasse en bas
  if (y + height > viewportHeight) {
    height = viewportHeight - y;
  }
  
  const highlightRect = {
    x,
    y,
    width: Math.max(width, targetRect.width), // S'assurer qu'on ne réduit pas en dessous de la taille de l'élément
    height: Math.max(height, targetRect.height),
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
        <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.5)" mask={`url(#${maskId})`} />
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
