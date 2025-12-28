import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Button from '../UI/Button';

const PostAction = ({
  icon,
  text,
  onClick,
  color = 'default',
  size = 'sm',
  isDisabled = false,
  isLoading = false,
  className = '',
}) => {
  const buttonRef = useRef(null);

  // Subtle GSAP animations for premium feel: refined timing and easing
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    let hoverCtx, pressCtx;

    const onEnter = () => {
      if (isDisabled || isLoading) return;
      hoverCtx = gsap.context(() => {
        gsap.to(button, {
          scale: 1.02,
          duration: 0.12,
          ease: 'power3.out',
        });
      });
    };

    const onLeave = () => {
      if (isDisabled || isLoading) return;
      hoverCtx?.revert();
    };

    const onPress = () => {
      if (isDisabled || isLoading) return;
      pressCtx = gsap.context(() => {
        gsap.timeline()
          .to(button, {
            scale: 0.97,
            duration: 0.06,
            ease: 'power2.in',
          })
          .to(button, {
            scale: 1,
            duration: 0.1,
            ease: 'power2.out',
          });
      });
    };

    const handleMouseDown = () => {
      onPress();
    };

    button.addEventListener('mouseenter', onEnter);
    button.addEventListener('mouseleave', onLeave);
    button.addEventListener('mousedown', handleMouseDown);
    button.addEventListener('touchstart', handleMouseDown, { passive: true });

    return () => {
      button.removeEventListener('mouseenter', onEnter);
      button.removeEventListener('mouseleave', onLeave);
      button.removeEventListener('mousedown', handleMouseDown);
      button.removeEventListener('touchstart', handleMouseDown);
      hoverCtx?.revert();
      pressCtx?.revert();
    };
  }, [isDisabled, isLoading]);

  // Polished styling: refined colors, spacing, and accessibility
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none shadow-sm';
  const colorClasses = {
    default: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 active:text-gray-900',
    blue: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:bg-blue-100 active:text-blue-800',
    red: 'text-red-500 hover:text-red-600 hover:bg-red-50 active:bg-red-100 active:text-red-700',
    purple: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 active:bg-purple-100 active:text-purple-800',
  };

  const computedClasses = `${baseClasses} ${colorClasses[color] || colorClasses.default} ${className}`;

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      color={color}
      size={size}
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={onClick}
      className={computedClasses}
      startContent={<span className="flex-shrink-0">{icon}</span>}
      aria-label={text ? `${text} action` : 'Action'}
      disableAnimation={true}
      disableRipple={true}
    >
      <span className="hidden sm:inline">{text}</span>
    </Button>
  );
};

export default PostAction;