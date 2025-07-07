import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Button from '../UI/Button';
// Assuming this is your custom Button component
// Hypothetical Tooltip component, or use a library like @reach/tooltip

const PostAction = ({
  icon,
  text,
  onClick,
  color = 'default', // Matches Button component's color prop
  size = 'sm', // Matches Button component's size prop
  isDisabled = false,
  isLoading = false,
  className = '',
}) => {
  const buttonRef = useRef(null);

  // GSAP animation for hover and click feedback
  useEffect(() => {
    const button = buttonRef.current;

    const onEnter = () => {
      gsap.to(button, {
        scale: 1.1,
        duration: 0.2,
        ease: 'power2.out',
      });
    };

    const onLeave = () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
      });
    };

    button.addEventListener('mouseenter', onEnter);
    button.addEventListener('mouseleave', onLeave);

    return () => {
      button.removeEventListener('mouseenter', onEnter);
      button.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    
      <Button
        ref={buttonRef}
        variant="ghost"
        color={color}
        size={size}
        isDisabled={isDisabled}
        isLoading={isLoading}
        onClick={onClick}
        className={`flex items-center cursor-pointer ${className}`}
        startContent={<span className="mr-1">{icon}</span>}
        aria-label={text}
        disableAnimation={false}
        disableRipple={false}
      >
        <span className="hidden sm:inline">{text}</span>
      </Button>
  );
};

export default PostAction;