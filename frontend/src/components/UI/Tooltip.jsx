import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const Tooltip = ({
  children,
  content,
  className = '',
  delay = 0.2,
  minShowTime = 0.1,
}) => {
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);
  const isHoveringTooltip = useRef(false);
  const isHoveringTrigger = useRef(false);

  useEffect(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;

    const calculatePosition = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 640; // sm breakpoint
      const isMedium = viewportWidth < 1024; // md breakpoint

      // Adjust required space based on screen size
      const tooltipWidth = isMobile ? 180 : isMedium ? 240 : 256; // Approximate widths based on w-48, w-60, w-64
      const tooltipHeight = tooltipRect.height;

      // Determine best position based on available space
      const spaceAbove = triggerRect.top;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewportWidth - triggerRect.right;

      const spaces = [
        { pos: 'top', space: spaceAbove, required: tooltipHeight + 8 },
        { pos: 'bottom', space: spaceBelow, required: tooltipHeight + 8 },
        { pos: 'left', space: spaceLeft, required: tooltipWidth + 8 },
        { pos: 'right', space: spaceRight, required: tooltipWidth + 8 },
      ];

      // Find the position with the most available space
      const bestPosition = spaces.reduce((best, current) => {
        if (current.space >= current.required && current.space > best.space) {
          return current;
        }
        return best;
      }, { pos: 'top', space: spaceAbove, required: tooltipHeight + 8 });

      // Set position classes based on best position
      let positionClasses = '';
      let arrowClasses = '';
      switch (bestPosition.pos) {
        case 'top':
          positionClasses = 'bottom-full mb-2 left-1/2 -translate-x-1/2';
          arrowClasses = 'bottom-[-4px] left-1/2 -translate-x-1/2';
          break;
        case 'bottom':
          positionClasses = 'top-full mt-2 left-1/2 -translate-x-1/2';
          arrowClasses = 'top-[-4px] left-1/2 -translate-x-1/2';
          break;
        case 'left':
          positionClasses = 'right-full mr-2 top-1/2 -translate-y-1/2';
          arrowClasses = 'right-[-4px] top-1/2 -translate-y-1/2';
          break;
        case 'right':
          positionClasses = 'left-full ml-2 top-1/2 -translate-y-1/2';
          arrowClasses = 'left-[-4px] top-1/2 -translate-y-1/2';
          break;
        default:
          positionClasses = 'bottom-full mb-2 left-1/2 -translate-x-1/2';
          arrowClasses = 'bottom-[-4px] left-1/2 -translate-x-1/2';
      }

      return { positionClasses, arrowClasses };
    };

    const showTooltip = () => {
      isHoveringTrigger.current = true;

      // Clear any existing hide timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Update position classes dynamically
      const { positionClasses, arrowClasses } = calculatePosition();
      tooltip.className = `
        absolute z-[1010] px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg
        opacity-0 scale-90 transform pointer-events-auto
        ${positionClasses}
        ${className}
      `;
      const arrow = tooltip.querySelector('.tooltip-arrow');
      if (arrow) {
        arrow.className = `absolute w-2 h-2 bg-gray-800 rotate-45 ${arrowClasses}`;
      }

      gsap.to(tooltip, {
        opacity: 1,
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
        delay,
      });
    };

    const hideTooltip = () => {
      if (!isHoveringTrigger.current && !isHoveringTooltip.current) {
        gsap.to(tooltip, {
          opacity: 0,
          scale: 0.9,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            tooltip.style.opacity = '0';
          },
        });
      }
    };

    const handleTriggerEnter = () => {
      showTooltip();
    };

    const handleTriggerLeave = () => {
      isHoveringTrigger.current = false;
      timeoutRef.current = setTimeout(hideTooltip, minShowTime * 1000);
    };

    const handleTooltipEnter = () => {
      isHoveringTooltip.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleTooltipLeave = () => {
      isHoveringTooltip.current = false;
      timeoutRef.current = setTimeout(hideTooltip, minShowTime * 1000);
    };

    const handleScroll = () => {
      isHoveringTrigger.current = false;
      isHoveringTooltip.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      hideTooltip();
    };

    // Event listeners
    trigger.addEventListener('mouseenter', handleTriggerEnter);
    trigger.addEventListener('mouseleave', handleTriggerLeave);
    tooltip.addEventListener('mouseenter', handleTooltipEnter);
    tooltip.addEventListener('mouseleave', handleTooltipLeave);
    window.addEventListener('scroll', handleScroll);

    // Touch support for mobile
    const handleTouchStart = (e) => {
      e.preventDefault();
      if (!isHoveringTrigger.current) {
        showTooltip();
        timeoutRef.current = setTimeout(hideTooltip, minShowTime * 1000);
      }
    };

    trigger.addEventListener('touchstart', handleTouchStart);

    // Cleanup
    return () => {
      trigger.removeEventListener('mouseenter', handleTriggerEnter);
      trigger.removeEventListener('mouseleave', handleTriggerLeave);
      trigger.removeEventListener('touchstart', handleTouchStart);
      tooltip.removeEventListener('mouseenter', handleTooltipEnter);
      tooltip.removeEventListener('mouseleave', handleTooltipLeave);
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, minShowTime, className]);

  return (
    <div className="relative inline-block">
      <div ref={triggerRef} className="inline-block">
        {children}
      </div>
      <div
        ref={tooltipRef}
        className="absolute z-[1010] px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg opacity-0 scale-90 transform pointer-events-auto"
      >
        {content}
        <div className="tooltip-arrow absolute w-2 h-2 bg-gray-800 rotate-45" />
      </div>
    </div>
  );
};

export default Tooltip;