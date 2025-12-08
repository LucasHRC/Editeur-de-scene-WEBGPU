import { useState, useEffect, useCallback, useRef } from 'react';
import { tutorialSteps } from '../data/tutorialSteps';
import { TutorialHighlight } from './TutorialHighlight';
import { useScene } from '../hooks/useScene';
import './Tutorial.css';

interface TutorialProps {
  onClose: () => void;
  onSkip: () => void;
}

export function Tutorial({ onClose, onSkip }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { scene, addSphere, selectObject } = useScene();
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  useEffect(() => {
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }

    if (!step.action) return;

    actionTimeoutRef.current = setTimeout(() => {
      step.action?.();
    }, 300);

    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
    };
  }, [currentStep, step]);

  useEffect(() => {
    const executeStepAction = () => {
      switch (step.id) {
        case 'sidebar':
          if (scene.spheres.length === 0 && scene.boxes.length === 0) {
            setTimeout(() => {
              addSphere();
            }, 600);
          }
          break;
        case 'viewport-select':
          if (scene.spheres.length > 0 && !scene.selectedId) {
            setTimeout(() => {
              selectObject(scene.spheres[0].id, 'sphere');
            }, 600);
          } else if (scene.boxes.length > 0 && !scene.selectedId) {
            setTimeout(() => {
              selectObject(scene.boxes[0].id, 'box');
            }, 600);
          }
          break;
        case 'inspector':
        case 'rename':
        case 'context-menu':
        case 'visibility':
          if (scene.spheres.length > 0 && !scene.selectedId) {
            setTimeout(() => {
              selectObject(scene.spheres[0].id, 'sphere');
            }, 400);
          } else if (scene.boxes.length > 0 && !scene.selectedId) {
            setTimeout(() => {
              selectObject(scene.boxes[0].id, 'box');
            }, 400);
          }
          break;
      }
    };

    const timer = setTimeout(executeStepAction, 500);
    return () => clearTimeout(timer);
  }, [step.id, scene, addSphere, selectObject]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
      return;
    }
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsAnimating(false);
    }, 200);
  }, [isLastStep]);

  const handlePrevious = useCallback(() => {
    if (isFirstStep) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setIsAnimating(false);
    }, 200);
  }, [isFirstStep]);

  const handleComplete = useCallback(() => {
    localStorage.setItem('tutorial-completed', 'true');
    onClose();
  }, [onClose]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('tutorial-completed', 'true');
    onSkip();
  }, [onSkip]);

  if (!step) return null;

  return (
    <>
      {step.showHighlight && step.target && (
        <TutorialHighlight
          targetSelector={step.target}
          position={step.position}
          show={!isAnimating}
        />
      )}
      <div className={`tutorial-modal ${isAnimating ? 'animating' : ''}`}>
        <div className="tutorial-backdrop" />
        <div className={`tutorial-dialog tutorial-position-${step.position || 'center'}`} onClick={(e) => e.stopPropagation()}>
          <div className="tutorial-header">
            <h2 className="tutorial-title">{step.title}</h2>
            <div className="tutorial-progress">
              {currentStep + 1} / {tutorialSteps.length}
            </div>
          </div>
          
          <div className="tutorial-content">
            <p>{step.content}</p>
          </div>

          <div className="tutorial-footer">
            <div className="tutorial-actions-left">
              {!isFirstStep && (
                <button className="tutorial-btn tutorial-btn-secondary" onClick={handlePrevious}>
                  Précédent
                </button>
              )}
            </div>
            
            <div className="tutorial-actions-center">
              <button className="tutorial-btn tutorial-btn-skip" onClick={handleSkip}>
                Passer
              </button>
            </div>

            <div className="tutorial-actions-right">
              {isLastStep ? (
                <button className="tutorial-btn tutorial-btn-primary" onClick={handleComplete}>
                  Terminer
                </button>
              ) : (
                <button className="tutorial-btn tutorial-btn-primary" onClick={handleNext}>
                  Suivant
                </button>
              )}
            </div>
          </div>

          <div className="tutorial-progress-bar">
            <div
              className="tutorial-progress-fill"
              style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
