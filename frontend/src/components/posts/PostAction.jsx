import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const PostAction = ({
  icon,
  text,
  onClick,
  color = 'default',
  className = '',
  isDisabled = false,
  isLoading = false,
}) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || isDisabled || isLoading) return;

    const onEnter = () => {
      gsap.to(button, { scale: 1.1, duration: 0.2, ease: "back.out(1.7)" });
    };
    const onLeave = () => {
      gsap.to(button, { scale: 1, duration: 0.2, ease: "power2.out" });
    };
    const onPress = () => {
      gsap.to(button, { scale: 0.9, duration: 0.1 });
      gsap.to(button, { scale: 1, duration: 0.1, delay: 0.1 });
    };

    button.addEventListener('mouseenter', onEnter);
    button.addEventListener('mouseleave', onLeave);
    button.addEventListener('mousedown', onPress);

    return () => {
      button.removeEventListener('mouseenter', onEnter);
      button.removeEventListener('mouseleave', onLeave);
      button.removeEventListener('mousedown', onPress);
    };
  }, [isDisabled, isLoading]);

  const colorMap = {
    default: 'hover:text-black text-gray-700',
    red: 'hover:text-red-500 text-gray-700',
    blue: 'hover:text-blue-500 text-gray-700',
    purple: 'hover:text-purple-500 text-gray-700',
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className={`flex items-center gap-1 transition-colors duration-200 focus:outline-none ${colorMap[color]} ${className}`}
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100/80 transition-all">
        {icon}
      </span>
      {text && <span className="text-sm font-semibold pr-2">{text}</span>}
    </button>
  );
};

export default PostAction;