// src/UI/sidebar/index.jsx
import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, X, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "./context";


const MenuItem = ({ item, depth = 0 }) => {
  const location = useLocation();
  const { isOpen } = useSidebar();
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const isActive = location.pathname === item.href;
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const toggleSubMenu = () => setIsSubMenuOpen(!isSubMenuOpen);

  return (
    <div className="w-full">
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
            <div className="flex items-center gap-2">
              <span className={`text-sm ${depth > 0 ? "font-normal" : "font-medium"}`}>
                {item.label}
              </span>
              {item.count > 0 && (
                <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                  {item.count}
                </span>
              )}
            </div>
          )}
        </NavLink>
        {hasSubItems && isOpen && (
          <button
            onClick={toggleSubMenu}
            className="p-2 hover:bg-blue-100 rounded-full transition-colors duration-150"
            aria-expanded={isSubMenuOpen}
            aria-label={`Toggle ${item.label} submenu`}
          >
            <ChevronDown
              className={`h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-transform duration-300 ease-in-out ${
                isSubMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>
      {hasSubItems && isOpen && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isSubMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {item.subItems.map((subItem) => (
            <MenuItem key={subItem.label} item={subItem} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const BottomNavItem = ({ item }) => {
  const location = useLocation();
  const isActive = location.pathname === item.href;

  return (
    <NavLink
      to={item.href}
      className={`flex flex-col items-center justify-center flex-1 p-3 transition-all duration-200 ease-in-out ${
        isActive
          ? "text-blue-600 bg-blue-50 rounded-lg scale-105"
          : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
      }`}
      aria-label={item.label}
    >
      <div className="relative flex items-center justify-center">
        <div className={`h-6 w-6 ${isActive ? "font-bold" : ""}`}>
          {item.icon}
        </div>
        {item.count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
            {item.count}
          </span>
        )}
      </div>
      <span className="text-xs mt-1">{item.label}</span>
    </NavLink>
  );
};

export const BetterSidebar = ({ menuItems, logo, footer, className, ...props }) => {
  const { isOpen, toggleSidebar, width, setWidth, isMobile } = useSidebar();
  const sidebarRef = useRef(null);

  const handleDrag = (e) => {
    if (sidebarRef.current && !isMobile) {
      const newWidth = Math.max(200, Math.min(400, e.clientX));
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

  const sidebarContent = (
    <div
      ref={sidebarRef}
      className={`fixed top-0 left-0 bg-gradient-to-b from-white to-gray-50 h-screen flex flex-col border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${
        isOpen ? `w-[${width}px]` : "w-[56px]"
      } ${className}`}
      role="navigation"
      aria-label="Main navigation"
      {...props}
    >
      <div className="p-4 flex items-center justify-between">
        {isOpen ? logo : <div className="w-8 h-8"></div>}
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

  const bottomNavContent = (
    <div
      className={`fixed bottom-0 left-0 right-0 w-screen max-w-none bg-white z-50 md:hidden shadow-lg ${className}`}
      style={{ width: "100vw !important", maxWidth: "none !important" }}
      role="navigation"
      aria-label="Bottom navigation"
      {...props}
    >
      <div className="flex justify-around items-center h-16 border-t border-gray-200">
        {menuItems.slice(0, 5).map((item) => (
          <BottomNavItem key={item.label} item={item} />
        ))}
      </div>
    </div>
  );

  return isMobile ? bottomNavContent : sidebarContent;
};