import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "react-router-dom";

const DropdownComponent = ({
  triggerElement,
  options = [],
  onSelect,
  variant = "default", // Variants: 'default', 'minimal', 'button', 'card', 'stacked'
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const optionsRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ horizontal: "right", vertical: "bottom" });

  // Toggle dropdown visibility with trigger animation
  const handleToggle = () => {
    if (triggerRef.current) {
      gsap.fromTo(
        triggerRef.current,
        { scale: 1, backgroundColor: variant === "button" ? "#fff1ad" : "transparent" },
        {
          scale: 1.05,
          backgroundColor: variant === "button" ? "#e6d89c" : "#f0f0f0",
          duration: 0.2,
          ease: "power1.out",
          onComplete: () => {
            gsap.to(triggerRef.current, {
              scale: 1,
              backgroundColor: variant === "button" ? "#fff1ad" : "transparent",
              duration: 0.2,
            });
            setIsOpen(!isOpen);
          },
        }
      );
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Handle option selection or navigation
  const handleSelect = (value, href) => {
    if (onSelect) onSelect(value);
    if (href) {
      window.location.href = href; // Replace with useNavigate for SPA
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Dynamically adjust dropdown position and size based on viewport
  useEffect(() => {
    const updatePosition = () => {
      if (triggerRef.current && optionsRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const dropdownRect = optionsRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth < 640;

        // Set dropdown width based on screen size
        const dropdownWidth = isMobile
          ? Math.min(180, viewportWidth - 16) // Compact width for mobile
          : Math.min(240, viewportWidth - 16); // Standard width for larger screens

        // Determine horizontal position
        let horizontal = "right";
        const spaceRight = viewportWidth - triggerRect.right;
        const spaceLeft = triggerRect.left;

        if (spaceRight < dropdownWidth && spaceLeft >= dropdownWidth) {
          horizontal = "left";
        } else if (spaceRight < dropdownWidth && spaceLeft < dropdownWidth) {
          // Center if there's not enough space on either side
          horizontal = "center";
        }

        // Determine vertical position
        let vertical = "bottom";
        if (triggerRect.bottom + dropdownRect.height > viewportHeight - 8) {
          vertical = "top";
        }

        setDropdownPosition({ horizontal, vertical });

        // Update dropdown width
        if (optionsRef.current) {
          optionsRef.current.style.width = `${dropdownWidth}px`;
          optionsRef.current.style.minWidth = isMobile ? "150px" : "200px";
          optionsRef.current.style.maxWidth = `${viewportWidth - 16}px`;
        }
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen]);

  // GSAP animation for dropdown (optimized for mobile)
  useEffect(() => {
    if (optionsRef.current) {
      const isMobile = window.innerWidth < 640;
      const tl = gsap.timeline({ paused: true });
      if (isOpen) {
        tl.fromTo(
          optionsRef.current,
          { y: dropdownPosition.vertical === "top" ? 10 : -10, opacity: 0, scale: isMobile ? 1 : 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: isMobile ? 0.15 : 0.3,
            ease: isMobile ? "power2.out" : "power2.out",
            display: "block",
          }
        ).play();
      } else {
        tl.to(optionsRef.current, {
          y: dropdownPosition.vertical === "top" ? 10 : -10,
          opacity: 0,
          scale: isMobile ? 1 : 0.98,
          duration: 0.15,
          ease: "power2.in",
          display: "none",
        }).play();
      }
    }
  }, [isOpen, dropdownPosition]);

  // Variant-specific classes and styles
  const getVariantStyles = () => {
    switch (variant) {
      case "minimal":
        return "border border-[#fff1ad]/30 rounded-md shadow-sm bg-white text-sm";
      case "button":
        return "bg-[#fff1ad] hover:bg-[#e6d89c] text-black rounded-md shadow-md transition-colors duration-200 px-4 py-2";
      case "card":
        return "bg-white rounded-lg shadow-xl border border-[#fff1ad]/20 p-2 text-base";
      case "stacked":
        return "bg-white rounded-md shadow-lg border border-[#fff1ad]/20 flex flex-col items-start text-base";
      default:
        return "bg-white rounded-md shadow-lg border border-[#fff1ad]/20 text-sm";
    }
  };

  return (
    <div className={`relative inline-block z-[1000] ${className}`} ref={dropdownRef}>
      {/* Trigger Element with Animation */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        onTouchStart={handleToggle}
        className={`cursor-pointer ${variant === "default" ? "" : getVariantStyles()}`}
      >
        {React.cloneElement(triggerElement, {
          className: `${triggerElement.props.className || ""} ${
            variant === "button" ? "px-4 py-2" : ""
          }`,
        })}
      </div>

      {/* Dropdown Options with Dynamic Positioning, Icons, and Links */}
      <div
        ref={optionsRef}
        className={`absolute mt-1 max-w-[calc(100vw-16px)] ${getVariantStyles()} overflow-hidden`}
        style={{
          display: isOpen ? "block" : "none",
          top: dropdownPosition.vertical === "top" ? "auto" : "100%",
          bottom: dropdownPosition.vertical === "top" ? "100%" : "auto",
          left:
            dropdownPosition.horizontal === "center"
              ? `calc(50% - ${optionsRef.current?.offsetWidth / 2 || 90}px)`
              : dropdownPosition.horizontal === "left"
              ? "auto"
              : 8,
          right:
            dropdownPosition.horizontal === "center"
              ? "auto"
              : dropdownPosition.horizontal === "left"
              ? 8
              : "auto",
          transform: dropdownPosition.horizontal === "center" ? "translateX(-50%)" : "none",
          zIndex: 1000,
        }}
      >
        {options.map((option, index) => (
          <Link
            key={index}
            to={option.href || "#"}
            onClick={(e) => {
              e.preventDefault();
              handleSelect(option.value, option.href);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              handleSelect(option.value, option.href);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors duration-200 no-underline ${
              variant === "minimal"
                ? "text-gray-700 hover:bg-[#fff1ad]/20"
                : variant === "card" || variant === "stacked"
                ? "text-gray-700 hover:bg-[#fff1ad]/30 rounded-md"
                : "text-gray-700 hover:bg-[#fff1ad]/40"
            } text-sm sm:text-xs`} // Smaller text on mobile
          >
            {option.icon && <span className="text-base sm:text-sm">{option.icon}</span>}
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DropdownComponent;