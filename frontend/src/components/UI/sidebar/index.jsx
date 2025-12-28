import React, { useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, X, Menu } from "lucide-react";
import { useSidebar } from "./context";

const MenuItem = ({ item, depth = 0 }) => {
  const location = useLocation();
  const { isOpen } = useSidebar();
  const [isSubOpen, setIsSubOpen] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isActive = location.pathname === item.href;

  const toggleSubMenu = () => setIsSubOpen(!isSubOpen);

  return (
    <div className="w-full relative">
      <div
        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ease-in-out group ${
          isActive
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
        }`}
        style={{ paddingLeft: `${depth * 16 + 16}px` }}
      >
        <NavLink
          to={item.href}
          className="flex items-center gap-3 flex-1 transition-colors duration-200"
        >
          <div className={`${isActive ? "text-white" : "text-blue-500 group-hover:text-blue-600"}`}>
            {item.icon}
          </div>
          {isOpen && (
            <span className={`text-sm ${depth > 0 ? "font-normal" : "font-medium"}`}>
              {item.label}
            </span>
          )}
        </NavLink>

        {hasSubItems && isOpen && (
          <button
            onClick={toggleSubMenu}
            className="p-2 hover:bg-blue-100 rounded-full transition-colors duration-150"
            aria-expanded={isSubOpen}
            aria-label={`Toggle ${item.label} submenu`}
          >
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isSubOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {hasSubItems && isOpen && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isSubOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {item.subItems.map((sub) => (
            <MenuItem key={sub.label} item={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const BetterSidebar = ({ menuItems, logo, footer, className, ...props }) => {
  const { isOpen, toggleSidebar, width, setWidth, isMobile } = useSidebar();
  const sidebarRef = useRef(null);

  // Optional: drag to resize
  const handleDrag = (e) => {
    if (!isMobile && sidebarRef.current) {
      const newWidth = Math.max(56, Math.min(400, e.clientX));
      setWidth(newWidth);
    }
  };
  const startDrag = () => {
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);
  };
  const stopDrag = () => {
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);
  };

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 left-0 h-screen flex flex-col border-r border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isOpen ? `w-[${width}px]` : "w-14"
      } ${className}`}
      role="navigation"
      {...props}
    >
      <div className="p-4 flex items-center justify-between">
        {isOpen ? logo : <div className="w-8 h-8">{logo}</div>}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-blue-100 rounded-full transition-colors duration-150"
          aria-label={isOpen ? "Minimize sidebar" : "Expand sidebar"}
        >
          {isOpen ? <X className="h-5 w-5 text-blue-600" /> : <Menu className="h-5 w-5 text-blue-600" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {menuItems.map((item) => (
          <MenuItem key={item.label} item={item} />
        ))}
      </nav>

      {isOpen && footer && (
        <div className="p-4 border-t border-gray-200" role="contentinfo">
          {footer}
        </div>
      )}

      {!isMobile && isOpen && (
        <div
          className="absolute top-0 right-0 w-1 h-full bg-gray-200 cursor-col-resize hover:bg-blue-400 transition-colors duration-150"
          onMouseDown={startDrag}
          role="separator"
          aria-label="Resize sidebar"
        />
      )}
    </div>
  );
};
