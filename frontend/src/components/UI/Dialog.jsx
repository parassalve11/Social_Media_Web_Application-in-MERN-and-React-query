import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { Loader2 } from 'lucide-react';

const Dialog = ({
  isOpen,
  onClose,
  headline,
  description,
  actionText,
  onAction,
  variant = 'default',
  actionIcon = null,
  isLoading,
  children,
}) => {
  const dialogRef = useRef(null);
  const overlayRef = useRef(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (isOpen) {
      // Set isAnimating to true to disable pointer events during animation
      isAnimating.current = true;
      if (dialogRef.current && overlayRef.current) {
        // Ensure dialog starts with no pointer events
        gsap.set(dialogRef.current, { pointerEvents: 'none' });
        gsap.set(overlayRef.current, { pointerEvents: 'none' });

        // Animate dialog and overlay
        gsap.fromTo(
          dialogRef.current,
          { scale: 0.9, opacity: 0, y: 20 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.2, // Faster animation
            ease: 'power2.out',
            onComplete: () => {
              // Enable pointer events after animation
              gsap.set(dialogRef.current, { pointerEvents: 'auto' });
              gsap.set(overlayRef.current, { pointerEvents: 'auto' });
              isAnimating.current = false;
            },
          }
        );
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 0.6, duration: 0.2, ease: 'power2.out' }
        );
      }
    } else {
      if (dialogRef.current && overlayRef.current) {
        gsap.to(dialogRef.current, {
          scale: 0.9,
          opacity: 0,
          y: 20,
          duration: 0.15,
          ease: 'power2.in',
        });
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.15,
          ease: 'power2.in',
        });
      }
    }
  }, [isOpen]);

  // Prevent clicks during animation to avoid accidental cancel
  const handleClose = (e) => {
    if (isAnimating.current) {
      e.stopPropagation();
      return;
    }
    onClose();
  };

  const handleAction = (e) => {
    if (isAnimating.current || isLoading) {
      e.stopPropagation();
      return;
    }
    onAction();
  };

  // Responsive variant styles
  const variantStyles = {
    default: {
      dialog: 'bg-white border border-gray-200 rounded-xl shadow-2xl',
      actionButton: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    warning: {
      dialog: 'bg-white border-2 border-yellow-500 rounded-xl shadow-2xl',
      actionButton: 'bg-yellow-600 text-white hover:bg-yellow-700',
    },
  };

  const { dialog: dialogStyle, actionButton: actionButtonStyle } =
    variantStyles[variant] || variantStyles.default;

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black opacity-60 z-[1000]"
        onClick={handleClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[1010] pointer-events-none">
        <div
          ref={dialogRef}
          className={`p-4 sm:p-6 max-w-[90vw] sm:max-w-md w-full mx-4 relative ${dialogStyle} pointer-events-auto max-h-[80vh] overflow-y-auto`}
        >
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
            aria-label="Close dialog"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="space-y-4 pr-2">
            {headline && (
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{headline}</h2>
            )}
            {description && <p className="text-sm sm:text-base text-gray-600">{description}</p>}
            {children && <div className="text-sm sm:text-base">{children}</div>}
          </div>
          {(actionText && onAction) && (
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm sm:text-base transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md flex items-center space-x-2 ${actionButtonStyle} text-sm sm:text-base transition-all duration-200 disabled:opacity-50`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <>
                    {actionIcon && <span className="w-4 h-4 sm:w-5 sm:h-5">{actionIcon}</span>}
                    <span>{actionText}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default Dialog;