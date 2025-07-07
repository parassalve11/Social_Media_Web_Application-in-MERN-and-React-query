import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "react-router-dom"; // Assuming react-router-dom for navigation

// Placeholder for icons (replace with your icon library, e.g., lucide-react)
const UserIcon = () => <span className="text-gray-500">👤</span>;
const AdminIcon = () => <span className="text-gray-500">🛡️</span>;
const GuestIcon = () => <span className="text-gray-500">👥</span>;

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
  const [dropdownPosition, setDropdownPosition] = useState("right");

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
            gsap.to(triggerRef.current, { scale: 1, backgroundColor: variant === "button" ? "#fff1ad" : "transparent", duration: 0.2 });
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
      // Navigate to href (you might want to use history.push or a custom navigation logic)
      window.location.href = href; // Simple redirect; replace with Link navigation if needed
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamically adjust dropdown position based on viewport
  useEffect(() => {
    const updatePosition = () => {
      if (triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const dropdownWidth = 240; // Adjusted for wider content with icons and links
        const viewportWidth = window.innerWidth;

        if (triggerRect.right + dropdownWidth > viewportWidth) {
          setDropdownPosition("left");
        } else {
          setDropdownPosition("right");
        }
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isOpen]);

  // Enhanced GSAP animation for dropdown
  useEffect(() => {
    if (optionsRef.current) {
      const tl = gsap.timeline({ paused: true });
      if (isOpen) {
        tl.fromTo(
          optionsRef.current,
          { y: -20, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: "elastic.out(1, 0.3)",
            display: "block",
          }
        ).play();
      } else {
        tl.to(optionsRef.current, {
          y: -20,
          opacity: 0,
          scale: 0.95,
          duration: 0.3,
          ease: "power2.in",
          display: "none",
        }).play();
      }
    }
  }, [isOpen]);

  // Variant-specific classes and styles
  const getVariantStyles = () => {
    switch (variant) {
      case "minimal":
        return "border border-[#fff1ad]/30 rounded-md shadow-sm bg-white text-sm z-50";
      case "button":
        return "bg-[#fff1ad] hover:bg-[#e6d89c] text-black rounded-md shadow-md z-50 transition-colors duration-200 bg-white px-4 py-2";
      case "card":
        return "bg-white rounded-lg shadow-xl border border-[#fff1ad]/20 p-2 z-50 text-base";
      case "stacked":
        return "bg-white rounded-md shadow-lg border border-[#fff1ad]/20 flex z-50 flex-col items-start text-base";
      default:
        return "bg-white rounded-md shadow-lg border border-[#fff1ad]/20 text-sm z-50";
    }
  };

  return (
    <div className={`relative inline-block  z-60 ${className}`} ref={dropdownRef}>
      {/* Trigger Element with Animation */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className={`cursor-pointer ${variant === "default" ? "" : getVariantStyles()}`}
      >
        {React.cloneElement(triggerElement, {
          className: `${triggerElement.props.className || ""} ${variant === "button" ? "px-4 py-2" : ""}`,
        })}
      </div>

      {/* Dropdown Options with Dynamic Positioning, Icons, and Links */}
      <div
        ref={optionsRef}
        className={`absolute top-full mt-2 w-60 mr-3 ml-auto ${getVariantStyles()}  overflow-hidden`}
        style={{
          display: isOpen ? "block" : "none",
          [dropdownPosition]: 0,
          right: dropdownPosition === "left" ? "100%" : "auto",
          left: dropdownPosition === "right" ? "auto" : 0,
        }}
      >
        {options.map((option,index) => (
          <Link
            key={index }
            to={option.href || "#"} // Fallback to "#" if no href
            onClick={(e) => {
              e.preventDefault(); // Prevent default link behavior
              handleSelect(option.value, option.href);
            }}
            className={`flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors duration-200 no-underline ${
              variant === "minimal"
                ? "text-gray-700 hover:bg-[#fff1ad]/20"
                : variant === "card" || variant === "stacked"
                ? "text-gray-700 hover:bg-[#fff1ad]/30 rounded-md"
                : "text-gray-700 hover:bg-[#fff1ad]/40"
            }`}
          >
            {option.icon && <span className="text-lg">{option.icon}</span>}
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DropdownComponent;