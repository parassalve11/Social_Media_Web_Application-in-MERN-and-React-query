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

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(
        dialogRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 0.5, duration: 0.3, ease: 'power2.out' }
      );
    } else {
      gsap.to(dialogRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isOpen]);

  const variantStyles = {
    default: {
      dialog: 'bg-white border border-gray-200',
      actionButton: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    warning: {
      dialog: 'bg-white border-2 border-yellow-500',
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
        className="fixed inset-0 bg-black opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          ref={dialogRef}
          className={`rounded-lg shadow-lg p-6 max-w-md w-full mx-4 relative ${dialogStyle}`}
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close dialog"
          >
            <svg
              className="w-6 h-6"
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
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {headline && (
              <h2 className="text-xl font-semibold text-gray-800">{headline}</h2>
            )}
            {description && <p className="text-gray-600">{description}</p>}
            {children && <div>{children}</div>}
          </div>
          {(actionText && onAction) && (
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onAction}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${actionButtonStyle}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    {actionIcon && <span>{actionIcon}</span>}
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