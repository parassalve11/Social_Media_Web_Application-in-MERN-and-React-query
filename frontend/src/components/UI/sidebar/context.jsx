import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext(undefined);

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sidebarOpen") !== "false";
  });
  const [width, setWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // Tailwind's md breakpoint
      setIsMobile(mobile);
      if (!mobile && !isOpen && localStorage.getItem("sidebarOpen") !== "false") {
        setIsOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebarOpen", isOpen.toString());
    }
  }, [isOpen, isMobile]);

  const toggleSidebar = () => setIsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, width, setWidth, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};