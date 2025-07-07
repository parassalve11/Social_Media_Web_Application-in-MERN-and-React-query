import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Button = ({
  children,
  variant = 'solid',
  color = 'default',
  size = 'md',
  radius = 'md',
  startContent,
  endContent,
  spinner,
  spinnerPlacement = 'start',
  fullWidth = false,
  isIconOnly = false,
  isDisabled = false,
  isLoading = false,
  disableRipple = false,
  disableAnimation = false,
  className = '', // Add className prop for custom styling
  ...props
}) => {
  const buttonRef = useRef(null);

  // Tailwind CSS classes based on props
  const baseClasses = 'relative flex items-center justify-center gap-2 font-medium transition-all duration-300';
  const variantClasses = {
    solid: {
      default: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-purple-500 text-white hover:bg-purple-600',
      success: 'bg-green-500 text-white hover:bg-green-600',
      warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
      danger: 'bg-red-500 text-white hover:bg-red-600',
    },
    bordered: {
      default: 'border border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100',
      primary: 'border border-blue-500 bg-transparent text-blue-500 hover:bg-blue-50',
      secondary: 'border border-purple-500 bg-transparent text-purple-500 hover:bg-purple-50',
      success: 'border border-green-500 bg-transparent text-green-500 hover:bg-green-50',
      warning: 'border border-yellow-500 bg-transparent text-yellow-500 hover:bg-yellow-50',
      danger: 'border border-red-500 bg-transparent text-red-500 hover:bg-red-50',
    },
    light: {
      default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      primary: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      secondary: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      success: 'bg-green-100 text-green-600 hover:bg-blue-200',
      warning: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
      danger: 'bg-red-100 text-red-600 hover:bg-red-200',
    },
    flat: {
      default: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      primary: 'bg-blue-200 text-blue-800 hover:bg-blue-300',
      secondary: 'bg-purple-200 text-purple-800 hover:bg-purple-300',
      success: 'bg-green-200 text-green-800 hover:bg-green-300',
      warning: 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300',
      danger: 'bg-red-200 text-red-800 hover:bg-red-300',
    },
    faded: {
      default: 'bg-gray-100/50 text-gray-800 hover:bg-gray-200/50',
      primary: 'bg-blue-100/50 text-blue-600 hover:bg-blue-200/50',
      secondary: 'bg-purple-100/50 text-purple-600 hover:bg-purple-200/50',
      success: 'bg-green-100/50 text-green-600 hover:bg-green-200/50',
      warning: 'bg-yellow-100/50 text-yellow-600 hover:bg-yellow-200/50',
      danger: 'bg-red-100/50 text-red-600 hover:bg-red-200/50',
    },
    shadow: {
      default: 'bg-gray-200 text-gray-800 shadow-md hover:shadow-lg',
      primary: 'bg-blue-500 text-white shadow-md hover:shadow-lg',
      secondary: 'bg-purple-500 text-white shadow-md hover:shadow-lg',
      success: 'bg-green-500 text-white shadow-md hover:shadow-lg',
      warning: 'bg-yellow-500 text-white shadow-md hover:shadow-lg',
      danger: 'bg-red-500 text-white shadow-md hover:shadow-lg',
    },
    ghost: {
      default: 'bg-transparent text-gray-800 hover:bg-gray-100',
      primary: 'bg-transparent text-blue-500 hover:bg-blue-50',
      secondary: 'bg-transparent text-purple-500 hover:bg-purple-50',
      success: 'bg-transparent text-green-500 hover:bg-green-50',
      warning: 'bg-transparent text-yellow-500 hover:bg-yellow-50',
      danger: 'bg-transparent text-red-500 hover:bg-red-50',
    },
  };

  const sizeClasses = {
    sm: isIconOnly ? 'h-8 w-8 text-sm' : 'px-3 py-1.5 text-sm',
    md: isIconOnly ? 'h-10 w-10 text-base' : 'px-4 py-2 text-base',
    lg: isIconOnly ? 'h-12 w-12 text-lg' : 'px-6 py-3 text-lg',
  };

  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';
  const fullWidthClass = fullWidth ? 'w-full' : '';

  // Validate variant and color, fallback to defaults if invalid
  const validVariant = variantClasses[variant] ? variant : 'solid';
  const validColor = variantClasses[validVariant][color] ? color : 'default';

  const buttonClasses = [
    baseClasses,
    variantClasses[validVariant][validColor],
    sizeClasses[size],
    radiusClasses[radius],
    disabledClasses,
    fullWidthClass,
    className, // Allow custom classes
  ].join(' ');

  // GSAP animations
  useEffect(() => {
    if (disableAnimation || !buttonRef.current) return;

    const button = buttonRef.current;

    const onEnter = () => {
      gsap.to(button, { scale: 1.05, duration: 0.2, ease: 'power2.out' });
    };

    const onLeave = () => {
      gsap.to(button, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    const onClick = (e) => {
      if (disableRipple || isDisabled || isLoading) return;

      const ripple = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
      ripple.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.4)';
      ripple.style.transform = 'scale(0)';
      ripple.style.pointerEvents = 'none';

      button.appendChild(ripple);

      gsap.to(ripple, {
        scale: 2,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      });
    };

    button.addEventListener('mouseenter', onEnter);
    button.addEventListener('mouseleave', onLeave);
    button.addEventListener('click', onClick);

    return () => {
      button.removeEventListener('mouseenter', onEnter);
      button.removeEventListener('mouseleave', onLeave);
      button.removeEventListener('click', onClick);
    };
  }, [disableAnimation, disableRipple, isDisabled, isLoading]);

  // Spinner component
  const Spinner = () => spinner || (
    <svg
      className={`animate-spin ${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  return (
    <button
      ref={buttonRef}
      className={buttonClasses}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && spinnerPlacement === 'start' && <Spinner />}
      {startContent}
      {!isIconOnly && children}
      {endContent}
      {isLoading && spinnerPlacement === 'end' && <Spinner />}
    </button>
  );
};

export default Button;