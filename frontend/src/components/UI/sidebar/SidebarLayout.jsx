import React from "react";
import { SidebarProvider, useSidebar } from "./context";
import { BetterSidebar } from "./index";

const SidebarLayout = ({ children, menuItems, logo, footer, className, ...props }) => {
  const ContentWithSidebar = ({ children }) => {
    const { width, isMobile } = useSidebar();
    const marginLeft = isMobile ? 0 : width;

    return (
      <div className="flex w-screen">
        <BetterSidebar
          menuItems={menuItems}
          logo={logo}
          footer={footer}
          className={`shadow-md ${className}`}
          {...props}
        />
        <main
          className="flex-1 p-6 overflow-y-auto bg-white transition-all duration-300"
          style={{ marginLeft: `${marginLeft}px` }}
        >
          {children}
        </main>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <ContentWithSidebar>{children}</ContentWithSidebar>
    </SidebarProvider>
  );
};

export default SidebarLayout;
